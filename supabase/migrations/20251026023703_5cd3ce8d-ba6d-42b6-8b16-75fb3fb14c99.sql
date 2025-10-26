-- Drop all existing INSERT policies for group_invites to start fresh
DROP POLICY IF EXISTS "Group creators can create invites" ON public.group_invites;
DROP POLICY IF EXISTS "Group members can create invites" ON public.group_invites;
DROP POLICY IF EXISTS "Members can invite users to their groups" ON public.group_invites;

-- Create a comprehensive policy that allows group members to create invites
CREATE POLICY "Allow group members to create invites"
ON public.group_invites
FOR INSERT
TO authenticated
WITH CHECK (
  -- The person creating the invite must be a member of the group
  EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_members.group_id = group_invites.group_id
    AND group_members.user_id = auth.uid()
  )
  -- The invited_by field must match the current user
  AND invited_by = auth.uid()
);