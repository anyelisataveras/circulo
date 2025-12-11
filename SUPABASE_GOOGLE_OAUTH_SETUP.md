# Configuración de Google OAuth en Supabase

Este documento explica cómo habilitar Google OAuth en Supabase para resolver el error "provider is not enabled".

## Pasos para Habilitar Google OAuth

### 1. Acceder al Dashboard de Supabase

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto

### 2. Configurar Google OAuth Provider

1. En el menú lateral, ve a **Authentication** → **Providers**
2. Busca **Google** en la lista de proveedores
3. Haz clic en el toggle para **habilitar** Google
4. Verás un formulario con campos para configurar Google OAuth

### 3. Obtener Credenciales de Google Cloud Console

Si aún no tienes credenciales de Google OAuth:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs & Services** → **Credentials**
4. Haz clic en **Create Credentials** → **OAuth client ID**
5. Selecciona **Web application** como tipo de aplicación
6. Configura las URLs:
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (para desarrollo)
     - `https://tu-dominio.com` (para producción, ej: `https://circulo-lovat.vercel.app`)
   - **Authorized redirect URIs**:
     - `https://[TU-PROJECT-REF].supabase.co/auth/v1/callback`
     - Ejemplo: `https://muywutvowctgvdtwavsw.supabase.co/auth/v1/callback`
7. Copia el **Client ID** y **Client Secret**

### 4. Configurar en Supabase

1. En el formulario de Google en Supabase, pega:
   - **Client ID (for OAuth)**: Tu Google Client ID
   - **Client Secret (for OAuth)**: Tu Google Client Secret
2. Haz clic en **Save**

### 5. Configurar Site URL y Redirect URLs ⚠️ **IMPORTANTE**

Esta es la configuración más crítica. Ve a **Authentication** → **URL Configuration** en Supabase:

#### Site URL (URL Principal)
Esta es la URL base de tu aplicación. Configúrala según tu entorno:

- **Para Desarrollo Local:**
  ```
  http://localhost:3000
  ```

- **Para Producción (Vercel):**
  ```
  https://circulo-lovat.vercel.app
  ```
  *(Reemplaza con tu dominio real si es diferente)*

#### Redirect URLs (URLs de Redirección Permitidas)
Agrega TODAS las URLs donde Supabase puede redirigir después de la autenticación. **Agrega cada una en una línea separada:**

**Para Desarrollo:**
```
http://localhost:3000/auth/callback
```

**Para Producción:**
```
https://circulo-lovat.vercel.app/auth/callback
```

**Nota:** Puedes agregar múltiples URLs (una por línea) para soportar tanto desarrollo como producción simultáneamente.

#### Pasos Visuales:
1. En Supabase Dashboard, ve a **Authentication** (menú lateral)
2. Haz clic en **URL Configuration**
3. En el campo **Site URL**, ingresa tu URL de producción (ej: `https://circulo-lovat.vercel.app`)
4. En el campo **Redirect URLs**, agrega:
   - `http://localhost:3000/auth/callback` (desarrollo)
   - `https://circulo-lovat.vercel.app/auth/callback` (producción)
5. Haz clic en **Save**

### 6. Verificar Variables de Entorno

Asegúrate de que tu aplicación tenga las siguientes variables de entorno configuradas:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://[TU-PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui

# Para producción, también configura:
VITE_APP_URL=https://tu-dominio.com
```

### 7. Probar la Autenticación

1. Reinicia tu aplicación si está corriendo
2. Ve a la página de login
3. Haz clic en el botón "Google"
4. Deberías ser redirigido a Google para autenticarte
5. Después de autenticarte, serás redirigido de vuelta a `/auth/callback`

## Solución de Problemas

### Error: "provider is not enabled"
- **Causa**: Google OAuth no está habilitado en Supabase
- **Solución**: Sigue los pasos 1-4 arriba

### Error: "ERR_CONNECTION_REFUSED" en localhost:3000
- **Causa**: El servidor local no está corriendo o el redirect está mal configurado
- **Solución**: 
  - Asegúrate de que tu servidor esté corriendo en `localhost:3000`
  - Verifica que `VITE_APP_URL` esté configurado correctamente
  - En producción, asegúrate de que `VITE_APP_URL` apunte a tu dominio de producción

### Error: "redirect_uri_mismatch"
- **Causa**: La URL de redirect no coincide con las configuradas en Google Cloud Console
- **Solución**: 
  - Verifica que la URL en Google Cloud Console sea exactamente: `https://[TU-PROJECT-REF].supabase.co/auth/v1/callback`
  - Asegúrate de que no haya espacios o caracteres extra

### Error: "Invalid client"
- **Causa**: Client ID o Client Secret incorrectos
- **Solución**: Verifica que hayas copiado correctamente las credenciales de Google Cloud Console

## Notas Importantes

- **Seguridad**: Nunca expongas tu Client Secret en el código del frontend. Supabase maneja esto de forma segura.
- **URLs de Producción**: Asegúrate de actualizar las URLs en Google Cloud Console cuando despliegues a producción.
- **Testing**: Siempre prueba primero en desarrollo antes de desplegar a producción.

## Referencias

- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
