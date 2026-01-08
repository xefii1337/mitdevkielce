-- Fix RLS Policy for Components Table
-- Problem: The previous policy only allowed 'anon' (unauthenticated) users to read data.
-- Logged-in users (authenticated) were blocked.

-- 1. Drop the old restrictive policy
drop policy if exists "Public read access" on components;

-- 2. Create a new policy that allows EVERYONE (anon and authenticated) to read
create policy "Everyone can read components"
on components for select
to public
using (true);

-- 3. Verify data exists (optional, just to be sure)
-- If this returns 0 rows, you might need to run seed_data.sql
select count(*) from components;
