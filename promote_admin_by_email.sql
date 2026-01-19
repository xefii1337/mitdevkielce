-- Replace 'twoj@email.com' with the actual email of the administrator
UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'twoj@email.com'
);

-- If the profile doesn't exist, insert it (safety net)
INSERT INTO profiles (id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'twoj@email.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
