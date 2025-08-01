import type { Database } from '@/types/supabase';
import { createClient } from '@/utils/supabase/client';

// Versión cliente de getSession
export async function getSessionClient() {
  try {
    // Usar el cliente actualizado para obtener la sesión
    const supabaseClient = createClient();
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (error) throw error;
    
    // Registrar información para depuración
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

// Versión cliente de getUserDetails
export async function getUserDetailsClient() {
  try {
    const session = await getSessionClient();

    if (!session?.user.id) {
      console.log('getUserDetailsClient - No hay sesión de usuario');
      return null;
    }

    // Usar el cliente actualizado para obtener los detalles del usuario
    const supabaseClient = createClient();
    const { data: userDetails, error } = await supabaseClient
      .from('usuarios')
      .select('*')
      .eq('id', session.user.id as any)
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