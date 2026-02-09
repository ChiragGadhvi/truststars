import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  // Fallback to anon key if service role is missing, but it won't help with RLS.
  // Warning: This requires SUPABASE_SERVICE_ROLE_KEY to be set in environment variables.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
