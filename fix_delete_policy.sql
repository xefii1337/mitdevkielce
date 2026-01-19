-- FIX MISSING UPDATE/DELETE POLICIES FOR APPOINTMENTS
-- Admins could view appointments but not edit or delete them.

-- 1. Allow Admins to UPDATE appointments (Edit details)
DROP POLICY IF EXISTS "Admins can update appointments" ON appointments;
CREATE POLICY "Admins can update appointments"
ON appointments FOR UPDATE
TO authenticated
USING ( is_admin() )
WITH CHECK ( is_admin() );

-- 2. Allow Admins to DELETE appointments
DROP POLICY IF EXISTS "Admins can delete appointments" ON appointments;
CREATE POLICY "Admins can delete appointments"
ON appointments FOR DELETE
TO authenticated
USING ( is_admin() );
