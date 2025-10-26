-- First, drop ALL existing INSERT policies for group_invites
DROP POLICY IF EXISTS "Group creators can create invites" ON public.group_invites;
DROP POLICY IF EXISTS "Group members can create invites" ON public.group_invites;

-- Create the new policy allowing group members to invite others
CREATE POLICY "Members can invite users to their groups" 
ON public.group_invites 
FOR INSERT 
TO authenticated
WITH CHECK (
  is_group_member(group_id, auth.uid())
);