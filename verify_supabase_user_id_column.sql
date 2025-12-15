-- Script to verify that supabase_user_id column exists and is correctly configured
-- Run this in Supabase SQL Editor

-- Check if column exists
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'supabase_user_id';

-- Check constraints
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'users'
  AND kcu.column_name = 'supabase_user_id';

-- If column doesn't exist, you need to run the migration:
-- See: supabase/migrations/004_add_supabase_user_id.sql

