const { createClient } = require('@supabase/supabase-js');

const url = 'https://gdrlmmaoeafsghklmeqx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkcmxtbWFvZWFmc2doa2xtZXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTQxNzIsImV4cCI6MjA4MDg3MDE3Mn0.FnWuDwnNViqPRmC7sLnjkimXbhgZQjTPEdLs5zVhSuM';

const supabase = createClient(url, key);

async function testConnection() {
    console.log('Testing Supabase connection...');
    try {
        const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Connection failed:', error.message);
            // Try another table if products fails (e.g. maybe RLS blocks count?)
            // But products should be public read.
        } else {
            console.log('Connection successful! Supabase is reachable.');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testConnection();
