# ✅ DATABASE_URL Corregido para eu-central-1

## 🔴 Problema Actual

El error "Tenant or user not found" (`XX000`) persiste incluso con la región correcta. Esto indica que el **service role key** puede estar incorrecto o expirado.

## ✅ Solución: Verificar y Actualizar Service Role Key

### Paso 1: Obtener el Service Role Key Correcto

1. **Ve a Supabase Dashboard**: https://supabase.com/dashboard
2. **Selecciona tu proyecto**
3. **Ve a Settings** → **API**
4. **Busca "Service Role Key"** (NO el anon key)
5. **Copia el key COMPLETO** (debe tener 3 partes separadas por puntos)
6. **Verifica que no esté expirado**

### Paso 2: Construir el Connection String

Una vez que tengas el service role key correcto, construye el connection string así:

```
postgresql://postgres.muywutvowctgvdtwavsw:[TU_SERVICE_ROLE_KEY_AQUI]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

**Reemplaza** `[TU_SERVICE_ROLE_KEY_AQUI]` con el service role key completo que copiaste.

### Paso 3: Actualizar en Vercel

1. **Ve a Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**
2. **Edita `DATABASE_URL`**
3. **Pega el connection string completo** (con el service role key correcto)
4. **Guarda** y haz **redeploy**
5. **Prueba hacer login** y revisa los logs

## 🔍 Si el Problema Persiste

Si después de actualizar el service role key el error persiste, prueba con la **conexión directa** (no pooler):

```
postgresql://postgres.muywutvowctgvdtwavsw:[TU_SERVICE_ROLE_KEY_AQUI]@db.muywutvowctgvdtwavsw.supabase.co:5432/postgres?sslmode=require
```

**⚠️ Nota:** La conexión directa no es recomendada para producción en serverless, pero puede ayudar a diagnosticar si el problema es específico del pooler.

## 📋 Verificación

Después de actualizar `DATABASE_URL` y hacer redeploy, busca en los logs de Vercel:

- ✅ `[Database] Connecting to:` - Muestra los detalles de conexión
- ✅ `[Database] Database connection successful` - Conexión exitosa
- ✅ `[Database] Query executed successfully` - Query ejecutada correctamente
- ❌ NO deberías ver `Tenant or user not found`
- ❌ NO deberías ver `authentication failed`

## 🔍 Notas Importantes

1. **El service role key debe ser el COMPLETO** - no debe estar truncado
2. **El service role key debe estar ACTIVO** - no debe estar expirado
3. **El service role key debe ser el CORRECTO** - debe ser el de tu proyecto específico
4. **El formato del connection string debe ser EXACTO** - sin espacios ni caracteres extra

