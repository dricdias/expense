-- Drop existing foreign key constraints and recreate with CASCADE delete

-- Drop and recreate group_members constraint
ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS group_members_group_id_fkey;
ALTER TABLE public.group_members
ADD CONSTRAINT group_members_group_id_fkey 
FOREIGN KEY (group_id) 
REFERENCES public.groups(id) 
ON DELETE CASCADE;

-- Drop and recreate expenses constraint
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_group_id_fkey;
ALTER TABLE public.expenses
ADD CONSTRAINT expenses_group_id_fkey 
FOREIGN KEY (group_id) 
REFERENCES public.groups(id) 
ON DELETE CASCADE;

-- Drop and recreate settlements constraint
ALTER TABLE public.settlements DROP CONSTRAINT IF EXISTS settlements_group_id_fkey;
ALTER TABLE public.settlements
ADD CONSTRAINT settlements_group_id_fkey 
FOREIGN KEY (group_id) 
REFERENCES public.groups(id) 
ON DELETE CASCADE;

-- Drop and recreate group_invites constraint
ALTER TABLE public.group_invites DROP CONSTRAINT IF EXISTS group_invites_group_id_fkey;
ALTER TABLE public.group_invites
ADD CONSTRAINT group_invites_group_id_fkey 
FOREIGN KEY (group_id) 
REFERENCES public.groups(id) 
ON DELETE CASCADE;

-- Drop and recreate expense_splits constraint
ALTER TABLE public.expense_splits DROP CONSTRAINT IF EXISTS expense_splits_expense_id_fkey;
ALTER TABLE public.expense_splits
ADD CONSTRAINT expense_splits_expense_id_fkey 
FOREIGN KEY (expense_id) 
REFERENCES public.expenses(id) 
ON DELETE CASCADE;