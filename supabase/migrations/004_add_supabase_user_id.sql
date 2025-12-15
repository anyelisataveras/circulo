-- Migration: Add supabase_user_id column to users table
-- This column is required for Supabase authentication integration
-- The column must be NOT NULL and UNIQUE to match the Drizzle schema definition

-- Step 1: Add the supabase_user_id column as nullable initially (to allow migration)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS supabase_user_id VARCHAR(64);

-- Step 2: Handle existing rows (if any) - set a temporary value for rows without supabase_user_id
-- This is only needed if there are existing rows. For new deployments, this will be a no-op.
-- If you have existing users that need to be migrated, uncomment and modify the following:
-- UPDATE public.users SET supabase_user_id = 'legacy-' || id::text WHERE supabase_user_id IS NULL;

-- Step 3: Make the column NOT NULL (this will fail if there are NULL values)
-- If you have existing rows, you must handle them in Step 2 first
ALTER TABLE public.users 
ALTER COLUMN supabase_user_id SET NOT NULL;

-- Step 4: Add unique constraint on supabase_user_id
-- First, drop the index if it exists (from a previous partial migration attempt)
DROP INDEX IF EXISTS users_supabase_user_id_unique;

-- Add the unique constraint
ALTER TABLE public.users
ADD CONSTRAINT users_supabase_user_id_unique UNIQUE (supabase_user_id);

-- Step 5: Make open_id nullable since we're migrating to supabase_user_id
-- (Keep it for backward compatibility with existing data)
ALTER TABLE public.users 
ALTER COLUMN open_id DROP NOT NULL;

-- Add comments to document the columns
COMMENT ON COLUMN public.users.supabase_user_id IS 'Supabase Auth UUID - primary identifier for Supabase authentication. Required and unique for all users.';
COMMENT ON COLUMN public.users.open_id IS 'Legacy field for migration - kept for backward compatibility. Now nullable.';

