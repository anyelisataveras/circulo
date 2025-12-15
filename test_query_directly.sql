-- Test the exact query that Drizzle is trying to execute
-- This will help us see the actual PostgreSQL error

-- This is the query that getUserBySupabaseId is trying to execute:
SELECT 
    "id", 
    "supabase_user_id", 
    "open_id", 
    "name", 
    "email", 
    "login_method", 
    "role", 
    "preferred_language", 
    "google_id", 
    "google_access_token", 
    "google_refresh_token", 
    "google_token_expiry", 
    "created_at", 
    "updated_at", 
    "last_signed_in" 
FROM "users" 
WHERE "users"."supabase_user_id" = 'b9ee991c-a6b3-4d66-bf2a-76e1c5c0e697' 
LIMIT 1;

-- If this query fails, check the error message
-- Common errors:
-- 1. "column 'supabase_user_id' does not exist" - means the column name is wrong (should be lowercase in PostgreSQL)
-- 2. "relation 'users' does not exist" - means the table doesn't exist
-- 3. "syntax error" - means there's a problem with the query syntax

-- Also try without quotes to see if that's the issue:
SELECT 
    id, 
    supabase_user_id, 
    open_id, 
    name, 
    email, 
    login_method, 
    role, 
    preferred_language, 
    google_id, 
    google_access_token, 
    google_refresh_token, 
    google_token_expiry, 
    created_at, 
    updated_at, 
    last_signed_in 
FROM users 
WHERE users.supabase_user_id = 'b9ee991c-a6b3-4d66-bf2a-76e1c5c0e697' 
LIMIT 1;

