# URLs a Configurar en Supabase - Guía Rápida

## 📍 Dónde Configurar

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **URL Configuration**

## ✅ URLs que DEBES Configurar

### 1. Site URL (URL Principal)

**Para Producción:**
```
https://circulo-lovat.vercel.app
```

*(Si tu dominio es diferente, usa ese en su lugar)*

---

### 2. Redirect URLs (URLs de Redirección)

Agrega **ambas** URLs (una por línea):

**Desarrollo:**
```
http://localhost:3000/auth/callback
```

**Producción:**
```
https://circulo-lovat.vercel.app/auth/callback
```

---

## 📝 Ejemplo Completo de Configuración

En la sección **URL Configuration** de Supabase, deberías ver algo así:

```
Site URL:
https://circulo-lovat.vercel.app

Redirect URLs:
http://localhost:3000/auth/callback
https://circulo-lovat.vercel.app/auth/callback
```

## ⚠️ Importante

- **Site URL**: Debe ser la URL de producción cuando estés en producción
- **Redirect URLs**: Puedes tener múltiples URLs (una por línea)
- **No olvides hacer clic en "Save"** después de configurar
- Si cambias de dominio, actualiza estas URLs también

## 🔍 Cómo Verificar

Después de configurar:
1. Guarda los cambios en Supabase
2. Intenta hacer login con Google
3. Si funciona, verás que te redirige correctamente a `/auth/callback`
4. Si aún da error, verifica que las URLs sean exactas (sin espacios, con https/http correcto)

## 🐛 Problemas Comunes

### Error: "redirect_uri_mismatch"
- Verifica que la URL en **Redirect URLs** sea exactamente: `https://circulo-lovat.vercel.app/auth/callback`
- No debe tener espacios al inicio o final
- Debe coincidir exactamente con la URL que usa tu aplicación

### Error: "ERR_CONNECTION_REFUSED" en localhost
- Asegúrate de tener `http://localhost:3000/auth/callback` en Redirect URLs
- Verifica que tu servidor local esté corriendo en el puerto 3000
