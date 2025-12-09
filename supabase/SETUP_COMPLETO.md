# 🚀 Setup Completo de Supabase para Circulo

## ✅ Paso 1: Ejecutar el SQL completo

**Archivo:** `supabase/migrations/complete_setup.sql`

Este archivo incluye:
- ✅ Esquema completo (tablas, enums, índices)
- ✅ Políticas RLS (Row Level Security)
- ✅ Funciones y triggers
- ✅ Storage buckets y políticas

**Cómo ejecutarlo:**
1. Ve a: https://supabase.com/dashboard/project/muywutvowctgvdtwavsw/sql/new
2. Copia TODO el contenido de `complete_setup.sql`
3. Pégalo en el SQL Editor
4. Haz clic en **Run** o presiona `Cmd+Enter`

---

## ⚙️ Paso 2: Configurar Secrets (Variables de Entorno)

Ve a: **Settings → Secrets** en el dashboard de Supabase

Agrega estos secrets (si los necesitas):

```env
# Para Edge Functions
OPENAI_API_KEY=sk-...                    # Si usas OpenAI para análisis de documentos
BUILT_IN_FORGE_API_URL=https://...      # Si usas Forge API
BUILT_IN_FORGE_API_KEY=...              # Si usas Forge API

# Para email (si usas send-email function)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM=noreply@circulo.app

# Para WhatsApp webhook (si usas whatsapp-webhook function)
WHATSAPP_WEBHOOK_SECRET=tu-secret-key
```

**Nota:** Los secrets son opcionales según qué funciones uses.

---

## 🔧 Paso 3: Desplegar Edge Functions

Las Edge Functions se despliegan desde la terminal:

```bash
# Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# Login en Supabase
supabase login

# Link tu proyecto
supabase link --project-ref muywutvowctgvdtwavsw

# Desplegar todas las funciones
supabase functions deploy ai-document-analysis
supabase functions deploy send-email
supabase functions deploy whatsapp-webhook
```

**O manualmente desde el dashboard:**
1. Ve a: **Edge Functions** en el dashboard
2. Crea cada función y copia el código de:
   - `supabase/functions/ai-document-analysis/index.ts`
   - `supabase/functions/send-email/index.ts`
   - `supabase/functions/whatsapp-webhook/index.ts`

---

## 📋 Resumen: ¿Qué incluye cada archivo?

| Archivo | Incluye | Cómo ejecutar |
|---------|---------|---------------|
| `complete_setup.sql` | ✅ Esquema<br>✅ RLS<br>✅ Funciones<br>✅ Triggers<br>✅ Storage | SQL Editor |
| Edge Functions | ⚠️ Funciones serverless | CLI o Dashboard |
| Secrets | ⚠️ Variables de entorno | Dashboard → Settings |

---

## ✅ Checklist Final

- [ ] Ejecutado `complete_setup.sql` en SQL Editor
- [ ] Configurados Secrets (si los necesitas)
- [ ] Desplegadas Edge Functions (si las necesitas)
- [ ] Verificado que las tablas existen
- [ ] Verificado que los buckets de storage existen

---

## 🧪 Verificar que todo funciona

Ejecuta en el SQL Editor:

```sql
-- Verificar tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar buckets
SELECT name, public, file_size_limit 
FROM storage.buckets;

-- Verificar funciones
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';
```


