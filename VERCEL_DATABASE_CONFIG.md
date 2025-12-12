# Configuración de DATABASE_URL en Vercel

## 🔍 Problema Identificado

El endpoint `auth.me` retorna `null` porque `DATABASE_URL` no está configurado en Vercel. Sin esta variable, la aplicación no puede conectarse a la base de datos para crear/buscar usuarios.

## ✅ Solución: Configurar DATABASE_URL en Vercel

### Opción 1: Usar la Base de Datos de Supabase (Recomendado)

Si estás usando Supabase, puedes usar su base de datos PostgreSQL incluida:

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Database**
4. Busca la sección **Connection string** o **Connection pooling**
5. Copia la **Connection string** (formato URI o con parámetros)

**Formato típico:**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

O con parámetros:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```

**⚠️ IMPORTANTE:** Reemplaza `[PASSWORD]` con la contraseña de tu base de datos de Supabase.

### Opción 2: Usar Connection Pooling (Recomendado para Producción)

Para mejor rendimiento en producción, usa Connection Pooling:

1. En Supabase Dashboard → **Settings** → **Database**
2. Busca **Connection pooling**
3. Copia la URL de **Session mode** o **Transaction mode**
4. Formato típico:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

### Configurar en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto `circulo-lovat`
3. Ve a **Settings** → **Environment Variables**
4. Haz clic en **Add New**
5. Agrega:
   - **Name**: `DATABASE_URL`
   - **Value**: La connection string que copiaste (con la contraseña reemplazada)
   - **Environment**: Selecciona **Production**, **Preview**, y **Development** según necesites
6. Haz clic en **Save**

### Verificar la Configuración

Después de agregar `DATABASE_URL`:

1. Vercel reconstruirá automáticamente la aplicación
2. Intenta hacer login de nuevo
3. Revisa los logs de Vercel para ver si aparecen:
   - `[Context] Access token received, verifying...`
   - `[Context] Token verified, Supabase user:`
   - `[Context] User lookup result:`
   - `[Context] Returning context with user:`

## 🔐 Seguridad

- **Nunca** compartas tu `DATABASE_URL` públicamente
- La contraseña está incluida en la URL, mantén esta variable segura
- En Vercel, las variables de entorno están encriptadas

## 🐛 Si Aún No Funciona

1. **Verifica que la base de datos esté migrada:**
   - Asegúrate de haber ejecutado las migraciones de Supabase
   - Verifica que la tabla `users` exista en tu base de datos

2. **Verifica los logs de Vercel:**
   - Busca errores relacionados con conexión a la base de datos
   - Busca los logs `[Context]` que agregamos

3. **Verifica la contraseña:**
   - Asegúrate de que la contraseña en `DATABASE_URL` sea correcta
   - Si olvidaste la contraseña, puedes resetearla en Supabase Dashboard → Settings → Database

## 📝 Ejemplo de DATABASE_URL

```
postgresql://postgres:tu_password_aqui@db.muywutvowctgvdtwavsw.supabase.co:5432/postgres?sslmode=require
```

**Nota:** Reemplaza `tu_password_aqui` con tu contraseña real de Supabase.

