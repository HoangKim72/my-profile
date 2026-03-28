-- Run this after:
-- 1. Prisma migrations have created the app tables
-- 2. prisma seed has created the admin/viewer roles
-- 3. the target user has signed in at least once so a row exists in public.users

-- Replace this email before running:
--   your-email@example.com

INSERT INTO public.user_roles ("userId", "roleId")
SELECT u.id, r.id
FROM public.users u
CROSS JOIN public.roles r
WHERE u.email = '<your-email@example.com>'
  AND r.name = 'admin'
ON CONFLICT ("userId", "roleId") DO NOTHING;

select
  u.email,
  array_agg(r.name order by r.name) as roles
from public.users u
join public.user_roles ur on ur."userId" = u.id
join public.roles r on r.id = ur."roleId"
where u.email = '<your-email@example.com>'
group by u.email;
