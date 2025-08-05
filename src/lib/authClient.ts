import type { Database } from '@/types/supabase';
import { supabase } from '@/utils/supabase/client';

// ✅ Obtener la sesión
export async function getSessionClient() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) throw error;

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

// ✅ Obtener detalles del usuario
export async function getUserDetailsClient() {
  try {
    const session = await getSessionClient();

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
