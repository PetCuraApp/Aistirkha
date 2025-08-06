import type { Database } from '@/types/supabase';
import { supabase, ensureValidSession } from '@/utils/supabase/client';

// ✅ Obtener la sesión con verificación mejorada
export async function getSessionClient() {
  try {
    console.log('getSessionClient: Starting...');
    const session = await ensureValidSession();
    
    console.log('getSessionClient - Session:', session ? 'Existe' : 'No existe');
    if (session) {
      console.log('getSessionClient - User ID:', session.user.id);
      console.log('getSessionClient - User Email:', session.user.email);
    }

    return session;
  } catch (error) {
    console.error('getSessionClient: Error al obtener la sesión:', error);
    return null;
  }
}

// ✅ Obtener detalles del usuario con sesión verificada
export async function getUserDetailsClient() {
  try {
    console.log('getUserDetailsClient: Starting...');
    const session = await ensureValidSession();

    if (!session?.user.id) {
      console.log('getUserDetailsClient - No hay sesión de usuario');
      return null;
    }

    console.log('getUserDetailsClient: Fetching user details for ID:', session.user.id);

    const { data: userDetails, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('getUserDetailsClient: Error al obtener detalles del usuario:', error);
      throw error;
    }

    console.log('getUserDetailsClient - Detalles del usuario:', userDetails);
    return userDetails;
  } catch (error) {
    console.error('getUserDetailsClient: Error al obtener detalles del usuario:', error);
    return null;
  }
}

// ✅ Función para verificar si el usuario está autenticado
export async function isAuthenticated() {
  console.log('isAuthenticated: Checking authentication...');
  const session = await getSessionClient();
  const result = !!session;
  console.log('isAuthenticated: Result:', result);
  return result;
}

// ✅ Función para obtener el usuario actual
export async function getCurrentUser() {
  console.log('getCurrentUser: Getting current user...');
  const session = await getSessionClient();
  const user = session?.user || null;
  console.log('getCurrentUser: Result:', user ? 'user found' : 'no user');
  return user;
}
