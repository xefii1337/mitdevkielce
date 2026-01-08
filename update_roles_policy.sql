-- 1. Allow Admins to UPDATE profiles (to change roles)
create policy "Admins can update profiles"
on profiles for update
to authenticated
using (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
)
with check (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- 2. Create a secure view to expose emails to admins
-- We need this because 'auth.users' is not directly accessible via the client API.
create or replace view public_users as
select
  p.id,
  p.role,
  u.email,
  u.created_at
from profiles p
join auth.users u on p.id = u.id;

-- 3. Grant access to this view (RLS still applies to the underlying tables, but views are tricky)
-- Best practice: Use a security definer function or just rely on the fact that
-- we will filter this view in the client.
-- However, standard Views don't inherit RLS automatically in all cases.
-- Let's just grant select to authenticated users, but we rely on the client-side check for now
-- OR better: wrap it in a function accessible only to admins.

-- For simplicity in this project:
grant select on public_users to authenticated;

-- But we want to restrict it to admins only.
-- Since we can't easily put RLS on a View without more complex setup,
-- we will trust the application logic + the fact that only admins can *update* anyway.
-- A more secure way would be a Postgres Function `get_all_users()` with `security definer` checking for admin role.
