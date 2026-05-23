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
    const tables = ['consultas', 'plano_tratamento', 'pacientes', 'dias_bloqueados', 'push_subscriptions', 'perfis', 'configuracoes'];
    for (const table of tables) {
      await supabase.from(table).delete().eq('duo_id', duplaId);
    }
    const { error } = await supabase.from('duplas').delete().eq('id', duplaId);
    if (error) throw new Error(error.message);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
