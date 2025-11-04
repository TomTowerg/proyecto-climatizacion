# 📅 Día 1: Setup Inicial - Guía Paso a Paso

## ✅ Checklist de Tareas Completadas

- [x] Estructura de carpetas creada
- [x] Frontend configurado (React + Vite + Tailwind)
- [x] Backend configurado (Node.js + Express + Prisma)
- [x] Archivos de configuración creados
- [x] Multilenguaje configurado (ES/EN)
- [x] Páginas base (Login y Dashboard)
- [x] Esquema de base de datos definido
- [x] README con documentación completa

## 🚀 Próximos Pasos (Para Comenzar a Trabajar)

### 1. Inicializar Git y Hacer el Primer Commit

```bash
# Ir a la carpeta del proyecto
cd proyecto-climatizacion

# Inicializar repositorio
git init

# Agregar todos los archivos
git add .

# Primer commit
git commit -m "feat(setup): configuración inicial del proyecto

- Setup de frontend con React + Vite + Tailwind
- Setup de backend con Express + Prisma
- Configuración de multilenguaje (ES/EN)
- Páginas base de Login y Dashboard
- Esquema de base de datos con Prisma
- Validador de RUT chileno"
```

### 2. Crear Repositorio en GitHub

1. Ve a [GitHub](https://github.com/new)
2. Crea un nuevo repositorio (público o privado)
3. NO inicialices con README (ya lo tenemos)
4. Copia la URL del repositorio

```bash
# Conectar con GitHub
git remote add origin <URL-de-tu-repo>

# Subir código
git branch -M main
git push -u origin main
```

### 3. Instalar Dependencias del Backend

```bash
cd backend
npm install
```

**Nota:** Esto puede tardar 2-3 minutos dependiendo de tu conexión.

### 4. Configurar Variables de Entorno del Backend

```bash
# Crear archivo .env desde el ejemplo
cp .env.example .env

# Editar .env (puedes usar nano, vim, o tu editor favorito)
nano .env
```

**Configuración mínima para empezar:**

```env
DATABASE_URL="file:./dev.db"
PORT=5000
NODE_ENV=development
JWT_SECRET=mi_secreto_super_seguro_123
SESSION_SECRET=otra_clave_secreta_456
FRONTEND_URL=http://localhost:3000
```

### 5. Inicializar Base de Datos con Prisma

```bash
# Generar el cliente de Prisma
npm run prisma:generate

# Crear la base de datos y ejecutar migraciones
npm run prisma:migrate

# Cuando te pida nombre de migración, escribe: init
```

### 6. Iniciar el Servidor Backend

```bash
# Iniciar en modo desarrollo
npm run dev
```

✅ Deberías ver: `🚀 Server running on http://localhost:5000`

### 7. Instalar Dependencias del Frontend (Nueva terminal)

```bash
# Abre una NUEVA terminal y ve al frontend
cd frontend
npm install
```

### 8. Configurar Variables de Entorno del Frontend

```bash
# Crear archivo .env
cp .env.example .env

# Editar .env
nano .env
```

**Configuración mínima para empezar:**

```env
VITE_API_URL=http://localhost:5000/api
```

*Nota: Las API keys de Google, Weather y AI se configurarán en días posteriores.*

### 9. Iniciar el Frontend

```bash
npm run dev
```

✅ Deberías ver: Aplicación corriendo en `http://localhost:3000`

### 10. Probar la Aplicación

1. Abre tu navegador en `http://localhost:3000`
2. Deberías ver la página de Login
3. Intenta hacer login (aunque aún no está conectado al backend)
4. Verifica que el cambio de idioma funcione (si tienes un selector)

## 🎯 Objetivos Alcanzados del Día 1

✅ **Estructura del proyecto lista**
✅ **Frontend y Backend configurados**
✅ **Base de datos definida**
✅ **Sistema de multilenguaje funcionando**
✅ **Repositorio Git inicializado**
✅ **Código subido a GitHub**

## 📝 Segundo Commit Sugerido

Después de verificar que todo funciona:

```bash
# Agregar archivos de configuración de entorno
git add backend/.env frontend/.env

# Commit (estos archivos NO se subirán por el .gitignore)
git commit -m "chore(config): configurar variables de entorno locales"

# Si hiciste algún ajuste:
git add .
git commit -m "fix(setup): ajustes menores de configuración"
git push
```

## ⚠️ Problemas Comunes y Soluciones

### Error: "Cannot find module"
**Solución:** Asegúrate de haber ejecutado `npm install` en ambas carpetas.

### Error: "Port 3000 is already in use"
**Solución:** 
- Cierra otras aplicaciones usando ese puerto
- O cambia el puerto en `vite.config.js`

### Error de Prisma: "Environment variable not found"
**Solución:** Verifica que creaste el archivo `.env` en la carpeta `backend`

### Frontend no se conecta al Backend
**Solución:** 
- Verifica que el backend esté corriendo en puerto 5000
- Revisa que `VITE_API_URL` en frontend/.env sea correcto

## 🎉 ¡Felicitaciones!

Has completado exitosamente el Día 1. Tu proyecto está listo para empezar a desarrollar las funcionalidades principales.

## 📅 Próximo Paso: Día 2

Mañana trabajaremos en:
- Implementar autenticación local (registro y login)
- Crear las rutas y controladores del backend
- Conectar el frontend con el backend
- Probar el login básico

---

**💡 Consejo:** Haz commits frecuentes y con mensajes descriptivos. Esto te ayudará a trackear tu progreso y cumplir con el requisito de 3+ commits por integrante.
