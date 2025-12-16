# 🔍 Verificar Service Role Key

## Problema Identificado

El connection string que compartiste tiene `abc123...` al final, lo cual parece ser un placeholder o el key está truncado.

## ✅ Service Role Key Completo

Un service role key de Supabase tiene **3 partes** separadas por puntos (`.`):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eXd1dHdvd2N0Z3ZkdHdhdnN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5OTg3NjU0MCwiZXhwIjoyMDE1NDUyNTQwfQ.[FIRMA_COMPLETA_AQUI]
```

**Características:**
- **Parte 1** (header): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9` - ~40 caracteres
- **Parte 2** (payload): `eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eXd1dHdvd2N0Z3ZkdHdhdnN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5OTg3NjU0MCwiZXhwIjoyMDE1NDUyNTQwfQ` - ~150-200 caracteres
- **Parte 3** (signature): La más larga, puede tener 100-200+ caracteres

**El key completo suele tener 300-500 caracteres en total.**

## 🔧 Cómo Obtener el Key Completo

1. Ve a **Supabase Dashboard** → **Settings** → **API**
2. Busca **"service_role"** key
3. Haz clic en el ícono del ojo 👁️ o en **"Reveal"**
4. **Copia TODO el key** (no solo las primeras partes)
5. Asegúrate de copiar hasta el final (puede que necesites hacer scroll)

## ⚠️ Caracteres Especiales

El service role key puede tener caracteres especiales que necesitan codificación URL:
- `+` → `%2B`
- `/` → `%2F`
- `=` → `%3D`

**Pero generalmente funciona sin codificar** si lo copias directamente.

## ✅ Connection String Correcto

Una vez que tengas el key completo, el connection string debería verse así:

```
postgresql://postgres.muywutvowctgvdtwavsw:[SERVICE-ROLE-KEY-COMPLETO]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

**Ejemplo de key completo:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eXd1dHdvd2N0Z3ZkdHdhdnN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5OTg3NjU0MCwiZXhwIjoyMDE1NDUyNTQwfQ.abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ...
```

## 🔍 Verificación

1. El key debe tener **3 partes** separadas por puntos
2. La tercera parte (después del segundo punto) debe ser **muy larga** (100+ caracteres)
3. El key completo debe tener **al menos 300 caracteres**

## 📝 Próximos Pasos

1. Obtén el service role key **completo** de Settings → API
2. Construye el connection string con el key completo
3. Actualiza `DATABASE_URL` en Vercel
4. Haz redeploy
5. Prueba el login

