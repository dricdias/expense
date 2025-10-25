-- Add status column to settlements table
ALTER TABLE public.settlements 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add policy to allow users to approve settlements where they are the receiver
CREATE POLICY "Users can approve settlements they receive"
ON public.settlements
FOR UPDATE
TO authenticated
USING (auth.uid() = to_user)
WITH CHECK (auth.uid() = to_user);

-- Create a function to mark expense splits as paid when settlement is approved
CREATE OR REPLACE FUNCTION public.approve_settlement(settlement_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settlement_record RECORD;
BEGIN
  -- Get settlement details
  SELECT * INTO settlement_record
  FROM settlements
  WHERE id = settlement_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Settlement not found or already processed';
  END IF;
  
  -- Update settlement status
  UPDATE settlements
  SET status = 'approved', settled_at = NOW()
  WHERE id = settlement_id;
  
  -- Mark all expense splits between these users as paid
  UPDATE expense_splits
  SET paid = true
  WHERE expense_id IN (
    SELECT e.id
    FROM expenses e
    WHERE e.group_id = settlement_record.group_id
    AND e.paid_by = settlement_record.to_user
  )
  AND user_id = settlement_record.from_user;
END;
$$;