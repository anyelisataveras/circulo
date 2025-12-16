# 🔧 Fix: Error ENOTFOUND - Cambiar a Connection Pooling

## Problema Identificado

El error `getaddrinfo ENOTFOUND db.muywutvowctgvdtwavsw.supabase.co` indica que el hostname directo no se puede resolver.

**Causa:** El `DATABASE_URL` está usando el formato directo que puede no estar disponible en algunos planes de Supabase.

## ✅ Solución: Usar Connection Pooling

Supabase recomienda usar **Connection Pooling** para producción, especialmente en entornos serverless como Vercel.

### Paso 1: Obtener Connection String con Pooling

1. Ve a **Supabase Dashboard** → **Settings** → **Database**
2. Busca la sección **"Connection pooling"**
3. Selecciona **"Session mode"** o **"Transaction mode"**
4. Copia la **Connection string** (formato URI)

**Formato esperado:**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Ejemplo:**
```
postgresql://postgres.muywutvowctgvdtwavsw:u%25%40%2BEeh%23mt2pS3%26@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

### Paso 2: Actualizar DATABASE_URL en Vercel

1. Ve a **Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**
2. Edita `DATABASE_URL`
3. Reemplaza el valor con el connection string de pooling que copiaste
4. Guarda y haz redeploy

### Diferencias entre Formatos

**Formato Directo (actual, no funciona):**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Formato Pooling (recomendado):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Nota:** El formato de pooling usa:
- `postgres.[PROJECT-REF]` como usuario (no solo `postgres`)
- `aws-0-[REGION].pooler.supabase.com` como hostname
- Puerto `6543` (no `5432`)

## 🔍 Cómo Encontrar la Región

Si no sabes la región de tu proyecto:
1. Ve a **Supabase Dashboard** → **Settings** → **General**
2. Busca **"Region"** o **"Project Region"**
3. Usa esa región en el connection string (ej: `us-west-1`, `eu-west-1`, etc.)

## ✅ Verificación

Después de actualizar `DATABASE_URL`:
1. Haz redeploy en Vercel
2. Intenta hacer login
3. Revisa los logs - NO deberías ver `ENOTFOUND`
4. Deberías ver `[Database] Database connection successful`

