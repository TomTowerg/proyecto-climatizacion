# 📦 Guía de Instalación - Día 1

## ✅ Checklist de Setup

### 1️⃣ Prerrequisitos
Asegúrate de tener instalado:
- [ ] Node.js (versión 18 o superior) - https://nodejs.org/
- [ ] Git - https://git-scm.com/
- [ ] Editor de código (VS Code recomendado)

### 2️⃣ Verificar instalaciones
```bash
node --version    # Debe mostrar v18.x.x o superior
npm --version     # Debe mostrar 9.x.x o superior
git --version     # Debe mostrar 2.x.x o superior
```

### 3️⃣ Descargar el proyecto
```bash
# Descarga el proyecto desde Claude
# Extrae el archivo ZIP
# O clónalo si ya está en GitHub
```

### 4️⃣ Instalación del Backend

```bash
# Navegar a la carpeta backend
cd proyecto-climatizacion/backend

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env

# Editar .env con tus propios valores
# Generar un JWT_SECRET aleatorio: puedes usar un generador online

# Inicializar Prisma
npx prisma generate
npx prisma migrate dev --name init

# Verificar que se creó la base de datos
# Debería aparecer el archivo: backend/prisma/dev.db
```

### 5️⃣ Probar el Backend

```bash
# En la carpeta backend
npm run dev

# Deberías ver:
# 🚀 Servidor corriendo en http://localhost:3000
# 📝 Modo: development

# Probar en el navegador o Postman:
# GET http://localhost:3000/
# Debería devolver: { "message": "API de Sistema de Gestión de Climatización", ... }
```

### 6️⃣ Instalación del Frontend

```bash
# En una NUEVA terminal, navegar a la carpeta frontend
cd proyecto-climatizacion/frontend

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env

# El .env debe contener:
# VITE_API_URL=http://localhost:3000
# VITE_GOOGLE_CLIENT_ID=(lo configuraremos después)
```

### 7️⃣ Probar el Frontend

```bash
# En la carpeta frontend
npm run dev

# Deberías ver:
#   VITE v5.x.x  ready in XXX ms
#   ➜  Local:   http://localhost:5173/

# Abrir en el navegador: http://localhost:5173
# Deberías ver la página de Dashboard
```

### 8️⃣ Configurar Git (si no está en GitHub aún)

```bash
# En la carpeta raíz del proyecto
cd proyecto-climatizacion

# Inicializar Git
git init

# Agregar archivos
git add .

# Primer commit
git commit -m "Initial setup - Día 1 completado"

# Crear repositorio en GitHub y conectar
# Ir a github.com y crear un nuevo repositorio
# Luego ejecutar:
git remote add origin [URL-DE-TU-REPO]
git branch -M main
git push -u origin main
```

## 🎉 ¡Día 1 Completado!

Si todo funciona correctamente, deberías tener:

✅ Backend corriendo en `http://localhost:3000`
✅ Frontend corriendo en `http://localhost:5173`
✅ Base de datos SQLite creada
✅ Git inicializado con primer commit
✅ Proyecto listo para desarrollo

## 🐛 Solución de Problemas Comunes

### Error: "Cannot find module"
```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port 3000 already in use"
```bash
# Cambiar el puerto en backend/.env
PORT=3001
```

### Error: "Port 5173 already in use"
```bash
# Matar el proceso o cambiar puerto en vite.config.js
```

### Error de Prisma
```bash
# Regenerar cliente de Prisma
npx prisma generate
npx prisma migrate reset
```

## 📚 Próximos Pasos (Día 2)

- Crear rutas del backend (auth, clientes, equipos, órdenes)
- Implementar controladores
- Configurar JWT
- Preparar Google OAuth

## 💡 Consejos

1. **Mantén dos terminales abiertas**: una para backend, otra para frontend
2. **Usa Git frecuentemente**: haz commits cada vez que completes algo
3. **Prueba cada parte**: no avances si algo no funciona
4. **Lee los mensajes de error**: suelen decir exactamente qué está mal

## 📞 Ayuda

Si tienes problemas, revisa:
1. Que Node.js sea versión 18+
2. Que todos los archivos .env estén creados
3. Que las dependencias se instalaron correctamente
4. Los logs en la consola para ver errores específicos
