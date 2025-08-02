import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

export function createClient() {
  // Simplemente llama a la función sin el objeto de configuración de cookies.
  // Usará localStorage automáticamente, que es el comportamiento correcto y esperado.
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}