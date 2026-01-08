-- Insert the admin user directly using the UUID from the screenshot
-- This bypasses UI issues in the Table Editor
insert into profiles (id, role)
values ('1ceab419-43a7-4dc2-83f5-39692d740563', 'admin')
on conflict (id) do update set role = 'admin';
