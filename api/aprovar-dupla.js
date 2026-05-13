import { createClient } from '@supabase/supabase-js';

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

  const { duplaId } = req.body ?? {};
  if (!duplaId) return res.status(400).json({ error: 'duplaId obrigatório' });

  try {
    const { data: dupla, error: errDupla } = await supabase
      .from('duplas').select('*').eq('id', duplaId).single();
    if (errDupla || !dupla) throw new Error('Dupla não encontrada');

    const { error: errStatus } = await supabase
      .from('duplas').update({ status: 'ativo' }).eq('id', duplaId);
    if (errStatus) throw new Error(errStatus.message);

    for (const uid of [dupla.user_a_id, dupla.user_b_id].filter(Boolean)) {
      await supabase.auth.admin.updateUserById(uid, {
        user_metadata: { duo_id: duplaId, status: 'ativo' },
      });
    }

    // Cria configuracoes iniciais com os nomes dos estudantes
    await supabase.from('configuracoes').upsert(
      {
        duo_id: duplaId,
        estudante_a: dupla.nome_a || 'Estudante A',
        estudante_b: dupla.nome_b || 'Estudante B',
        nome_clinica: 'Clínica Odontológica Universitária',
        horarios_ativos: ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','16:20','17:20','18:20'],
        dias_ativos: [1,2,3,4,5,6],
      },
      { onConflict: 'duo_id', ignoreDuplicates: true }
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
