-- Enable email-based invitations for users not yet registered
BEGIN;

-- 1) Add invited_email and make invited_user_id optional
ALTER TABLE public.group_invites
  ADD COLUMN IF NOT EXISTS invited_email TEXT;

ALTER TABLE public.group_invites
  ALTER COLUMN invited_user_id DROP NOT NULL;

-- 2) Replace unique constraint with partial unique indexes
ALTER TABLE public.group_invites
  DROP CONSTRAINT IF EXISTS group_invites_group_id_invited_user_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS group_invites_unique_user
  ON public.group_invites (group_id, invited_user_id)
  WHERE invited_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS group_invites_unique_email
  ON public.group_invites (group_id, invited_email)
  WHERE invited_email IS NOT NULL;

-- 3) Update SELECT policy to allow viewing by email OR user id
DROP POLICY IF EXISTS "Users can view their own invites" ON public.group_invites;
CREATE POLICY "Users can view their own invites"
  ON public.group_invites FOR SELECT
  USING (
    invited_user_id = auth.uid()
    OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 4) Update UPDATE policy to allow responding by email OR user id
DROP POLICY IF EXISTS "Invited user can update own invite" ON public.group_invites;
DROP POLICY IF EXISTS "Invited users can update their invites" ON public.group_invites;
CREATE POLICY "Invited user can update own invite"
  ON public.group_invites FOR UPDATE
  USING (
    invited_user_id = auth.uid()
    OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    invited_user_id = auth.uid()
    OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 5) Update trigger to add member using invited_user_id OR current user
CREATE OR REPLACE FUNCTION public.handle_invite_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    INSERT INTO public.group_members (group_id, user_id)
    VALUES (NEW.group_id, COALESCE(NEW.invited_user_id, auth.uid()))
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

COMMIT;