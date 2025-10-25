-- Drop problematic policies
DROP POLICY IF EXISTS "Group members can view members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;

-- Create security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(group_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = group_uuid
    AND user_id = user_uuid
  );
$$;

-- Recreate policies using the security definer function
CREATE POLICY "Group members can view members of their groups"
  ON public.group_members FOR SELECT
  USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Users can view groups they are members of"
  ON public.groups FOR SELECT
  USING (public.is_group_member(id, auth.uid()));

-- Update other policies that reference group_members to use the function
DROP POLICY IF EXISTS "Group members can view expenses" ON public.expenses;
CREATE POLICY "Group members can view expenses"
  ON public.expenses FOR SELECT
  USING (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Group members can create expenses" ON public.expenses;
CREATE POLICY "Group members can create expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (
    auth.uid() = paid_by AND
    public.is_group_member(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "Group members can view expense splits" ON public.expense_splits;
CREATE POLICY "Group members can view expense splits"
  ON public.expense_splits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_splits.expense_id
      AND public.is_group_member(e.group_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "Group members can view settlements" ON public.settlements;
CREATE POLICY "Group members can view settlements"
  ON public.settlements FOR SELECT
  USING (public.is_group_member(group_id, auth.uid()));