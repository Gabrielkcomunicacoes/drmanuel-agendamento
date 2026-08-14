import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam estar definidas no .env',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  // Sessao de login precisa sobreviver a um reload da pagina.
  auth: { persistSession: true, autoRefreshToken: true },
})

export const CRM_TABLE = 'crm_estetica'
