import type { Database } from '@/types/supabase';
import { supabase, ensureValidSession } from '@/utils/supabase/client';

// ✅ Obtener la sesión con verificación mejorada
export async function getSessionClient() {
  try {
    console.log('getSessionClient: Starting...');
    const session = await ensureValidSession();
    console.log('getSessionClient: Result:', !!session);
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
      console.log('getUserDetailsClient: No session user ID');
      return null;
    }

    console.log('getUserDetailsClient: Fetching details for user:', session.user.id);

    const { data: userDetails, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('getUserDetailsClient: Error al obtener detalles del usuario:', error);
      throw error;
    }

    console.log('getUserDetailsClient: User details found:', !!userDetails);
    return userDetails;
  } catch (error) {
    console.error('getUserDetailsClient: Error al obtener detalles del usuario:', error);
    return null;
  }
}

// ✅ Función para verificar si el usuario está autenticado
export async function isAuthenticated() {
  const session = await getSessionClient();
  return !!session;
}

// ✅ Función para obtener el usuario actual
export async function getCurrentUser() {
  const session = await getSessionClient();
  return session?.user || null;
}
