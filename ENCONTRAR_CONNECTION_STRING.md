# 🔍 Cómo Encontrar o Construir el Connection String de Supabase

## 📍 Opción 1: Buscar en el Dashboard

El connection string puede estar en diferentes lugares según la versión de Supabase:

### Ubicación A: Settings → Database → Connection string
1. Ve a **Settings** → **Database**
2. Busca una sección llamada **"Connection string"** o **"Connection info"**
3. Debería haber un dropdown o tabs con opciones como:
   - **"URI"**
   - **"JDBC"**
   - **"Session mode"**
   - **"Transaction mode"**
   - **"Direct connection"**
4. Selecciona **"URI"** y **"Transaction mode"** o **"Session mode"**
5. Copia el connection string completo

### Ubicación B: Settings → API
1. Ve a **Settings** → **API**
2. Busca la sección **"Project API keys"**
3. Busca **"Database"** o **"Connection string"**
4. Debería mostrar el connection string

## 🔧 Opción 2: Construirlo Manualmente

Si no encuentras el connection string en el dashboard, puedes construirlo manualmente:

### Paso 1: Obtener la Región

1. Ve a **Settings** → **General**
2. Busca **"Region"** o **"Project Region"**
3. Anota la región (ej: `us-west-1`, `eu-west-1`, `ap-southeast-1`)

### Paso 2: Obtener el Service Role Key

1. Ve a **Settings** → **API**
2. Busca **"service_role"** key (el que dice "secret")
3. Copia el key completo

### Paso 3: Construir el Connection String

**Formato:**
```
postgresql://postgres.[PROJECT-REF]:[SERVICE-ROLE-KEY]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Ejemplo con tus datos:**
- Project Ref: `muywutvowctgvdtwavsw`
- Service Role Key: (cópialo de Settings → API)
- Región: (encuéntrala en Settings → General)

**URL completa:**
```
postgresql://postgres.muywutvowctgvdtwavsw:[SERVICE-ROLE-KEY]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**⚠️ IMPORTANTE:**
- Reemplaza `[SERVICE-ROLE-KEY]` con el service role key real
- Reemplaza `[REGION]` con tu región (ej: `us-west-1`)
- El service role key debe estar **codificado en URL** si tiene caracteres especiales

## 🔧 Opción 3: Usar la Contraseña de Base de Datos (Alternativa)

Si prefieres usar la contraseña de la base de datos en lugar del service role key:

**Formato:**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Con tu contraseña codificada:**
```
postgresql://postgres.muywutvowctgvdtwavsw:u%25%40%2BEeh%23mt2pS3%26@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Nota:** Necesitas saber la región. Si no la sabes, usa la Opción 2 con service role key.

## ✅ Verificación

Después de construir el connection string:

1. Debe empezar con `postgresql://`
2. Debe tener `postgres.[PROJECT-REF]` como usuario
3. Debe tener `aws-0-[REGION].pooler.supabase.com` como hostname
4. Debe usar el puerto `6543` (no `5432`)
5. Debe terminar con `/postgres`

## 🎯 Recomendación

**Usa el Service Role Key** (Opción 2) porque:
- ✅ Bypass RLS automáticamente
- ✅ No necesitas las políticas RLS adicionales
- ✅ Es la forma correcta para el backend

