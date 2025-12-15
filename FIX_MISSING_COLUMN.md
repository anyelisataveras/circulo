# 🔧 Fix: Agregar Columna `supabase_user_id` a la Tabla `users`

## 🔍 Problema Identificado

La tabla `users` en Supabase **NO tiene la columna `supabase_user_id`**, pero el código intenta usarla. Esto causa que:

1. ✅ El login funciona (Supabase crea la sesión)
2. ✅ El token se envía al backend
3. ✅ El backend verifica el token correctamente
4. ❌ **FALLA**: El backend no puede crear/obtener el usuario porque la columna `supabase_user_id` no existe

## ✅ Solución: Ejecutar Migración SQL

### Paso 1: Ejecutar la Migración en Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Copia y pega el siguiente SQL:

```sql
-- Add the supabase_user_id column (nullable initially to allow existing data)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS supabase_user_id VARCHAR(64);

-- Create unique index on supabase_user_id (allows NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS users_supabase_user_id_unique 
ON public.users(supabase_user_id) 
WHERE supabase_user_id IS NOT NULL;

-- Make open_id nullable since we're migrating to supabase_user_id
-- (Keep it for backward compatibility with existing data)
ALTER TABLE public.users 
ALTER COLUMN open_id DROP NOT NULL;
```

5. Haz clic en **Run** para ejecutar la migración

### Paso 2: Verificar la Migración

Ejecuta esta query para verificar que la columna fue agregada:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name = 'supabase_user_id';
```

Deberías ver:
- `column_name`: `supabase_user_id`
- `data_type`: `character varying`
- `is_nullable`: `YES`

### Paso 3: Probar el Login

1. Intenta hacer login de nuevo en la aplicación
2. El login debería funcionar correctamente
3. Deberías ser redirigido a `/dashboard` y ver tu información de usuario

## 🔍 Verificación en Logs

Después de ejecutar la migración, los logs de Vercel deberían mostrar:

```
[Context] Access token received, verifying...
[Context] Token verified, Supabase user: { id: '...', email: '...' }
[Context] Database availability check: { hasDatabase: true }
[Context] User lookup result: { found: false }
[Context] User created, lookup result: { found: true, userId: ... }
[Context] Returning context with user: { hasUser: true, userId: ... }
```

## 📝 Notas

- La columna `supabase_user_id` es nullable inicialmente para permitir datos existentes
- La columna `open_id` se mantiene para compatibilidad hacia atrás pero ya no es requerida
- El índice único en `supabase_user_id` permite valores NULL (múltiples usuarios pueden tener NULL)

## 🐛 Si Aún No Funciona

1. **Verifica que la migración se ejecutó correctamente:**
   - Ejecuta: `SELECT * FROM users LIMIT 1;`
   - Deberías ver la columna `supabase_user_id` en los resultados

2. **Verifica que no hay errores de sintaxis:**
   - Revisa los logs de Supabase SQL Editor
   - Asegúrate de que todas las queries se ejecutaron sin errores

3. **Redespliega la aplicación en Vercel:**
   - Después de agregar la columna, Vercel debería funcionar automáticamente
   - Si no, haz un redeploy manual

