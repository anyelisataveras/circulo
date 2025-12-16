# 🔍 Verificar que DATABASE_URL Funciona

## Problema Actual

Después de cambiar `DATABASE_URL`, el backend sigue retornando `null` para el usuario.

## Pasos para Diagnosticar

### 1. Revisar Logs de Vercel

Ve a **Vercel Dashboard** → Tu proyecto → **Logs** y busca estos mensajes después de un intento de login:

**Si ves `ENOTFOUND`:**
- El hostname es incorrecto
- La región puede estar mal
- Prueba con `eu-central-1` en lugar de `eu-west-1`

**Si ves `authentication failed` o `password authentication failed`:**
- El service role key puede estar mal copiado
- Verifica que no tenga espacios al inicio o final
- Verifica que esté completo

**Si ves `Failed query`:**
- Puede ser un problema de RLS
- Verifica que la migración SQL se ejecutó correctamente

**Si NO ves ningún error de conexión:**
- El connection string puede estar funcionando
- El problema puede ser otro (RLS, query, etc.)

### 2. Verificar el Formato del Connection String

El connection string debe tener exactamente este formato:

```
postgresql://postgres.muywutvowctgvdtwavsw:[SERVICE-ROLE-KEY]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Verifica:**
- ✅ Empieza con `postgresql://`
- ✅ Usuario es `postgres.muywutvowctgvdtwavsw` (no solo `postgres`)
- ✅ Password es el service role key completo
- ✅ Hostname es `aws-0-[REGION].pooler.supabase.com`
- ✅ Puerto es `6543` (no `5432`)
- ✅ Termina con `/postgres`

### 3. Probar Regiones Diferentes

Si usaste `eu-west-1` y no funciona, prueba:

1. **`eu-central-1`** (Frankfurt):
```
postgresql://postgres.muywutvowctgvdtwavsw:[SERVICE-ROLE-KEY]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

2. **`eu-south-1`** (Milan):
```
postgresql://postgres.muywutvowctgvdtwavsw:[SERVICE-ROLE-KEY]@aws-0-eu-south-1.pooler.supabase.com:6543/postgres
```

### 4. Verificar Service Role Key

1. Ve a **Supabase Dashboard** → **Settings** → **API**
2. Verifica que el **service_role** key esté completo
3. Asegúrate de copiarlo sin espacios
4. Si tiene caracteres especiales (`+`, `/`, `=`), puede que necesites codificarlos

### 5. Probar Connection String Directo (Alternativa)

Si el pooling no funciona, puedes intentar el formato directo pero con el service role key:

```
postgresql://postgres.muywutvowctgvdtwavsw:[SERVICE-ROLE-KEY]@db.muywutvowctgvdtwavsw.supabase.co:5432/postgres?sslmode=require
```

**⚠️ NOTA:** Este formato puede dar `ENOTFOUND` en algunos planes de Supabase, pero vale la pena intentarlo.

## 🔍 Qué Compartir para Debug

Si el problema persiste, comparte:

1. **Los logs de Vercel** (especialmente los mensajes `[Context]` y `[Database]`)
2. **El formato exacto** del connection string que usaste (sin el service role key, solo el formato)
3. **Cualquier error específico** que veas en los logs

