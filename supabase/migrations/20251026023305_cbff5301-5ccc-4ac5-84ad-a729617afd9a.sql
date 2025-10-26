-- Drop the restrictive policy that only allows group creators to invite
DROP POLICY IF EXISTS "Group creators can create invites" ON public.group_invites;

-- Create a new policy that allows any group member to create invites
CREATE POLICY "Group members can create invites" 
ON public.group_invites 
FOR INSERT 
WITH CHECK (is_group_member(group_id, auth.uid()));