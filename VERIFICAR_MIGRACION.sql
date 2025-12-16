-- Script para verificar que las políticas RLS se crearon correctamente
-- Ejecuta esto en Supabase SQL Editor para confirmar

-- 1. Verificar que las políticas existen
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
AND policyname LIKE 'Backend%'
ORDER BY policyname;

-- 2. Verificar que RLS está habilitado
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'users';

-- 3. Probar una query simple (debería funcionar ahora)
SELECT COUNT(*) as total_users FROM public.users;

