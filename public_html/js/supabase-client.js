import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase keys are missing! Check your .env file and vite.config.js');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('Supabase client initialized:', supabase)
