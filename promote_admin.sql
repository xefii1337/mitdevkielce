-- Promote user to admin by email
insert into profiles (id, role)
select id, 'admin' 
from auth.users 
where email = 'mobilnypomocnik@gmail.com'
on conflict (id) do update set role = 'admin';
