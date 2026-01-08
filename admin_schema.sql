-- Create a table for public profiles (linked to auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Policy: Users can view their own profile
create policy "Users can view own profile"
on profiles for select
to authenticated
using (auth.uid() = id);

-- Policy: Admins can view all profiles
create policy "Admins can view all profiles"
on profiles for select
to authenticated
using (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Create a table for page views
create table if not exists page_views (
  id uuid default gen_random_uuid() primary key,
  page text not null,
  count integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table page_views enable row level security;

-- Policy: Anyone can read page views (for display)
create policy "Public read page views"
on page_views for select
to anon, authenticated
using (true);

-- Policy: Anyone can update page views (increment)
create policy "Public update page views"
on page_views for update
to anon, authenticated
using (true)
with check (true);

-- Insert initial row for homepage
insert into page_views (page, count) values ('home', 0);

-- Update appointments policy to allow admins to see all
create policy "Admins can view all appointments"
on appointments for select
to authenticated
using (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);
