-- Backfill profiles from auth.users to enable user search by name/email
-- Idempotent UPSERT to ensure existing profiles are updated with email/full_name
BEGIN;

-- Ensure the email column exists before backfilling
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

INSERT INTO public.profiles (id, full_name, avatar_url, email, created_at)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  u.raw_user_meta_data->>'avatar_url',
  u.email,
  NOW()
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  email = EXCLUDED.email;

COMMIT;