-- Create the components table
create table if not exists components (
  id uuid default gen_random_uuid() primary key,
  category text not null check (category in ('gpu', 'cpu', 'mobo', 'ram', 'disk')),
  name text not null,
  purchase_price numeric not null,
  sale_price numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table components enable row level security;

-- Create a policy to allow public read access
create policy "Public read access"
on components for select
to anon
using (true);

-- Create a policy to allow authenticated users (service role) to insert/update/delete
-- This is technically not needed if we use the service role key for seeding, 
-- but good to have if we ever add an admin panel.
create policy "Enable insert for service role only"
on components for insert
to service_role
with check (true);
