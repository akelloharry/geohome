import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// Default to `public` unless an explicit schema is provided via env var.
const supabaseSchema = process.env.NEXT_PUBLIC_SUPABASE_DB_SCHEMA || 'public'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: supabaseSchema
  }
})

export default supabase
