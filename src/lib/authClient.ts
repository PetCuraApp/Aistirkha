import type { Database } from '@/types/supabase';
import { supabase, ensureValidSession } from '@/utils/supabase/client';

// ✅ Obtener la sesión con verificación mejorada
export async function getSessionClient() {
  try {
    const session = await ensureValidSession();
    
    console.log('getSessionClient - Session:', session ? 'Existe' : 'No existe');
    if (session) {
      console.log('User ID:', session.user.id);
      console.log('User Email:', session.user.email);
    }

    return session;
  } catch (error) {
    console.error('Error al obtener la sesión:', error);
    return null;
  }
}

// ✅ Obtener detalles del usuario con sesión verificada
export async function getUserDetailsClient() {
  try {
    const session = await ensureValidSession();

    if (!session?.user.id) {
      console.log('getUserDetailsClient - No hay sesión de usuario');
      return null;
    }

    const { data: userDetails, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error al obtener detalles del usuario:', error);
      throw error;
    }

    console.log('getUserDetailsClient - Detalles del usuario:', userDetails);
    return userDetails;
  } catch (error) {
    console.error('Error al obtener detalles del usuario:', error);
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
