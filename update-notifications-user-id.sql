-- Migration: Update notifications table to allow special user_id values
-- This allows notifications to be targeted to specific roles (admin, employee, all)

-- First, drop the foreign key constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Change user_id column to TEXT to allow special values like 'admin', 'employee', 'all'
ALTER TABLE public.notifications ALTER COLUMN user_id TYPE TEXT;

-- Add a check constraint to ensure user_id is either a valid UUID or one of the special values
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_check 
CHECK (
  user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' OR 
  user_id IN ('admin', 'employee', 'all')
);

-- Add back the foreign key constraint for UUID values only
-- We'll handle this with a trigger or application logic instead of a direct FK
-- since we now allow special string values

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_active ON public.notifications(user_id, is_active) WHERE is_active = true;
