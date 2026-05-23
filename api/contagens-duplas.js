import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Não autorizado' });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Token inválido' });
  if (user.email !== process.env.VITE_ADMIN_EMAIL) return res.status(403).json({ error: 'Sem permissão' });

  try {
    const [{ data: pacs }, { data: cons }] = await Promise.all([
      supabase.from('pacientes').select('duo_id'),
      supabase.from('consultas').select('duo_id'),
    ]);

    const contagens = {};
    (pacs || []).forEach(p => {
      if (!contagens[p.duo_id]) contagens[p.duo_id] = { pacientes: 0, consultas: 0 };
      contagens[p.duo_id].pacientes++;
    });
    (cons || []).forEach(c => {
      if (!contagens[c.duo_id]) contagens[c.duo_id] = { pacientes: 0, consultas: 0 };
      contagens[c.duo_id].consultas++;
    });

    return res.status(200).json({ contagens });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
