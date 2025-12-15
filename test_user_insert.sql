-- Test script to manually insert a user and see if it works
-- This will help us identify if the problem is with the insert query itself

-- First, let's try to insert a test user with supabase_user_id
INSERT INTO public.users (
    supabase_user_id,
    email,
    name,
    login_method,
    role,
    preferred_language,
    last_signed_in
) VALUES (
    'b9ee991c-a6b3-4d66-bf2a-76e1c5c0e697',
    'test@example.com',
    'Test User',
    'email',
    'user',
    'en',
    NOW()
);

-- Check if the insert worked
SELECT id, supabase_user_id, email, name
FROM public.users
WHERE supabase_user_id = 'b9ee991c-a6b3-4d66-bf2a-76e1c5c0e697';

-- If the insert fails, check the error message
-- Common errors:
-- 1. "null value in column "supabase_user_id" violates not-null constraint" - means column is NOT NULL but we're trying to insert NULL
-- 2. "duplicate key value violates unique constraint" - means the supabase_user_id already exists
-- 3. "column does not exist" - means the column name is wrong

