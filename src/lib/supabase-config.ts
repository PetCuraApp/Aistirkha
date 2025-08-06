// Configuración centralizada para Supabase
export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
    debug: process.env.NODE_ENV === 'development'
  },
  global: {
    headers: {
      'X-Client-Info': 'airstikha-massage'
    }
  }
};

// Validar que las variables de entorno estén presentes
if (!SUPABASE_CONFIG.url) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!SUPABASE_CONFIG.anonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
} 