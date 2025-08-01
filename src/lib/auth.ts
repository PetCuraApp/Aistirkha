import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { redirect } from 'next/navigation';

export async function createServerSupabaseClient() {
  const cookieStore = cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: '', ...options });
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

  const { data: userDetails } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return userDetails;
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

  const { data: userDetails } = await (await createServerSupabaseClient())
    .from('usuarios')
    .select('rol')
    .eq('id', session.user.id)
    .single();

  if (userDetails?.rol !== 'admin') {
    redirect('/');
  }

  return session;
}