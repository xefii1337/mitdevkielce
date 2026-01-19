-- SECURITY HARDENING SCRIPT
-- This script enforces strict Row Level Security (RLS) policies to prevent data leaks.

-- ==============================================================================
-- 1. APPOINTMENTS TABLE (High Risk: Contains Phone, Address, Names)
-- ==============================================================================

-- Enable RLS (just in case)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- DROP DANGEROUS POLICIES (Public Read Access)
DROP POLICY IF EXISTS "Public read access" ON appointments;
DROP POLICY IF EXISTS "Everyone can read appointments" ON appointments;

-- CREATE SECURE RPC FUNCTION (To check availability without exposing details)
CREATE OR REPLACE FUNCTION get_busy_slots()
RETURNS TABLE (appointment_date TIMESTAMP WITH TIME ZONE)
LANGUAGE sql
SECURITY DEFINER -- Runs as admin
AS $$
  SELECT appointment_date
  FROM appointments
  WHERE status = 'confirmed'
  AND appointment_date >= NOW();
$$;

-- ALLOW ADMINS TO READ EVERYTHING
DROP POLICY IF EXISTS "Admins can read all appointments" ON appointments;
CREATE POLICY "Admins can read all appointments"
ON appointments FOR SELECT
TO authenticated
USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- ALLOW PUBLIC INSERT (Anyone can book, but not read)
DROP POLICY IF EXISTS "Public insert access" ON appointments;
DROP POLICY IF EXISTS "Everyone can insert appointments" ON appointments;
CREATE POLICY "Public insert access"
ON appointments FOR INSERT
TO public
WITH CHECK (true);


-- ==============================================================================
-- 2. LOGIN HISTORY TABLE (Medium Risk: IP, Location)
-- ==============================================================================

ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- DROP ANY POTENTIAL PUBLIC READ POLICIES
DROP POLICY IF EXISTS "Public read access" ON login_history;

-- ALLOW USERS TO INSERT THEIR OWN DATA
DROP POLICY IF EXISTS "Users can insert their own login history" ON login_history;
CREATE POLICY "Users can insert their own login history"
ON login_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ALLOW ADMINS TO VIEW ALL
DROP POLICY IF EXISTS "Admins can view all login history" ON login_history;
CREATE POLICY "Admins can view all login history"
ON login_history FOR SELECT
USING (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);


-- ==============================================================================
-- 3. PROFILES TABLE (User Roles)
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- USERS VIEW OWN
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- ADMINS VIEW ALL
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);
