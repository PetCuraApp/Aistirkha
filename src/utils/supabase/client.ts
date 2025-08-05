// src/utils/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 👇 Solo se crea una vez. No hay función createClient, se exporta directo
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
