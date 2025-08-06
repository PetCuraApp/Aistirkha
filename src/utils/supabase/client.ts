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

// Cache para evitar llamadas repetidas
let sessionCache: any = null;
let lastCheck = 0;
const CACHE_DURATION = 5000; // 5 segundos

// Función helper para verificar y refrescar la sesión
export async function ensureValidSession() {
  try {
    const now = Date.now();
    
    // Usar cache si está disponible y es reciente
    if (sessionCache && (now - lastCheck) < CACHE_DURATION) {
      return sessionCache;
    }
    
    console.log('ensureValidSession: Checking session...');
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('ensureValidSession: Error getting session:', error);
      sessionCache = null;
      return null;
    }

    console.log('ensureValidSession: Session found:', !!session);

    // Si no hay sesión, intentar refrescar una sola vez
    if (!session) {
      console.log('ensureValidSession: No session, attempting refresh...');
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('ensureValidSession: Error refreshing session:', refreshError);
        sessionCache = null;
        return null;
      }
      
      console.log('ensureValidSession: Refresh result:', !!refreshedSession);
      sessionCache = refreshedSession;
      lastCheck = now;
      return refreshedSession;
    }

    // Verificar si la sesión está próxima a expirar (5 minutos antes)
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const nowSeconds = Math.floor(now / 1000);
      const timeUntilExpiry = expiresAt - nowSeconds;
      
      // Si expira en menos de 5 minutos, refrescar
      if (timeUntilExpiry < 300) {
        console.log('ensureValidSession: Session expiring soon, refreshing...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('ensureValidSession: Error refreshing session:', refreshError);
          sessionCache = session; // Mantener la sesión actual
        } else {
          sessionCache = refreshedSession;
        }
        lastCheck = now;
        return sessionCache;
      }
    }

    // Actualizar cache
    sessionCache = session;
    lastCheck = now;
    console.log('ensureValidSession: Session is valid');
    return session;
  } catch (error) {
    console.error('ensureValidSession: Unexpected error:', error);
    sessionCache = null;
    return null;
  }
}

// Función para limpiar el cache cuando sea necesario
export function clearSessionCache() {
  sessionCache = null;
  lastCheck = 0;
}
