
// Use CDN import for static hosting (esm.sh is reliable for modules)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Hardcoded keys for static deployment
const supabaseUrl = 'https://gdrlmmaoeafsghklmeqx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkcmxtbWFvZWFmc2doa2xtZXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTQxNzIsImV4cCI6MjA4MDg3MDE3Mn0.FnWuDwnNViqPRmC7sLnjkimXbhgZQjTPEdLs5zVhSuM'

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase keys are missing!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
