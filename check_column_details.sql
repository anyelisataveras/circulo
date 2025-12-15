-- Check detailed information about supabase_user_id column
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

-- Check if there are any existing rows with NULL supabase_user_id
SELECT COUNT(*) as null_count
FROM public.users
WHERE supabase_user_id IS NULL;

-- Check total row count
SELECT COUNT(*) as total_rows
FROM public.users;

