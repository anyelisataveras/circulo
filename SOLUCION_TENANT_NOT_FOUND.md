# 🔧 Solución: "Tenant or user not found" Error

## ❌ Error Actual

```
PostgresError: Tenant or user not found
code: 'XX000'
```

Este error persiste incluso con la región correcta (`eu-central-1`).

## 🔍 Causa Probable

El error "Tenant or user not found" con código `XX000` indica que el pooler de Supabase no puede encontrar el tenant. Esto puede suceder cuando:

1. **El service role key necesita URL encoding** en el connection string
2. **El formato del connection string está incorrecto** para el pooler
3. **El service role key no es válido** o está expirado

## ✅ Solución: URL-Encode el Service Role Key

El service role key puede contener caracteres especiales (como `-`, `_`, `.`) que necesitan ser URL-encoded en el connection string.

### Connection String con Service Role Key URL-Encoded

```
postgresql://postgres.muywutvowctgvdtwavsw:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eXd1dHZvd2N0Z3ZkdHdhdnN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI2Njk2NywiZXhwIjoyMDc5ODQyOTY3fQ.%2DSVIV1zWOWoz74Bp8kT%2Dg9cGTBBeC8qApbEKHNVc2wA@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

**Nota:** El guion (`-`) al inicio de la tercera parte del JWT se convierte en `%2D` cuando está URL-encoded.

## 📝 Pasos para Aplicar la Solución

1. **Copia el connection string de arriba** (con el service role key URL-encoded)
2. **Ve a Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**
3. **Edita `DATABASE_URL`**
4. **Pega el connection string completo** (con URL encoding)
5. **Guarda** y haz **redeploy**
6. **Prueba hacer login** y revisa los logs

## 🔍 Alternativa: Verificar Service Role Key en Supabase Dashboard

Si el problema persiste después de URL-encoding:

1. **Ve a Supabase Dashboard** → Tu proyecto → **Settings** → **API**
2. **Busca "Service Role Key"** (no el anon key)
3. **Copia el key completo** (debe tener 3 partes separadas por puntos)
4. **Verifica que no esté expirado**
5. **Reemplaza el key en el connection string** y vuelve a intentar

## 🔍 Alternativa: Usar Connection String Directo (No Pooler)

Si el pooler sigue sin funcionar, puedes usar la conexión directa temporalmente:

```
postgresql://postgres.muywutvowctgvdtwavsw:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eXd1dHZvd2N0Z3ZkdHdhdnN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI2Njk2NywiZXhwIjoyMDc5ODQyOTY3fQ.-SVIV1zWOWoz74Bp8kT-g9cGTBBeC8qApbEKHNVc2wA@db.muywutvowctgvdtwavsw.supabase.co:5432/postgres?sslmode=require
```

**⚠️ Nota:** La conexión directa no es recomendada para producción en serverless, pero puede ayudar a diagnosticar el problema.

## 📋 Verificación

Después de actualizar `DATABASE_URL` y hacer redeploy, busca en los logs de Vercel:

- ✅ `[Database] Connecting to:` - Muestra los detalles de conexión
- ✅ `[Database] Database connection successful` - Conexión exitosa
- ✅ `[Database] Query executed successfully` - Query ejecutada correctamente
- ❌ NO deberías ver `Tenant or user not found`
- ❌ NO deberías ver `authentication failed`

