-- Comprehensive diagnosis script for supabase_user_id column issues
-- Run this in Supabase SQL Editor to diagnose the problem

-- 1. Check column details
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

-- 2. Check for NULL values (this should return 0 if column is NOT NULL)
SELECT COUNT(*) as null_count
FROM public.users
WHERE supabase_user_id IS NULL;

-- 3. Check total row count
SELECT COUNT(*) as total_rows
FROM public.users;

-- 4. Check constraints
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

-- 5. Try a test query (this should work if column exists)
SELECT id, supabase_user_id, email
FROM public.users
WHERE supabase_user_id = 'b9ee991c-a6b3-4d66-bf2a-76e1c5c0e697'
LIMIT 1;

-- 6. If the test query fails, check if the column name is correct
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name LIKE '%supabase%';

