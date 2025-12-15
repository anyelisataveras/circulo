-- Script para verificar la estructura de la base de datos en Supabase
-- Ejecuta esto en Supabase Dashboard → SQL Editor

-- 1. Verificar que la tabla users existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users';

-- 2. Verificar las columnas de la tabla users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Verificar que existe la columna supabase_user_id
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND column_name = 'supabase_user_id';

-- 4. Verificar si hay usuarios en la tabla
SELECT COUNT(*) as user_count FROM users;

-- 5. Verificar usuarios por supabase_user_id
SELECT 
    id,
    supabase_user_id,
    email,
    name,
    created_at
FROM users
LIMIT 10;

