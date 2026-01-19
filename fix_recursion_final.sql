-- FIX INFINITE RECURSION IN RLS POLICIES
-- The error 500 is caused by the policy checking the table itself, creating an infinite loop.

-- 1. Create a secure function to check admin status
-- This function runs as "superuser" (SECURITY DEFINER), bypassing RLS to avoid the loop.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Fix PROFILES Table Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING ( is_admin() );

-- 3. Fix APPOINTMENTS Table Policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read all appointments" ON appointments;
CREATE POLICY "Admins can read all appointments"
ON appointments FOR SELECT
TO authenticated
USING ( is_admin() );

-- 4. Fix LOGIN_HISTORY Table Policies
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all login history" ON login_history;
CREATE POLICY "Admins can view all login history"
ON login_history FOR SELECT
USING ( is_admin() );
