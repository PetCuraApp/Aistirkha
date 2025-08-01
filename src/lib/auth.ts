import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { redirect } from 'next/navigation';

export async function createServerSupabaseClient() {
  // cookies() puede ser async en Next.js 13+ (middleware/edge)
  const cookieStore = await cookies();
  // Forzar any para evitar errores de tipo en producción
  return createPagesServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: any) {
          // @ts-ignore
          return (cookieStore as any).get(name)?.value;
        },
        set(name: any, value: any, options: any) {
          // @ts-ignore
          (cookieStore as any).set({ name, value, ...options });
        },
        remove(name: any, options: any) {
          // @ts-ignore
          (cookieStore as any).set({ name, value: '', ...options });
        },
      },
    }
  );
}

export async function getSession() {
  const supabase = await createServerSupabaseClient();
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function getUserDetails() {
  const supabase = await createServerSupabaseClient();
  const session = await getSession();

  if (!session?.user.id) {
    return null;
  }

  const { data: userDetails } = await (supabase
    .from('usuarios')
    .select('*')
    .eq('id', session.user.id as any)
    .single() as any);
  return userDetails as any;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const { data: userDetails } = await ((await createServerSupabaseClient())
    .from('usuarios')
    .select('rol')
    .eq('id', session.user.id as any)
    .single() as any);
  if ((userDetails as any)?.rol !== 'admin') {
    redirect('/');
  }

  return session;
}