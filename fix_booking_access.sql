-- Fix RLS Policy for Appointments Table
-- Problem: The previous policies only allowed 'anon' (unauthenticated) users to insert/select.
-- Logged-in users (authenticated) were blocked from booking.

-- 1. Drop old restrictive policies
drop policy if exists "Public insert access" on appointments;
drop policy if exists "Public read access" on appointments;

-- 2. Create new policies that allow EVERYONE (anon and authenticated)

-- Allow everyone to insert (book a visit)
create policy "Everyone can insert appointments"
on appointments for insert
to public
with check (true);

-- Allow everyone to read (needed to check for busy slots)
create policy "Everyone can read appointments"
on appointments for select
to public
using (true);
