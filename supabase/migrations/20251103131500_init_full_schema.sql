-- Initial schema for new database (Supabase/Postgres)
-- Includes profiles, groups (with type, reimbursement_debtor_id), members,
-- expenses, splits, settlements (with status), invites, functions, triggers, storage policies

BEGIN;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Ensure email column exists even if table was created previously
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create groups table with type and reimbursement debtor
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'split' CHECK (type IN ('split','reimbursement')),
  reimbursement_debtor_id UUID NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create expense_splits table
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  share_amount NUMERIC(10, 2) NOT NULL CHECK (share_amount >= 0),
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(expense_id, user_id)
);

-- Create settlements table with status
CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  from_user UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  settled BOOLEAN NOT NULL DEFAULT FALSE,
  settled_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create group_invites table
CREATE TABLE IF NOT EXISTS public.group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(group_id, invited_user_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- Policies
-- Helper function to avoid recursion in policies
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
-- Profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Groups
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
CREATE POLICY "Users can view groups they are members of"
  ON public.groups FOR SELECT USING (
    public.is_group_member(id, auth.uid()) OR auth.uid() = created_by
  );
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Group creators can update their groups" ON public.groups;
CREATE POLICY "Group creators can update their groups"
  ON public.groups FOR UPDATE USING (auth.uid() = created_by);
DROP POLICY IF EXISTS "Group creators can delete their groups" ON public.groups;
CREATE POLICY "Group creators can delete their groups"
  ON public.groups FOR DELETE USING (auth.uid() = created_by);

-- Group members
DROP POLICY IF EXISTS "Group members can view members of their groups" ON public.group_members;
CREATE POLICY "Group members can view members of their groups"
  ON public.group_members FOR SELECT USING (
    public.is_group_member(group_id, auth.uid()) OR auth.uid() = user_id
  );
DROP POLICY IF EXISTS "Group creators can add members" ON public.group_members;
CREATE POLICY "Group creators can add members"
  ON public.group_members FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups WHERE groups.id = group_members.group_id AND groups.created_by = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Users can remove themselves from groups" ON public.group_members;
CREATE POLICY "Users can remove themselves from groups"
  ON public.group_members FOR DELETE USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.groups WHERE groups.id = group_members.group_id AND groups.created_by = auth.uid()
    )
  );

-- Expenses
DROP POLICY IF EXISTS "Group members can view expenses" ON public.expenses;
CREATE POLICY "Group members can view expenses"
  ON public.expenses FOR SELECT USING (
    public.is_group_member(group_id, auth.uid())
  );
DROP POLICY IF EXISTS "Group members can create expenses" ON public.expenses;
CREATE POLICY "Group members can create expenses"
  ON public.expenses FOR INSERT WITH CHECK (
    auth.uid() = paid_by AND public.is_group_member(group_id, auth.uid())
  );
DROP POLICY IF EXISTS "Expense creators can update their expenses" ON public.expenses;
CREATE POLICY "Expense creators can update their expenses"
  ON public.expenses FOR UPDATE USING (auth.uid() = paid_by);
DROP POLICY IF EXISTS "Expense creators can delete their expenses" ON public.expenses;
CREATE POLICY "Expense creators can delete their expenses"
  ON public.expenses FOR DELETE USING (
    auth.uid() = paid_by OR EXISTS (
      SELECT 1 FROM public.groups WHERE groups.id = expenses.group_id AND groups.created_by = auth.uid()
    )
  );

-- Expense splits
DROP POLICY IF EXISTS "Group members can view expense splits" ON public.expense_splits;
CREATE POLICY "Group members can view expense splits"
  ON public.expense_splits FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.expenses e
      WHERE e.id = expense_splits.expense_id
        AND public.is_group_member(e.group_id, auth.uid())
    )
  );
DROP POLICY IF EXISTS "System can insert expense splits" ON public.expense_splits;
CREATE POLICY "System can insert expense splits"
  ON public.expense_splits FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS "Users can mark their own splits as paid" ON public.expense_splits;
CREATE POLICY "Users can mark their own splits as paid"
  ON public.expense_splits FOR UPDATE USING (auth.uid() = user_id);

-- Settlements
DROP POLICY IF EXISTS "Group members can view settlements" ON public.settlements;
CREATE POLICY "Group members can view settlements"
  ON public.settlements FOR SELECT USING (
    public.is_group_member(group_id, auth.uid())
  );
