# 🔍 Logs de Vercel que Necesito Ver

## ❌ Problema Actual

El cliente muestra:
```
[Auth] User data is null - backend returned null user
```

Esto significa que el backend está retornando `null` en lugar del usuario.

## 📋 Logs que Necesito Ver

Después de intentar hacer login, ve a **Vercel Dashboard** → Tu proyecto → **Logs** y busca estos mensajes:

### 1. Logs de Conexión a la Base de Datos

Busca mensajes que empiecen con `[Database]`:

```
[Database] Connecting to: { ... }
[Database] Database connection successful
```

O errores como:
```
[Database] Failed to connect: ...
```

### 2. Logs de Contexto (Autenticación)

Busca mensajes que empiecen con `[Context]`:

```
[Context] Access token received, verifying...
[Context] Token verified, Supabase user: { ... }
[Context] User lookup result: { ... }
[Context] User not found, creating new user...
[Context] Error creating user: ...
```

### 3. Errores Específicos

Busca estos errores:

- `Tenant or user not found` - Región incorrecta o service role key incorrecto
- `authentication failed` - Service role key incorrecto
- `ENOTFOUND` - Hostname incorrecto
- `Failed query` - Error en la query SQL
- `DrizzleQueryError` - Error de Drizzle ORM

## 📝 Cómo Obtener los Logs

1. **Ve a Vercel Dashboard**: https://vercel.com/dashboard
2. **Selecciona tu proyecto** `circulo-lovat`
3. **Haz clic en "Logs"** (en el menú superior)
4. **Intenta hacer login** en tu aplicación
5. **Vuelve a los logs de Vercel**
6. **Filtra por tiempo** (últimos 5 minutos)
7. **Busca mensajes que empiecen con** `[Database]` o `[Context]`
8. **Copia y pega los logs** aquí

## 🔍 Qué Buscar Específicamente

Después de intentar hacer login, deberías ver en los logs:

### Si la conexión funciona:
```
[Database] Connecting to: { hostname: 'aws-0-eu-west-1.pooler.supabase.com', ... }
[Database] Database connection successful
[Context] Access token received, verifying...
[Context] Token verified, Supabase user: { id: '...', email: '...' }
[Database] Executing query for supabaseUserId: ...
```

### Si hay un error:
```
[Context] Error creating user: DrizzleQueryError: Failed query: ...
PostgresError: Tenant or user not found
```

## ⚠️ Importante

Los logs del **cliente** (navegador) no muestran el error del servidor. Necesito los logs del **servidor** (Vercel) para diagnosticar el problema.

