# Solución al Problema de Login/Signup

## Problema Identificado

El error "Failed query" en Vercel ocurre porque:

1. **RLS (Row Level Security) está habilitado** en la tabla `users`
2. **La conexión directa a PostgreSQL** usando `DATABASE_URL` no tiene un JWT válido de Supabase
3. **Las políticas RLS bloquean las queries** cuando no hay un JWT válido

## Soluciones Implementadas

### ✅ Solución 1: Migración SQL (APLICADA - Solución Rápida)

He creado una migración SQL (`005_fix_backend_rls_access.sql`) que permite al backend hacer queries sin JWT.

**Para aplicar:**
1. Ejecuta la migración en Supabase SQL Editor:
   ```sql
   -- Ver archivo: supabase/migrations/005_fix_backend_rls_access.sql
   ```

**⚠️ NOTA:** Esta es una solución temporal. La solución correcta es usar `DATABASE_URL` con service role key.

### ✅ Solución 2: Código Mejorado (APLICADO)

He mejorado `server/db.ts` para intentar usar el service role key automáticamente si está disponible.

### 🔧 Solución 3: Configurar DATABASE_URL Correctamente (RECOMENDADO - Solución Definitiva)

El `DATABASE_URL` debe usar el **service role key** como password para bypass RLS.

En Supabase, el connection string con service role key se ve así:
```
postgresql://postgres.[project-ref]:[service-role-key]@aws-0-[region].pooler.supabase.com:6543/postgres
```

**Pasos:**
1. Ve a Supabase Dashboard → Settings → Database
2. Copia el "Connection string" con "Service role" (no "Session mode")
3. Usa ese string como `DATABASE_URL` en Vercel
4. Una vez configurado, puedes eliminar las políticas temporales de la Solución 1

## Verificación

Después de aplicar la solución:

1. Verifica que `DATABASE_URL` en Vercel use el service role key
2. Prueba login/signup
3. Revisa logs de Vercel - no debería haber "Failed query"
4. Verifica que el usuario se crea correctamente en la tabla `users`

## Notas Importantes

- El service role key **bypass RLS** - úsalo solo en el backend
- Nunca expongas el service role key al cliente
- En producción, siempre usa RLS con service role key en el backend

