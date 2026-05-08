import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  // Verifica JWT do usuário logado
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Não autorizado' });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Token inválido' });
  if (user.email !== process.env.VITE_ADMIN_EMAIL) return res.status(403).json({ error: 'Sem permissão' });

  const { nomeDupla, emailA, senhaA, emailB, senhaB } = req.body ?? {};
  if (!nomeDupla || !emailA || !senhaA || !emailB || !senhaB) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }
  if (senhaA.length < 6 || senhaB.length < 6) {
    return res.status(400).json({ error: 'As senhas devem ter pelo menos 6 caracteres.' });
  }

  let duplaId = null;
  let userAId = null;

  try {
    // 1. Criar dupla
    const { data: dupla, error: errDupla } = await supabase
      .from('duplas')
      .insert([{ nome: nomeDupla }])
      .select()
      .single();
    if (errDupla) throw new Error(`Erro ao criar dupla: ${errDupla.message}`);
    duplaId = dupla.id;

    // 2. Criar estudante A (admin API — ignora signup público, sem email de confirmação)
    const { data: dataA, error: errA } = await supabase.auth.admin.createUser({
      email: emailA,
      password: senhaA,
      user_metadata: { duo_id: dupla.id },
      email_confirm: true,
    });
    if (errA) throw new Error(`Erro ao criar estudante A: ${errA.message}`);
    userAId = dataA.user.id;

    // 3. Criar estudante B
    const { data: dataB, error: errB } = await supabase.auth.admin.createUser({
      email: emailB,
      password: senhaB,
      user_metadata: { duo_id: dupla.id },
      email_confirm: true,
    });
    if (errB) throw new Error(`Erro ao criar estudante B: ${errB.message}`);

    return res.status(200).json({ dupla });

  } catch (err) {
    // Rollback: desfaz o que foi criado na ordem inversa
    if (userAId) await supabase.auth.admin.deleteUser(userAId).catch(() => {});
    if (duplaId) await supabase.from('duplas').delete().eq('id', duplaId).catch(() => {});
    return res.status(500).json({ error: err.message });
  }
}
