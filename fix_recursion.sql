-- Fix infinite recursion in RLS policies by using a Security Definer function

-- 1. Create a function to check if the current user is an admin
-- SECURITY DEFINER means this function runs with the privileges of the creator (superuser),
-- bypassing RLS checks on the 'profiles' table, thus avoiding recursion.
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$;

-- 2. Drop the problematic recursive policies
drop policy if exists "Admins can view all profiles" on profiles;
drop policy if exists "Admins can update profiles" on profiles;
drop policy if exists "Admins can view all appointments" on appointments;

-- 3. Re-create policies using the safe function

-- Profiles: Admins can view all
create policy "Admins can view all profiles"
on profiles for select
to authenticated
using ( is_admin() );

-- Profiles: Admins can update (change roles)
create policy "Admins can update profiles"
on profiles for update
to authenticated
using ( is_admin() )
with check ( is_admin() );

-- Appointments: Admins can view all
create policy "Admins can view all appointments"
on appointments for select
to authenticated
using ( is_admin() );
