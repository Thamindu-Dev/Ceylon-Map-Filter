import { createClient } from '@supabase/supabase-js';
import { env } from '../env';

// Create a single supabase client for interacting with the database.
// This uses the validated environment variables.
export const supabase = createClient(
  env.supabaseUrl,
  env.supabaseAnonKey
);
