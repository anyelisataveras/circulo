# 🔧 Construir DATABASE_URL Manualmente

## El Problema

El connection string no está visible en la página de Database Settings. Necesitamos construirlo manualmente.

## ✅ Solución: Construir el Connection String Manualmente

### Paso 1: Obtener la Región

1. En el sidebar izquierdo, haz clic en **"Settings"** (el que está en la parte superior, no el de Database)
2. O ve directamente a: **Settings** → **General**
3. Busca **"Region"** o **"Project Region"**
4. Anota la región (ejemplos: `us-west-1`, `eu-west-1`, `ap-southeast-1`, `us-east-1`)

### Paso 2: Obtener el Service Role Key

1. En el sidebar izquierdo, haz clic en **"Settings"** (el de arriba)
2. Luego haz clic en **"API"**
3. Busca la sección **"Project API keys"**
4. Busca **"service_role"** (el que dice "secret" o tiene un ícono de candado)
5. Haz clic en el ícono del ojo 👁️ o en "Reveal" para ver el key
6. **Copia el key completo** (es muy largo, tipo JWT)

### Paso 3: Construir el Connection String

Usa este formato:

```
postgresql://postgres.muywutvowctgvdtwavsw:[SERVICE-ROLE-KEY]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Ejemplo:**
Si tu región es `us-west-1` y tu service role key es `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`, entonces:

```
postgresql://postgres.muywutvowctgvdtwavsw:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

**⚠️ IMPORTANTE:**
- El service role key puede tener caracteres especiales que necesitan codificación URL
- Si el key tiene `+`, `/`, `=`, u otros caracteres especiales, puede que necesites codificarlos
- Pero generalmente funciona sin codificar si lo copias directamente

### Paso 4: Actualizar en Vercel

1. Ve a **Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**
2. Edita `DATABASE_URL`
3. Pega el connection string completo que construiste
4. Guarda y haz redeploy

## 🔍 Si No Encuentras la Región

Si no encuentras la región en Settings → General, puedes intentar estas regiones comunes:

- `us-west-1` (Oregon, USA)
- `us-east-1` (Virginia, USA)
- `eu-west-1` (Ireland)
- `ap-southeast-1` (Singapore)

O puedes usar este formato alternativo que a veces funciona:

```
postgresql://postgres.muywutvowctgvdtwavsw:[SERVICE-ROLE-KEY]@db.muywutvowctgvdtwavsw.supabase.co:5432/postgres?sslmode=require
```

Pero este formato puede dar el error `ENOTFOUND` que ya viste.

## ✅ Verificación

El connection string debe:
- ✅ Empezar con `postgresql://`
- ✅ Tener `postgres.muywutvowctgvdtwavsw` como usuario
- ✅ Tener el service role key como password
- ✅ Tener `aws-0-[REGION].pooler.supabase.com` como hostname
- ✅ Usar puerto `6543`
- ✅ Terminar con `/postgres`

## 🎯 Próximos Pasos

1. Obtén la región de Settings → General
2. Obtén el service role key de Settings → API
3. Construye el connection string con el formato de arriba
4. Actualiza `DATABASE_URL` en Vercel
5. Haz redeploy
6. Prueba el login

