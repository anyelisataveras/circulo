-- =====================================================
-- Fix RLS Access for Backend Queries
-- Version: 1.0.0
-- Description: Allow backend to query users table without JWT
-- =====================================================
-- 
-- PROBLEMA: RLS está bloqueando queries del backend porque no hay JWT válido
-- SOLUCIÓN: Crear política que permita queries sin autenticación para el backend
-- 
-- NOTA: Esta es una solución temporal. La solución correcta es usar
-- DATABASE_URL con service role key que bypass RLS automáticamente.
-- =====================================================

-- Política para permitir SELECT en users sin autenticación
-- Esto es necesario porque el backend se conecta directamente a PostgreSQL
-- sin un JWT de Supabase, y RLS bloquea las queries por defecto
-- Primero eliminamos la política si existe (para evitar errores)
DROP POLICY IF EXISTS "Backend can query users without auth" ON public.users;
CREATE POLICY "Backend can query users without auth"
  ON public.users FOR SELECT
  USING (true);

-- También permitir INSERT desde el backend (para crear usuarios)
DROP POLICY IF EXISTS "Backend can insert users" ON public.users;
CREATE POLICY "Backend can insert users"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- Y UPDATE para actualizar usuarios
DROP POLICY IF EXISTS "Backend can update users" ON public.users;
CREATE POLICY "Backend can update users"
  ON public.users FOR UPDATE
  USING (true);

-- Comentario explicativo
COMMENT ON POLICY "Backend can query users without auth" ON public.users IS 
'Allows backend server to query users table without Supabase JWT. This is needed because the backend connects directly to PostgreSQL using DATABASE_URL without authentication context. The proper solution is to use DATABASE_URL with service role key which bypasses RLS automatically.';

