# 🔧 Fix: "Tenant or user not found" Error

## Error Actual

```
PostgresError: Tenant or user not found
code: 'XX000'
```

Este error indica que el pooler de Supabase no puede encontrar el tenant/proyecto.

## Posibles Causas

1. **Service Role Key incorrecto o expirado**
2. **Formato del connection string incorrecto**
3. **Región incorrecta**
4. **Proyecto reference incorrecto**

## Solución 1: Verificar Service Role Key

El service role key debe ser el **completo** desde Supabase Dashboard:

1. Ve a **Supabase Dashboard** → Tu proyecto → **Settings** → **API**
2. Busca **Service Role Key** (no el anon key)
3. **Copia el key completo** (debe tener 3 partes separadas por puntos)
4. Verifica que no esté expirado

## Solución 2: Verificar Formato del Connection String

El formato correcto para Supabase pooler es:

```
postgresql://postgres.[PROJECT-REF]:[SERVICE-ROLE-KEY]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Ejemplo:**
```
postgresql://postgres.muywutvowctgvdtwavsw:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eXd1dHZvd2N0Z3ZkdHdhdnN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI2Njk2NywiZXhwIjoyMDc5ODQyOTY3fQ.-SVIV1zWOWoz74Bp8kT-g9cGTBBeC8qApbEKHNVc2wA@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

## Solución 3: URL-Encode el Service Role Key

Si el service role key contiene caracteres especiales, puede necesitar URL encoding. Prueba esto:

1. **Copia el service role key completo**
2. **URL-encode el key** (puedes usar una herramienta online o Node.js)
3. **Reemplaza el key en el connection string**

**Ejemplo con Node.js:**
```javascript
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eXd1dHZvd2N0Z3ZkdHdhdnN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI2Njk2NywiZXhwIjoyMDc5ODQyOTY3fQ.-SVIV1zWOWoz74Bp8kT-g9cGTBBeC8qApbEKHNVc2wA';
const encoded = encodeURIComponent(key);
console.log(`postgresql://postgres.muywutvowctgvdtwavsw:${encoded}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`);
```

## Solución 4: Probar Diferentes Regiones

Si `eu-west-1` no funciona, prueba con otras regiones europeas:

- `eu-central-1` (Frankfurt)
- `eu-west-2` (London)
- `eu-west-3` (Paris)

**Ejemplo para eu-central-1:**
```
postgresql://postgres.muywutvowctgvdtwavsw:[SERVICE-ROLE-KEY]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

## Solución 5: Usar Connection String Directo (No Pooler)

Si el pooler no funciona, puedes usar la conexión directa temporalmente:

```
postgresql://postgres.muywutvowctgvdtwavsw:[SERVICE-ROLE-KEY]@db.muywutvowctgvdtwavsw.supabase.co:5432/postgres?sslmode=require
```

**⚠️ Nota:** La conexión directa no es recomendada para producción en serverless, pero puede ayudar a diagnosticar el problema.

## Pasos para Diagnosticar

1. **Verifica el service role key:**
   - Debe tener 3 partes separadas por puntos
   - Debe ser el key completo (no truncado)
   - Debe estar activo (no expirado)

2. **Verifica el proyecto reference:**
   - Debe coincidir con tu proyecto de Supabase
   - Formato: `muywutvowctgvdtwavsw`

3. **Verifica la región:**
   - Debe coincidir con la región de tu proyecto
   - Puedes encontrarla en Supabase Dashboard → Settings → General

4. **Prueba el connection string:**
   - Usa una herramienta como `psql` o un cliente PostgreSQL
   - O prueba en Supabase SQL Editor con una query simple

## Próximos Pasos

1. **Verifica el service role key completo** en Supabase Dashboard
2. **Actualiza `DATABASE_URL` en Vercel** con el connection string correcto
3. **Haz redeploy** en Vercel
4. **Revisa los logs** para ver si el error cambia

## Logs a Revisar

Después de actualizar `DATABASE_URL` y hacer redeploy, busca en los logs de Vercel:

- ✅ `[Database] Connecting to:` - Muestra los detalles de conexión
- ✅ `[Database] Database connection successful` - Conexión exitosa
- ❌ `Tenant or user not found` - Error persistente
- ❌ `authentication failed` - Service role key incorrecto
- ❌ `ENOTFOUND` - Hostname incorrecto

