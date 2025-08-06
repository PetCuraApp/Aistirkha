// src/utils/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { SUPABASE_CONFIG } from '@/lib/supabase-config';

// Configuración mejorada del cliente Supabase
export const supabase = createClient<Database>(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  SUPABASE_CONFIG
);

// Función helper para verificar y refrescar la sesión
export async function ensureValidSession() {
  try {
    console.log('ensureValidSession: Starting session check...');
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('ensureValidSession: Error getting session:', error);
      return null;
    }

    console.log('ensureValidSession: Initial session check:', session ? 'exists' : 'null');

    // Si no hay sesión, intentar refrescar
    if (!session) {
      console.log('ensureValidSession: No session found, attempting refresh...');
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('ensureValidSession: Error refreshing session:', refreshError);
        return null;
      }
      
      console.log('ensureValidSession: Refresh result:', refreshedSession ? 'success' : 'failed');
      return refreshedSession;
    }

    // Verificar si la sesión está próxima a expirar (5 minutos antes)
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;
      
      console.log('ensureValidSession: Session expires in', timeUntilExpiry, 'seconds');
      
      // Si expira en menos de 5 minutos, refrescar
      if (timeUntilExpiry < 300) {
        console.log('ensureValidSession: Session expiring soon, refreshing...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('ensureValidSession: Error refreshing session:', refreshError);
          return session; // Retornar la sesión actual si falla el refresh
        }
        
        console.log('ensureValidSession: Session refreshed successfully');
        return refreshedSession;
      }
    }

    console.log('ensureValidSession: Session is valid');
    return session;
  } catch (error) {
    console.error('ensureValidSession: Unexpected error:', error);
    return null;
  }
}
