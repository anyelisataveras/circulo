# 🔍 Cómo Obtener el DATABASE_URL de Supabase

## 📍 Dónde Encontrarlo

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto (el que tiene el ref `muywutvowctgvdtwavsw`)
3. Ve a **Settings** → **Database**

## ✅ Opción 1: Connection String Directo (Para Bypass RLS - RECOMENDADO)

**Para que el backend pueda hacer queries sin problemas de RLS, usa el connection string con SERVICE ROLE KEY:**

1. En **Settings** → **Database**, busca la sección **Connection string**
2. Selecciona **"URI"** o **"JDBC"** 
3. Selecciona **"Service role"** (NO "Session mode" ni "Transaction mode")
4. Copia la URL completa

**Formato esperado:**
```
postgresql://postgres.[PROJECT-REF]:[SERVICE-ROLE-KEY]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Ejemplo:**
```
postgresql://postgres.muywutvowctgvdtwavsw:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

**⚠️ IMPORTANTE:** 
- Este connection string usa el **service role key** como password
- El service role key **bypass RLS automáticamente**
- Es la solución correcta para el backend

## ✅ Opción 2: Connection String con Contraseña de Base de Datos

Si no tienes acceso al service role key en el connection string, puedes usar la contraseña de la base de datos:

1. En **Settings** → **Database**, busca **Database password**
2. Si no la recuerdas, puedes resetearla (pero esto desconectará todas las conexiones activas)
3. Construye la URL manualmente:

**Formato:**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```

**Ejemplo con tu contraseña codificada:**
```
postgresql://postgres:u%25%40%2BEeh%23mt2pS3%26@db.muywutvowctgvdtwavsw.supabase.co:5432/postgres?sslmode=require
```

**⚠️ NOTA:** 
- La contraseña debe estar **codificada en URL** (URL encoded)
- Caracteres especiales como `@`, `#`, `&`, `+` deben codificarse
- Puedes usar: https://www.urlencoder.org/ para codificar

## 🔧 Cómo Codificar la Contraseña

Si tu contraseña es `u%@+Eeh#mt2pS3&`, debes codificarla:

**En Node.js:**
```javascript
encodeURIComponent('u%@+Eeh#mt2pS3&')
// Resultado: 'u%25%40%2BEeh%23mt2pS3%26'
```

**En línea de comandos:**
```bash
node -e "console.log(encodeURIComponent('u%@+Eeh#mt2pS3&'))"
```

## 📝 Configurar en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto `circulo-lovat`
3. Ve a **Settings** → **Environment Variables**
4. Haz clic en **Add New** (o edita si ya existe)
5. Configura:
   - **Name**: `DATABASE_URL`
   - **Value**: El connection string completo que copiaste
   - **Environment**: Selecciona **Production**, **Preview**, y **Development**
6. Haz clic en **Save**

## ✅ Verificación

Después de configurar:

1. Vercel reconstruirá automáticamente
2. Intenta hacer login
3. Revisa los logs de Vercel - deberías ver:
   - `[Database] Database connection successful`
   - NO deberías ver `Failed query` ni errores de RLS

## 🎯 Recomendación Final

**Usa la Opción 1 (Service Role Key)** porque:
- ✅ Bypass RLS automáticamente
- ✅ No necesitas políticas RLS adicionales
- ✅ Es la forma correcta de conectar el backend a Supabase
- ✅ Más seguro y eficiente

Si no puedes encontrar el connection string con service role key:
1. Ve a **Settings** → **API**
2. Copia el **service_role key** (el que dice "secret")
3. Construye la URL manualmente usando ese key como password

