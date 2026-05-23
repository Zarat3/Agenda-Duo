import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { nomeDupla, emailA, senhaA, nomeA, emailB, senhaB, nomeB } = req.body ?? {};

  if (!nomeDupla || !emailA || !senhaA || !nomeA || !emailB || !senhaB || !nomeB) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }
  if (senhaA.length < 6 || senhaB.length < 6) {
    return res.status(400).json({ error: 'As senhas devem ter pelo menos 6 caracteres.' });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  let duplaId = null;
  let userAId = null;

  try {
    const { data: dupla, error: errDupla } = await supabase
      .from('duplas')
      .insert([{
        nome: nomeDupla.trim(),
        status: 'ativo',
        nome_a: nomeA.trim(),
        nome_b: nomeB.trim(),
        email_a: emailA.trim().toLowerCase(),
        email_b: emailB.trim().toLowerCase(),
      }])
      .select()
      .single();
    if (errDupla) throw new Error(errDupla.message);
    duplaId = dupla.id;

    const { data: dataA, error: errA } = await supabase.auth.admin.createUser({
      email: emailA.trim().toLowerCase(),
      password: senhaA,
      user_metadata: { duo_id: duplaId, status: 'ativo' },
      email_confirm: true,
    });
    if (errA) throw new Error(`Estudante A: ${errA.message}`);
    userAId = dataA.user.id;

    const { data: dataB, error: errB } = await supabase.auth.admin.createUser({
      email: emailB.trim().toLowerCase(),
      password: senhaB,
      user_metadata: { duo_id: duplaId, status: 'ativo' },
      email_confirm: true,
    });
    if (errB) throw new Error(`Estudante B: ${errB.message}`);

    await supabase.from('duplas').update({
      user_a_id: userAId,
      user_b_id: dataB.user.id,
    }).eq('id', duplaId);

    await supabase.from('configuracoes').upsert(
      {
        duo_id: duplaId,
        estudante_a: nomeA.trim(),
        estudante_b: nomeB.trim(),
        nome_clinica: 'Clínica Odontológica Universitária',
        horarios_ativos: ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','16:20','17:20','18:20'],
        dias_ativos: [1,2,3,4,5,6],
      },
      { onConflict: 'duo_id', ignoreDuplicates: true }
    );

    return res.status(200).json({ ok: true });

  } catch (err) {
    if (userAId) await supabase.auth.admin.deleteUser(userAId).catch(() => {});
    if (duplaId) {
      try { await supabase.from('duplas').delete().eq('id', duplaId); } catch {}
    }
    return res.status(500).json({ error: err.message });
  }
}
