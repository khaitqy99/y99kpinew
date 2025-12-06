-- Migration: Allow zero amount in bonus_penalty_records
-- This allows amount = 0 for bonus/penalty records

-- Drop old constraint that requires amount > 0
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_bonus_penalty_amount_positive' 
        AND conrelid = 'bonus_penalty_records'::regclass
    ) THEN
        ALTER TABLE bonus_penalty_records 
        DROP CONSTRAINT check_bonus_penalty_amount_positive;
        RAISE NOTICE 'Dropped constraint check_bonus_penalty_amount_positive';
    END IF;
END $$;

-- Add new constraint that allows amount >= 0
DO $$
BEGIN
    -- Drop new constraint if it exists (in case migration is run multiple times)
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_bonus_penalty_amount_non_negative' 
        AND conrelid = 'bonus_penalty_records'::regclass
    ) THEN
        ALTER TABLE bonus_penalty_records 
        DROP CONSTRAINT check_bonus_penalty_amount_non_negative;
    END IF;
    
    -- Add new constraint
    ALTER TABLE bonus_penalty_records 
    ADD CONSTRAINT check_bonus_penalty_amount_non_negative CHECK (amount >= 0);
    
    RAISE NOTICE 'Added constraint check_bonus_penalty_amount_non_negative (allows amount >= 0)';
END $$;

