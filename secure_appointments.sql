-- 1. Create a secure function to get busy slots
-- This function returns ONLY the dates of appointments, not the personal details.
CREATE OR REPLACE FUNCTION get_busy_slots()
RETURNS TABLE (appointment_date TIMESTAMP WITH TIME ZONE)
LANGUAGE sql
SECURITY DEFINER -- Runs with privileges of the creator (admin), bypassing RLS for the caller
AS $$
  SELECT appointment_date
  FROM appointments
  WHERE status = 'confirmed'
  AND appointment_date >= NOW();
$$;

-- 2. Revoke public read access to the appointments table
-- First, drop the overly permissive policy we created earlier
DROP POLICY IF EXISTS "Everyone can read appointments" ON appointments;
DROP POLICY IF EXISTS "Public read access" ON appointments;

-- 3. Create a restrictive read policy
-- Only allow users to read their own appointments (if we had user accounts for clients)
-- OR only allow admins to read everything.
-- Since clients are anonymous, they shouldn't be able to read the table directly at all.
-- They should ONLY use the get_busy_slots function.

-- Allow admins to read all appointments
CREATE POLICY "Admins can read all appointments"
ON appointments FOR SELECT
TO authenticated
USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- 4. Ensure Insert is still allowed for everyone (so they can book)
-- (We already have "Everyone can insert appointments" or "Public insert access")
-- Let's make sure it's correct.
DROP POLICY IF EXISTS "Everyone can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Public insert access" ON appointments;

CREATE POLICY "Public insert access"
ON appointments FOR INSERT
TO public
WITH CHECK (true);
