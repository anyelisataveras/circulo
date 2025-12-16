# 🔧 DATABASE_URL para Región Europa

## Connection String para Europa

Si tu proyecto está en la región de Europa, usa este formato:

### Región: `eu-west-1` (Ireland) - La más común

```
postgresql://postgres.muywutvowctgvdtwavsw:[SERVICE-ROLE-KEY]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

### Región: `eu-central-1` (Frankfurt) - Alternativa

Si `eu-west-1` no funciona, prueba:

```
postgresql://postgres.muywutvowctgvdtwavsw:[SERVICE-ROLE-KEY]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

## 📝 Pasos para Configurar

1. **Copia tu Service Role Key** de Settings → API
2. **Reemplaza `[SERVICE-ROLE-KEY]`** en el formato de arriba con tu key real
3. **Actualiza `DATABASE_URL` en Vercel** con el connection string completo
4. **Haz redeploy**

## ⚠️ Importante sobre el Service Role Key

El service role key puede tener caracteres especiales. Si el connection string no funciona:

1. **Prueba primero sin codificar** (copia el key directamente)
2. **Si falla**, codifica solo los caracteres especiales:
   - `+` → `%2B`
   - `/` → `%2F`
   - `=` → `%3D`

Pero generalmente funciona sin codificar si lo copias directamente.

## ✅ Ejemplo Completo

Si tu service role key es `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eXd1dHdvd2N0Z3ZkdHdhdnN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5OTg3NjU0MCwiZXhwIjoyMDE1NDUyNTQwfQ.abc123...`, entonces:

```
postgresql://postgres.muywutvowctgvdtwavsw:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eXd1dHdvd2N0Z3ZkdHdhdnN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5OTg3NjU0MCwiZXhwIjoyMDE1NDUyNTQwfQ.abc123...@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

## 🔍 Verificación

Después de configurar:
1. Haz redeploy en Vercel
2. Intenta hacer login
3. Revisa los logs - NO deberías ver `ENOTFOUND`
4. Si ves `ENOTFOUND`, prueba con `eu-central-1` en lugar de `eu-west-1`

