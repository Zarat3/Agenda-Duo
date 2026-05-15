import { createClient } from '@supabase/supabase-js';

async function findDuplaUsers(supabase, dupla) {
  if (dupla.user_a_id && dupla.user_b_id) {
    return { userAId: dupla.user_a_id, userBId: dupla.user_b_id };
  }
  // Fallback para duplas antigas (sem user IDs armazenados)
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const duplaUsers = users.filter(u => u.user_metadata?.duo_id === dupla.id);
  return { userAId: duplaUsers[0]?.id ?? null, userBId: duplaUsers[1]?.id ?? null };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Não autorizado' });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Token inválido' });
  if (user.email !== process.env.VITE_ADMIN_EMAIL) return res.status(403).json({ error: 'Sem permissão' });

  const { duplaId, nomeDupla, emailA, senhaA, emailB, senhaB } = req.body ?? {};
  if (!duplaId) return res.status(400).json({ error: 'duplaId obrigatório' });

  try {
    const { data: dupla, error: errDupla } = await supabase
      .from('duplas').select('*').eq('id', duplaId).single();
    if (errDupla || !dupla) throw new Error('Dupla não encontrada');

    const { userAId, userBId } = await findDuplaUsers(supabase, dupla);

    // Atualiza nome da dupla
    if (nomeDupla?.trim()) {
      const { error } = await supabase.from('duplas')
        .update({ nome: nomeDupla.trim() }).eq('id', duplaId);
      if (error) throw new Error(error.message);
    }

    // Atualiza estudante A (independente de B)
    if (userAId) {
      const updates = {};
      if (emailA !== undefined && emailA?.trim()) {
        updates.email = emailA.trim().toLowerCase();
        await supabase.from('duplas').update({ email_a: updates.email }).eq('id', duplaId);
      }
      if (senhaA?.length >= 6) updates.password = senhaA;
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.auth.admin.updateUserById(userAId, updates);
        if (error) throw new Error(`Estudante A: ${error.message}`);
      }
    }

    // Atualiza estudante B (independente de A)
    if (userBId) {
      const updates = {};
      if (emailB !== undefined && emailB?.trim()) {
        updates.email = emailB.trim().toLowerCase();
        await supabase.from('duplas').update({ email_b: updates.email }).eq('id', duplaId);
      }
      if (senhaB?.length >= 6) updates.password = senhaB;
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.auth.admin.updateUserById(userBId, updates);
        if (error) throw new Error(`Estudante B: ${error.message}`);
      }
    }

    // Armazena user IDs se ainda não estavam salvos
    if ((!dupla.user_a_id && userAId) || (!dupla.user_b_id && userBId)) {
      await supabase.from('duplas').update({ user_a_id: userAId, user_b_id: userBId }).eq('id', duplaId);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
