-- Create the appointments table
create table if not exists appointments (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  phone text not null,
  address text not null,
  problem_desc text not null,
  appointment_date timestamp with time zone not null,
  status text default 'confirmed' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table appointments enable row level security;

-- Create a policy to allow public insert (anyone can book)
create policy "Public insert access"
on appointments for insert
to anon
with check (true);

-- Create a policy to allow public read (needed to check for conflicts)
-- In a real app, we might want to restrict this to only show "busy" slots without details,
-- but for this demo, reading all is fine to calculate availability.
create policy "Public read access"
on appointments for select
to anon
using (true);
