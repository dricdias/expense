-- Fix: Allow group creators to see their groups even before becoming members
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;

CREATE POLICY "Users can view their groups"
  ON public.groups FOR SELECT
  USING (
    created_by = auth.uid() OR 
    public.is_group_member(id, auth.uid())
  );