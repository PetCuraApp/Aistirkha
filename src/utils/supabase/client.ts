import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

export function createClient() {
  // Verificar si estamos en un entorno de navegador
  const isBrowser = typeof window !== 'undefined';

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof window === 'undefined') return [];
          return document.cookie.split('; ').reduce((cookies, cookie) => {
            const [name, value] = cookie.split('=');
            if (name && value) {
              cookies.push({ name, value });
            }
            return cookies;
          }, [] as { name: string; value: string }[]);
        },
        setAll(cookiesToSet) {
          if (typeof window === 'undefined') return;
          cookiesToSet.forEach(({ name, value }) => {
            document.cookie = `${name}=${value}`;
          });
        },
      },
    }
  );
}