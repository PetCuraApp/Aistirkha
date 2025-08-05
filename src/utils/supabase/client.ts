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
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    // Si no hay sesión, intentar refrescar
    if (!session) {
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Error refreshing session:', refreshError);
        return null;
      }
      
      return refreshedSession;
    }

    // Verificar si la sesión está próxima a expirar (5 minutos antes)
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;
      
      // Si expira en menos de 5 minutos, refrescar
      if (timeUntilExpiry < 300) {
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Error refreshing session:', refreshError);
          return session; // Retornar la sesión actual si falla el refresh
        }
        
        return refreshedSession;
      }
    }

    return session;
  } catch (error) {
    console.error('Error in ensureValidSession:', error);
    return null;
  }
}
