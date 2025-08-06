import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { SUPABASE_CONFIG } from './supabase-config';

export const supabase = createClient<Database>(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  SUPABASE_CONFIG
);