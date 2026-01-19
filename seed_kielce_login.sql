-- Insert sample login data for Kielce, Poland
insert into public.login_history (user_id, country_code, city, ip, latitude, longitude, region)
select 
  auth.uid(), -- Uses the ID of the user running the script
  'PL',
  'Kielce',
  '127.0.0.1',
  50.8661,
  20.6286,
  'Świętokrzyskie'
from auth.users
limit 1;
