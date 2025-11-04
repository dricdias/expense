-- Update RLS and defaults for group_invites to allow members or creators to invite
BEGIN;

-- Ensure helper function exists
CREATE OR REPLACE FUNCTION public.is_group_member(group_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = group_uuid AND user_id = user_uuid
  );
$$;

-- Ensure RLS enabled
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- Useful defaults
ALTER TABLE public.group_invites
  ALTER COLUMN invited_by SET DEFAULT auth.uid();
ALTER TABLE public.group_invites
  ALTER COLUMN status SET DEFAULT 'pending';

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Users can view their own invites" ON public.group_invites;
DROP POLICY IF EXISTS "Group creators can create invites" ON public.group_invites;
DROP POLICY IF EXISTS "Group members can create invites" ON public.group_invites;
DROP POLICY IF EXISTS "Group members or creators can create invites" ON public.group_invites;
DROP POLICY IF EXISTS "Invited users can update their invites" ON public.group_invites;
DROP POLICY IF EXISTS "Invited user can update own invite" ON public.group_invites;

-- Recreate SELECT policy (invited user can view)
CREATE POLICY "Users can view their own invites"
  ON public.group_invites FOR SELECT
  USING (auth.uid() = invited_user_id);

-- INSERT policy: members OR creators can invite; invited_by must equal auth.uid()
CREATE POLICY "Group members or creators can create invites"
  ON public.group_invites FOR INSERT
  WITH CHECK (
    (
      public.is_group_member(group_id, auth.uid()) OR
      EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
    )
    AND invited_by = auth.uid()
  );

-- UPDATE policy: invited user can update own invite
CREATE POLICY "Invited user can update own invite"
  ON public.group_invites FOR UPDATE
  USING (invited_user_id = auth.uid())
  WITH CHECK (invited_user_id = auth.uid());

COMMIT;