DROP POLICY IF EXISTS "Involved users can mark settlements as paid" ON public.settlements;
CREATE POLICY "Involved users can mark settlements as paid"
  ON public.settlements FOR UPDATE USING (auth.uid() = from_user OR auth.uid() = to_user);
DROP POLICY IF EXISTS "Users can approve settlements they receive" ON public.settlements;
CREATE POLICY "Users can approve settlements they receive"
  ON public.settlements FOR UPDATE TO authenticated USING (auth.uid() = to_user) WITH CHECK (auth.uid() = to_user);

-- Group invites
DROP POLICY IF EXISTS "Users can view their own invites" ON public.group_invites;
CREATE POLICY "Users can view their own invites"
  ON public.group_invites FOR SELECT USING (auth.uid() = invited_user_id);
DROP POLICY IF EXISTS "Group creators can create invites" ON public.group_invites;
CREATE POLICY "Group creators can create invites"
  ON public.group_invites FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.groups WHERE groups.id = group_id AND groups.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "Invited users can update their invites" ON public.group_invites;
CREATE POLICY "Invited users can update their invites"
  ON public.group_invites FOR UPDATE USING (auth.uid() = invited_user_id);

-- Functions and triggers
-- New user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    email = EXCLUDED.email;
  RETURN NEW;
END;$$;

-- Ensure trigger doesn't already exist (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Approve settlement function
CREATE OR REPLACE FUNCTION public.approve_settlement(settlement_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE settlement_record RECORD; BEGIN
  SELECT * INTO settlement_record FROM settlements WHERE id = settlement_id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Settlement not found or already processed'; END IF;
  UPDATE settlements SET status = 'approved', settled_at = NOW() WHERE id = settlement_id;
  UPDATE expense_splits SET paid = true
  WHERE expense_id IN (
    SELECT e.id FROM expenses e WHERE e.group_id = settlement_record.group_id AND e.paid_by = settlement_record.to_user
  ) AND user_id = settlement_record.from_user;
END;$$;

-- Handle invite approval
CREATE OR REPLACE FUNCTION public.handle_invite_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    INSERT INTO public.group_members (group_id, user_id)
    VALUES (NEW.group_id, NEW.invited_user_id)
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;$$;

-- Ensure trigger doesn't already exist (idempotent)
DROP TRIGGER IF EXISTS on_invite_approved ON public.group_invites;
CREATE TRIGGER on_invite_approved
  AFTER UPDATE ON public.group_invites FOR EACH ROW EXECUTE FUNCTION public.handle_invite_approval();

-- Create splits depending on group type
CREATE OR REPLACE FUNCTION public.create_equal_expense_splits()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE member_count INTEGER; split_amount NUMERIC(10,2); grp_type TEXT; debtor UUID; BEGIN
  SELECT type, reimbursement_debtor_id INTO grp_type, debtor FROM public.groups WHERE id = NEW.group_id;
  IF grp_type = 'reimbursement' THEN
    IF debtor IS NULL THEN SELECT created_by INTO debtor FROM public.groups WHERE id = NEW.group_id; END IF;
    INSERT INTO public.expense_splits (expense_id, user_id, share_amount) VALUES (NEW.id, debtor, NEW.amount);
  ELSE
    SELECT COUNT(*) INTO member_count FROM public.group_members WHERE group_id = NEW.group_id;
    IF member_count > 0 THEN
      split_amount := NEW.amount / member_count;
      INSERT INTO public.expense_splits (expense_id, user_id, share_amount)
      SELECT NEW.id, user_id, split_amount FROM public.group_members WHERE group_id = NEW.group_id;
    END IF;
  END IF;
  RETURN NEW;
END;$$;

-- Ensure trigger doesn't already exist (idempotent)
DROP TRIGGER IF EXISTS on_expense_created ON public.expenses;
CREATE TRIGGER on_expense_created
  AFTER INSERT ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.create_equal_expense_splits();

-- Storage bucket and policies (Supabase storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
CREATE POLICY "Authenticated users can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can view receipts" ON storage.objects;
CREATE POLICY "Anyone can view receipts"
  ON storage.objects FOR SELECT USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Users can delete their own receipts" ON storage.objects;
CREATE POLICY "Users can delete their own receipts"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]
  );

COMMIT;