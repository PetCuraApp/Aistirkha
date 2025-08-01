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
        // Implementación de getAll y setAll para compatibilidad
        getAll() {
          if (!isBrowser) return [];
          return document.cookie.split('; ').reduce((cookies, cookie) => {
            const [name, value] = cookie.split('=');
            if (name && value) {
              cookies.push({
                name,
                value,
              });
            }
            return cookies;
          }, [] as { name: string; value: string }[]);
        },
        setAll(cookiesToSet) {
          if (!isBrowser) return;
          cookiesToSet.forEach(({ name, value, options }) => {
            this.set(name, value, options);
          });
        },
        // Implementación de get, set y remove como alternativa
        get(name) {
          if (!isBrowser) return undefined;
          const cookies = document.cookie.split('; ');
          const cookie = cookies.find(c => c.startsWith(`${name}=`));
          return cookie ? cookie.split('=')[1] : undefined;
        },
        set(name, value, options) {
          if (!isBrowser) return;
          // Convertir las opciones a string para document.cookie
          let cookieString = `${name}=${value}`;
          if (options) {
            if (options.expires) {
              cookieString += `; expires=${options.expires.toUTCString()}`;
            }
            if (options.path) {
              cookieString += `; path=${options.path}`;
            }
            if (options.domain) {
              cookieString += `; domain=${options.domain}`;
            }
            if (options.secure) {
              cookieString += `; secure`;
            }
            if (options.sameSite) {
              cookieString += `; samesite=${options.sameSite}`;
            }
          }
          document.cookie = cookieString;
        },
        remove(name, options) {
          if (!isBrowser) return;
          // Para eliminar una cookie, la establecemos con una fecha de expiración en el pasado
          const cookieOptions = {
            ...options,
            expires: new Date(0), // Fecha en el pasado
          };
          this.set(name, '', cookieOptions);
        },
      },
    }
  );
}