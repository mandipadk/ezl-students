import { createClient } from '@supabase/supabase-js';
import { publicConfig } from './config';

// Get Supabase URL and key from config
const { url, anonKey } = publicConfig.supabase;

if (!url || !anonKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(url, anonKey); 