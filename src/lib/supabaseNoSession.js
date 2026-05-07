import { createClient } from '@supabase/supabase-js';

// Cliente separado para criar usuários sem sobrescrever a sessão do admin
export const supabaseNoSession = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);
