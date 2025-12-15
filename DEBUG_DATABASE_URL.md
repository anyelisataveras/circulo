# 🔍 Debug: Verificar Configuración de DATABASE_URL

## Problema Actual

Los logs muestran que:
- ✅ La sesión de Supabase se crea correctamente
- ✅ El token se envía al backend
- ❌ `auth.me` retorna `null` (sin error)

Esto significa que el backend está recibiendo el token pero no puede crear/obtener el usuario.

## Verificaciones Necesarias

### 1. Verificar la Codificación de la Contraseña

La contraseña `u%@+Eeh#mt2pS3&` debe estar correctamente codificada en URL.

**Verificación:**
```javascript
// En Node.js o en la consola del navegador
encodeURIComponent('u%@+Eeh#mt2pS3&')
// Debe retornar: 'u%25%40%2BEeh%23mt2pS3%26'
```

**URL completa esperada:**
```
postgresql://postgres:u%25%40%2BEeh%23mt2pS3%26@db.muywutvowctgvdtwavsw.supabase.co:5432/postgres?sslmode=require
```

### 2. Verificar en Vercel Dashboard

1. Ve a Vercel Dashboard → Tu proyecto → Settings → Environment Variables
2. Verifica que `DATABASE_URL` esté configurado para **Production**
3. Haz clic en el ojo 👁️ para ver el valor (estará enmascarado, pero puedes verificar la longitud)
4. **IMPORTANTE:** Verifica que el valor NO tenga espacios al inicio o final

### 3. Verificar los Logs del Servidor en Vercel

1. Ve a Vercel Dashboard → Tu proyecto → Logs
2. Busca estos mensajes después de un intento de login:
   - `[Context] Access token received, verifying...`
   - `[Context] Token verified, Supabase user:`
   - `[Context] Database availability check`
   - `[Context] Database not available` ← Si ves esto, `DATABASE_URL` no está configurado o está mal
   - `[Database] Failed to connect` ← Si ves esto, hay un error de conexión

### 4. Verificar que la Tabla `users` Exista

La tabla `users` debe existir en tu base de datos de Supabase con la columna `supabase_user_id`.

**Verificación en Supabase:**
1. Ve a Supabase Dashboard → SQL Editor
2. Ejecuta:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public';
```

Debes ver una columna `supabase_user_id` de tipo `varchar` o `text`.

### 5. Verificar la Contraseña de la Base de Datos

1. Ve a Supabase Dashboard → Settings → Database
2. Verifica la contraseña de la base de datos
3. Si es diferente a `u%@+Eeh#mt2pS3&`, actualiza `DATABASE_URL` en Vercel

### 6. Probar la Conexión Manualmente

Puedes probar la conexión usando `psql` o cualquier cliente PostgreSQL:

```bash
psql "postgresql://postgres:u%25%40%2BEeh%23mt2pS3%26@db.muywutvowctgvdtwavsw.supabase.co:5432/postgres?sslmode=require"
```

O usando Node.js:
```javascript
const postgres = require('postgres');
const sql = postgres('postgresql://postgres:u%25%40%2BEeh%23mt2pS3%26@db.muywutvowctgvdtwavsw.supabase.co:5432/postgres?sslmode=require');
const result = await sql`SELECT 1`;
console.log(result);
```

## Posibles Problemas y Soluciones

### Problema 1: Contraseña Mal Codificada
**Síntoma:** `[Database] Failed to connect` con error de autenticación
**Solución:** Verifica que la contraseña esté correctamente codificada en URL

### Problema 2: Tabla `users` No Existe
**Síntoma:** `[Database] Failed to upsert user` con error de tabla no encontrada
**Solución:** Ejecuta las migraciones de Supabase

### Problema 3: Columna `supabase_user_id` No Existe
**Síntoma:** `[Database] Failed to upsert user` con error de columna no encontrada
**Solución:** Verifica que la tabla tenga la columna `supabase_user_id`

### Problema 4: `DATABASE_URL` No Está Disponible en Runtime
**Síntoma:** `[Context] Database not available`
**Solución:** 
- Verifica que `DATABASE_URL` esté configurado para el ambiente correcto (Production)
- Redespliega la aplicación después de agregar la variable

## Próximos Pasos

1. Verifica los logs del servidor en Vercel después de un intento de login
2. Comparte los mensajes que veas relacionados con `[Context]` y `[Database]`
3. Verifica que la tabla `users` exista y tenga la columna `supabase_user_id`

