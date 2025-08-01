import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { redirect } from 'next/navigation';

export async function createServerSupabaseClient() {
  return createPagesServerClient<Database>(
    { cookies: cookies() },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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