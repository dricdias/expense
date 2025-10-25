-- Add INSERT policy for settlements table
-- Allow group members to create settlement records
CREATE POLICY "Group members can create settlements"
ON public.settlements
FOR INSERT
TO authenticated
WITH CHECK (is_group_member(group_id, auth.uid()));