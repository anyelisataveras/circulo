# ✅ DATABASE_URL Final con Service Role Key Completo

## 🔴 Error Actual: "Tenant or user not found"

Si ves este error en los logs de Vercel, prueba estas soluciones en orden:

## Solución 1: Probar Diferentes Regiones

El error puede ser porque la región no coincide. Prueba estas regiones en orden:

### Opción 1: eu-west-1 (Irlanda) - PRUEBA PRIMERO
```
postgresql://postgres.muywutvowctgvdtwavsw:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eXd1dHZvd2N0Z3ZkdHdhdnN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI2Njk2NywiZXhwIjoyMDc5ODQyOTY3fQ.-SVIV1zWOWoz74Bp8kT-g9cGTBBeC8qApbEKHNVc2wA@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

### Opción 2: eu-central-1 (Frankfurt) - SEGUNDA OPCIÓN
```
postgresql://postgres.muywutvowctgvdtwavsw:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eXd1dHZvd2N0Z3ZkdHdhdnN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI2Njk2NywiZXhwIjoyMDc5ODQyOTY3fQ.-SVIV1zWOWoz74Bp8kT-g9cGTBBeC8qApbEKHNVc2wA@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

### Opción 3: eu-west-2 (Londres) - TERCERA OPCIÓN
```
postgresql://postgres.muywutvowctgvdtwavsw:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eXd1dHZvd2N0Z3ZkdHdhdnN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI2Njk2NywiZXhwIjoyMDc5ODQyOTY3fQ.-SVIV1zWOWoz74Bp8kT-g9cGTBBeC8qApbEKHNVc2wA@aws-0-eu-west-2.pooler.supabase.com:6543/postgres
```

### Opción 4: eu-west-3 (París) - CUARTA OPCIÓN
```
postgresql://postgres.muywutvowctgvdtwavsw:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eXd1dHZvd2N0Z3ZkdHdhdnN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI2Njk2NywiZXhwIjoyMDc5ODQyOTY3fQ.-SVIV1zWOWoz74Bp8kT-g9cGTBBeC8qApbEKHNVc2wA@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
```

## ⚠️ Nota Importante

El service role key tiene un guion (`-`) al inicio de la tercera parte: `-SVIV1zWOWoz74Bp8kT-g9cGTBBeC8qApbEKHNVc2wA`

Esto es **normal** en JWT tokens. No lo elimines ni lo codifiques.

## 📝 Pasos para Configurar

1. **Copia el connection string completo** de arriba (usa `eu-west-1` primero)
2. **Ve a Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**
3. **Edita `DATABASE_URL`**
4. **Pega el connection string completo**
5. **Guarda** y haz **redeploy**

## ✅ Verificación

Después de configurar y hacer redeploy:

1. Intenta hacer login
2. Revisa los logs de Vercel
3. Deberías ver:
   - ✅ `[Database] Database connection successful`
   - ✅ `[Database] Query executed successfully`
   - ❌ NO deberías ver `ENOTFOUND`
   - ❌ NO deberías ver `authentication failed`

## Solución 2: Verificar la Región en Supabase Dashboard

Para encontrar la región correcta de tu proyecto:

1. Ve a **Supabase Dashboard** → Tu proyecto → **Settings** → **General**
2. Busca **Region** o **Database Region**
3. Usa el connection string correspondiente a esa región

## Solución 3: Verificar Service Role Key

Si ninguna región funciona, verifica el service role key:

1. Ve a **Supabase Dashboard** → Tu proyecto → **Settings** → **API**
2. Busca **Service Role Key** (no el anon key)
3. **Copia el key completo** (debe tener 3 partes separadas por puntos)
4. Reemplaza el key en el connection string

## 📝 Pasos para Configurar

1. **Copia el connection string** de la Opción 1 (eu-west-1)
2. **Ve a Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**
3. **Edita `DATABASE_URL`**
4. **Pega el connection string completo**
5. **Guarda** y haz **redeploy**
6. **Prueba hacer login**
7. **Revisa los logs de Vercel**

Si ves el error "Tenant or user not found":
- Prueba con la Opción 2 (eu-central-1)
- Si no funciona, prueba con la Opción 3 (eu-west-2)
- Si no funciona, prueba con la Opción 4 (eu-west-3)

## ✅ Verificación

Después de configurar y hacer redeploy, busca en los logs de Vercel:

### ✅ Logs que indican éxito:
- `[Database] Connecting to:` - Muestra los detalles de conexión
- `[Database] Database connection successful` - Conexión exitosa
- `[Database] Query executed successfully` - Query ejecutada correctamente

### ❌ Logs que indican problemas:
- `Tenant or user not found` - Región incorrecta o service role key incorrecto
- `authentication failed` - Service role key incorrecto o expirado
- `ENOTFOUND` - Hostname incorrecto

## 🔍 Si Aún No Funciona

Si ninguna región funciona:

1. **Verifica la región** en Supabase Dashboard → Settings → General
2. **Verifica el service role key** completo en Supabase Dashboard → Settings → API
3. **Comparte los logs de Vercel** para ver el error específico

