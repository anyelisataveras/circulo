# 📍 Dónde Encontrar la Región en Supabase

## Ubicación de la Región

La región del proyecto de Supabase se encuentra en:

### Opción 1: Settings → General (Más Común)

1. En el **sidebar izquierdo** del dashboard de Supabase
2. Haz clic en **"Settings"** (el que está en la parte superior del sidebar, no el de Database)
3. Luego haz clic en **"General"** (si no se abre automáticamente)
4. Busca la sección **"Project Settings"** o **"Project Information"**
5. Busca **"Region"** o **"Project Region"**
6. Verás algo como:
   - `us-west-1` (Oregon, USA)
   - `us-east-1` (Virginia, USA)
   - `eu-west-1` (Ireland)
   - `ap-southeast-1` (Singapore)
   - `eu-central-1` (Frankfurt)
   - etc.

### Opción 2: Project Overview

1. En el dashboard principal (cuando abres el proyecto)
2. A veces la región aparece en el **header** o en la **información del proyecto**
3. Busca texto como "Region: us-west-1" o similar

### Opción 3: Si No La Encuentras

Si no encuentras la región, puedes intentar estas regiones comunes en orden:

1. **`us-west-1`** (Oregon, USA) - La más común para proyectos nuevos
2. **`us-east-1`** (Virginia, USA)
3. **`eu-west-1`** (Ireland)
4. **`ap-southeast-1`** (Singapore)

O puedes construir el connection string sin la región usando el formato directo (aunque puede dar el error ENOTFOUND que ya viste).

## 🔍 Cómo Verificar la Región

Una vez que tengas el connection string construido, puedes verificar si la región es correcta:

1. Si el connection string funciona → la región es correcta ✅
2. Si da error `ENOTFOUND` → prueba otra región

## 📝 Nota

La región es importante para el formato de pooling:
```
aws-0-[REGION].pooler.supabase.com
```

Si tu región es `us-west-1`, entonces el hostname será:
```
aws-0-us-west-1.pooler.supabase.com
```

