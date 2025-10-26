-- Create group_invites table for pending invitations
CREATE TABLE IF NOT EXISTS public.group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(group_id, invited_user_id)
);

-- Enable RLS
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- Users can view invites sent to them
CREATE POLICY "Users can view their own invites"
ON public.group_invites
FOR SELECT
USING (auth.uid() = invited_user_id);

-- Group creators can create invites
CREATE POLICY "Group creators can create invites"
ON public.group_invites
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.groups
    WHERE groups.id = group_id
    AND groups.created_by = auth.uid()
  )
);

-- Invited users can update their own invites (approve/reject)
CREATE POLICY "Invited users can update their invites"
ON public.group_invites
FOR UPDATE
USING (auth.uid() = invited_user_id);

-- Create function to auto-add member when invite is approved
CREATE OR REPLACE FUNCTION public.handle_invite_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    -- Add user to group_members
    INSERT INTO public.group_members (group_id, user_id)
    VALUES (NEW.group_id, NEW.invited_user_id)
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for invite approval
CREATE TRIGGER on_invite_approved
  AFTER UPDATE ON public.group_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invite_approval();

-- Add unique constraint to group_members to prevent duplicates
ALTER TABLE public.group_members
ADD CONSTRAINT unique_group_member UNIQUE (group_id, user_id);