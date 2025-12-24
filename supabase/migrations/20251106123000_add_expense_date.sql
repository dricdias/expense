-- Add expense_date column to expenses and backfill
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS expense_date date;

-- Backfill existing rows using created_at date
UPDATE public.expenses
SET expense_date = COALESCE(expense_date, created_at::date);

-- Ensure NOT NULL and set default for future inserts
ALTER TABLE public.expenses
  ALTER COLUMN expense_date SET NOT NULL,
  ALTER COLUMN expense_date SET DEFAULT CURRENT_DATE;