-- Add new columns for detailed location tracking
alter table public.login_history
add column if not exists latitude float,
add column if not exists longitude float,
add column if not exists region text;
