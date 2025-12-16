# 🔍 Verificar Service Role Key - Paso a Paso

## ⚠️ Problema Actual

El error "Tenant or user not found" (`XX000`) persiste incluso con la región correcta (`eu-central-1`). Esto indica que el **service role key** puede estar incorrecto o expirado.

## 📋 Pasos para Verificar y Obtener el Service Role Key Correcto

### Paso 1: Ir a Supabase Dashboard

1. Ve a https://supabase.com/dashboard
2. **Selecciona tu proyecto** (`leo.alalimon@gmail.com's Project`)
3. En el menú izquierdo, haz clic en **Settings** (el icono de engranaje ⚙️)
4. En el submenú de Settings, haz clic en **API**

### Paso 2: Encontrar el Service Role Key

En la página de API, verás dos keys:

1. **anon / public key** - Este NO es el que necesitas
2. **service_role key** - Este ES el que necesitas

**⚠️ IMPORTANTE:**
- El service role key es **secreto** y debe mantenerse privado
- El service role key tiene **permisos completos** y bypass RLS
- El service role key debe tener **3 partes** separadas por puntos (`.`)
- El service role key debe ser **completo** (no truncado)

### Paso 3: Copiar el Service Role Key Completo

1. **Haz clic en el icono de "eye" (👁️)** o "Show" para revelar el service role key
2. **Copia el key COMPLETO** - debe verse así:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eXd1dHZvd2N0Z3ZkdHdhdnN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI2Njk2NywiZXhwIjoyMDc5ODQyOTY3fQ.XXXXXXXXXXXXX
   ```
3. **Verifica que tenga 3 partes** separadas por puntos
4. **Verifica que no esté truncado** (debe tener más de 200 caracteres)

### Paso 4: Construir el Connection String

Una vez que tengas el service role key correcto, construye el connection string así:

```
postgresql://postgres.muywutvowctgvdtwavsw:[TU_SERVICE_ROLE_KEY_AQUI]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

**Reemplaza** `[TU_SERVICE_ROLE_KEY_AQUI]` con el service role key completo que copiaste.

### Paso 5: Actualizar en Vercel

1. **Ve a Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**
2. **Edita `DATABASE_URL`**
3. **Pega el connection string completo** (con el service role key correcto)
4. **Guarda** y haz **redeploy**
5. **Prueba hacer login** y revisa los logs

## 🔍 Verificación del Service Role Key

Para verificar que el service role key es correcto:

1. **Debe tener 3 partes** separadas por puntos (`.`)
2. **La primera parte** debe empezar con `eyJ` (header JWT)
3. **La segunda parte** debe empezar con `eyJ` (payload JWT)
4. **La tercera parte** puede empezar con `-` o cualquier carácter (signature JWT)
5. **Debe tener más de 200 caracteres** en total

## ❌ Errores Comunes

1. **Copiar el anon key en lugar del service role key** - El anon key no funciona para el pooler
2. **Copiar el key truncado** - El key debe ser completo
3. **Usar un key expirado** - Verifica la fecha de expiración en el payload JWT
4. **Usar el key de otro proyecto** - El key debe ser del proyecto correcto

## 🔍 Si el Problema Persiste

Si después de verificar y actualizar el service role key el error persiste:

1. **Prueba con la conexión directa** (no pooler) para diagnosticar:
   ```
   postgresql://postgres.muywutvowctgvdtwavsw:[TU_SERVICE_ROLE_KEY_AQUI]@db.muywutvowctgvdtwavsw.supabase.co:5432/postgres?sslmode=require
   ```

2. **Verifica que el proyecto reference sea correcto** - Debe ser `muywutvowctgvdtwavsw`

3. **Comparte los logs de Vercel** después de intentar login para ver el error específico

