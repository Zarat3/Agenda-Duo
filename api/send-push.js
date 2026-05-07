import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { consulta_id } = req.body ?? {};
  if (!consulta_id) return res.status(400).json({ error: 'consulta_id obrigatório' });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
  );

  const { data: consulta } = await supabase
    .from('consultas')
    .select('duo_id, data, horario, paciente_id')
    .eq('id', consulta_id)
    .single();

  if (!consulta) return res.status(404).json({ error: 'consulta não encontrada' });

  const { data: paciente } = await supabase
    .from('pacientes')
    .select('nome')
    .eq('id', consulta.paciente_id)
    .single();

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('duo_id', consulta.duo_id);

  if (!subs?.length) return res.status(200).json({ sent: 0 });

  const [y, m, d] = consulta.data.split('-');
  const dataFmt = `${d}/${m}/${y}`;
  const primeiroNome = paciente?.nome?.split(' ')[0] || 'Paciente';

  const payload = JSON.stringify({
    title: 'Consulta confirmada! ✅',
    body: `${primeiroNome} confirmou para ${dataFmt} às ${consulta.horario}`,
    url: '/',
  });

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      )
    )
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  res.status(200).json({ sent });
}
