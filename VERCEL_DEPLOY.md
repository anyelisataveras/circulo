# 🚀 Guía de Despliegue en Vercel

## Archivos Creados

1. **`vercel.json`** - Configuración de Vercel
2. **`api/index.ts`** - Handler serverless para Express

## Pasos para Desplegar

### 1. Conectar el repositorio a Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Importa tu repositorio de GitHub/GitLab
3. Vercel detectará automáticamente la configuración

### 2. Configurar Variables de Entorno

En Vercel Dashboard → Settings → Environment Variables, agrega:

**REQUERIDAS:**
```env
VITE_APP_ID=circulo
VITE_SUPABASE_URL=https://muywutvowctgvdtwavsw.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_URL=https://muywutvowctgvdtwavsw.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
NODE_ENV=production
```

**RECOMENDADAS:**
```env
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.muywutvowctgvdtwavsw.supabase.co:5432/postgres
JWT_SECRET=tu-secret-seguro
VITE_APP_URL=https://tu-app.vercel.app
```

### 3. Configurar Build Settings

Vercel debería detectar automáticamente:
- **Build Command:** `npm run build`
- **Output Directory:** `dist/public`
- **Install Command:** `npm install`

### 4. Desplegar

1. Haz push a tu repositorio
2. Vercel desplegará automáticamente
3. O haz clic en "Deploy" en el dashboard

## Estructura de Archivos

```
/
├── api/
│   └── index.ts          # Handler serverless
├── vercel.json           # Configuración de Vercel
├── dist/
│   ├── public/          # Frontend build (generado)
│   └── index.js         # Server build (generado)
└── ...
```

## Cómo Funciona

1. **Build:** Vercel ejecuta `npm run build` que:
   - Compila el frontend con Vite → `dist/public/`
   - Compila el servidor con esbuild → `dist/index.js`

2. **Runtime:** 
   - Las rutas `/api/*` van a `api/index.ts` (serverless function)
   - Las demás rutas también van a `api/index.ts` que sirve el SPA

3. **SPA Routing:**
   - Todas las rutas no-API sirven `index.html`
   - El frontend maneja el routing con wouter

## Troubleshooting

### Error 404
- Verifica que `dist/public/index.html` existe después del build
- Revisa los logs de build en Vercel

### Error en API
- Verifica que las variables de entorno estén configuradas
- Revisa los logs de la función en Vercel Dashboard

### Build Falla
- Verifica que todas las dependencias estén en `package.json`
- Revisa los logs de build para errores específicos

## Notas

- Vercel compila TypeScript automáticamente
- El timeout por defecto es 10s, configurado a 30s en `vercel.json`
- Los archivos estáticos se sirven desde `dist/public/`

