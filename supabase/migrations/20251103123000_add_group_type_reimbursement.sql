-- Add group type and reimbursement debtor, and update expense split function

BEGIN;

-- 1) Add type column to groups
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'split' CHECK (type IN ('split','reimbursement'));

-- 2) Add reimbursement debtor column
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS reimbursement_debtor_id UUID NULL REFERENCES public.profiles(id);

-- 3) Update function to create splits depending on group type
CREATE OR REPLACE FUNCTION public.create_equal_expense_splits()
RETURNS TRIGGER AS $$
DECLARE
  member_count INTEGER;
  split_amount NUMERIC(10,2);
  grp_type TEXT;
  debtor UUID;
BEGIN
  -- Get group type and debtor
  SELECT type, reimbursement_debtor_id INTO grp_type, debtor
  FROM public.groups
  WHERE id = NEW.group_id;

  IF grp_type = 'reimbursement' THEN
    -- Default debtor to group creator if not set
    IF debtor IS NULL THEN
      SELECT created_by INTO debtor FROM public.groups WHERE id = NEW.group_id;
    END IF;

    -- Single split: entire amount owed by debtor
    INSERT INTO public.expense_splits (expense_id, user_id, share_amount)
    VALUES (NEW.id, debtor, NEW.amount);
  ELSE
    -- Equal split among all group members
    SELECT COUNT(*) INTO member_count FROM public.group_members WHERE group_id = NEW.group_id;
    IF member_count > 0 THEN
      split_amount := NEW.amount / member_count;
      INSERT INTO public.expense_splits (expense_id, user_id, share_amount)
      SELECT NEW.id, user_id, split_amount
      FROM public.group_members
      WHERE group_id = NEW.group_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;