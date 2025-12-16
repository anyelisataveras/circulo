# 🔍 Cómo Obtener los Logs de Vercel

## Pasos para Ver los Logs

1. **Ve a Vercel Dashboard**: https://vercel.com/dashboard
2. **Selecciona tu proyecto** `circulo-lovat`
3. **Haz clic en "Logs"** (en el menú superior)
4. **Intenta hacer login** en tu aplicación
5. **Vuelve a los logs de Vercel** y busca mensajes recientes

## Qué Buscar en los Logs

Después de intentar hacer login, busca estos mensajes en los logs:

### Mensajes que DEBERÍAS ver (si todo funciona):
```
[Context] Access token received, verifying...
[Context] Token verified, Supabase user: { id: '...', email: '...' }
[Database] Database connection successful
[Database] Executing query for supabaseUserId: ...
[Database] Query executed successfully, result count: 0
[Context] User lookup result: { found: false }
[Context] User not found, creating new user...
[Database] User inserted successfully
[Context] User created, lookup result: { found: true, userId: ... }
```

### Mensajes que indican PROBLEMAS:

**Error de conexión:**
```
Error: getaddrinfo ENOTFOUND ...
```
→ El hostname es incorrecto o la región está mal

**Error de autenticación:**
```
Error: password authentication failed
Error: authentication failed
```
→ El service role key está incorrecto

**Error de query:**
```
Failed query: select ...
DrizzleQueryError: Failed query
```
→ Problema con RLS o con la query SQL

**Sin conexión:**
```
[Context] Database not available
```
→ DATABASE_URL no está configurado o no está disponible

## 📋 Qué Compartir

Copia y pega los logs de Vercel que muestren:
1. **Cualquier error** que aparezca después de intentar login
2. **Mensajes que empiecen con** `[Context]` o `[Database]`
3. **Cualquier mensaje de error** relacionado con la base de datos

## 🔍 Filtros Útiles en Vercel Logs

En la página de Logs de Vercel:
- Puedes filtrar por **tiempo** (últimos 5 minutos, 1 hora, etc.)
- Puedes buscar por texto (ej: busca "Context" o "Database")
- Los logs más recientes aparecen primero

## ⚠️ Importante

Los logs del **cliente** (navegador) no muestran el error del servidor. Necesitamos los logs del **servidor** (Vercel) para diagnosticar el problema.

