-- Create valuations table
create table if not exists valuations (
  id uuid default gen_random_uuid() primary key,
  client_contact text not null, -- Email or Phone
  components_json jsonb not null, -- Stores the list of parts
  client_price numeric not null, -- The offer shown to client
  market_price numeric not null, -- The real market value
  profit_potential numeric generated always as (market_price - client_price) stored,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table valuations enable row level security;

-- Policies

-- 1. Public can insert (Submit offer)
create policy "Public insert valuations"
on valuations for insert
to public
with check (true);

-- 2. Admins can view all
create policy "Admins can view all valuations"
on valuations for select
to authenticated
using (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- 3. Admins can update status
create policy "Admins can update valuations"
on valuations for update
to authenticated
using (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);
