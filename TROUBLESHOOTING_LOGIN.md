# 🔍 Troubleshooting: Login Issue After Migration

## Verificación Paso a Paso

### 1. Verificar que la Columna Fue Agregada

Ejecuta en Supabase SQL Editor:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name = 'supabase_user_id';
```

**Resultado esperado:**
- `column_name`: `supabase_user_id`
- `data_type`: `character varying`
- `is_nullable`: `YES` (puede ser NULL para usuarios existentes)
- `column_default`: `NULL`

### 2. Verificar el Índice Único

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users' 
AND indexname = 'users_supabase_user_id_unique';
```

**Resultado esperado:** Debe existir un índice único en `supabase_user_id`.

### 3. Verificar Logs del Servidor en Vercel

Después de intentar hacer login, revisa los logs en Vercel Dashboard:

**Busca estos mensajes:**
- `[Context] Access token received, verifying...`
- `[Context] Token verified, Supabase user:`
- `[Context] Database availability check`
- `[Database] Failed to connect` ← Si ves esto, hay un problema con DATABASE_URL
- `[Database] Failed to insert user` ← Si ves esto, hay un error al insertar
- `[Context] Error creating user` ← Si ves esto, hay un error específico

### 4. Errores Comunes y Soluciones

#### Error: "column supabase_user_id does not exist"
**Causa:** La migración no se ejecutó correctamente.
**Solución:** Ejecuta la migración SQL de nuevo en Supabase SQL Editor.

#### Error: "duplicate key value violates unique constraint"
**Causa:** Ya existe un usuario con ese `supabase_user_id`.
**Solución:** Verifica si el usuario ya existe:
```sql
SELECT * FROM users WHERE supabase_user_id = 'TU_SUPABASE_USER_ID';
```

#### Error: "null value in column supabase_user_id violates not-null constraint"
**Causa:** El schema de Drizzle espera NOT NULL pero la columna es nullable.
**Solución:** Esto no debería pasar porque la columna es nullable. Si pasa, verifica que la migración se ejecutó correctamente.

#### Error: "relation users does not exist"
**Causa:** La tabla `users` no existe.
**Solución:** Ejecuta las migraciones iniciales de Supabase.

### 5. Verificar la Conexión a la Base de Datos

Verifica que `DATABASE_URL` esté configurado correctamente en Vercel:

1. Ve a Vercel Dashboard → Settings → Environment Variables
2. Verifica que `DATABASE_URL` esté configurado para **Production**
3. El formato debe ser:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
   ```

### 6. Probar la Inserción Manualmente

Ejecuta en Supabase SQL Editor para probar si puedes insertar un usuario:

```sql
-- Reemplaza 'test-user-id' con un UUID de prueba
INSERT INTO public.users (
  supabase_user_id,
  name,
  email,
  role,
  preferred_language,
  created_at,
  updated_at,
  last_signed_in
) VALUES (
  'test-user-id-12345',
  'Test User',
  'test@example.com',
  'user',
  'en',
  NOW(),
  NOW(),
  NOW()
);

-- Verifica que se insertó
SELECT * FROM users WHERE supabase_user_id = 'test-user-id-12345';

-- Limpia el usuario de prueba
DELETE FROM users WHERE supabase_user_id = 'test-user-id-12345';
```

Si esto funciona, el problema está en el código. Si falla, el problema está en la base de datos.

## Próximos Pasos

1. Ejecuta las verificaciones arriba
2. Comparte los resultados y cualquier error que veas
3. Con esa información podré proporcionar una solución específica

