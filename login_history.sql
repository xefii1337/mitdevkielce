-- Create login_history table
create table if not exists public.login_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  country_code text,
  city text,
  ip text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.login_history enable row level security;

-- Policies

-- Allow users to insert their own login record
create policy "Users can insert their own login history"
  on public.login_history for insert
  with check (auth.uid() = user_id);

-- Allow admins to view all login history
create policy "Admins can view all login history"
  on public.login_history for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
