# ⚡ Comandos Rápidos - Referencia

## 🚀 Inicio Rápido del Proyecto

### Primera vez (Setup completo)

```bash
# 1. Clonar proyecto
git clone <tu-repo-url>
cd proyecto-climatizacion

# 2. Backend
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run prisma:generate
npm run prisma:migrate
npm run dev

# 3. Frontend (nueva terminal)
cd ../frontend
npm install
cp .env.example .env
# Editar .env con tus API keys
npm run dev
```

### Días subsecuentes (Ya configurado)

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📦 Gestión de Dependencias

### Instalar nueva dependencia

```bash
# Frontend
cd frontend
npm install nombre-paquete

# Backend
cd backend
npm install nombre-paquete
```

### Actualizar dependencias

```bash
npm update
```

## 🗄️ Comandos de Prisma

### Ver base de datos en UI

```bash
cd backend
npm run prisma:studio
# Abre en http://localhost:5555
```

### Crear nueva migración

```bash
cd backend
# 1. Editar prisma/schema.prisma
# 2. Ejecutar:
npm run prisma:migrate
# Nombre sugerido: add_campo_x
```

### Resetear base de datos

```bash
cd backend
npx prisma migrate reset
# ⚠️ ESTO BORRA TODOS LOS DATOS
```

### Generar cliente después de cambiar schema

```bash
cd backend
npm run prisma:generate
```

## 🔧 Git - Control de Versiones

### Flujo básico de commits

```bash
# Ver cambios
git status

# Agregar archivos
git add .

# Hacer commit
git commit -m "tipo(módulo): descripción"

# Subir a GitHub
git push
```

### Tipos de commits

```bash
git commit -m "feat(auth): agregar login de usuario"
git commit -m "fix(clients): corregir validación de RUT"
git commit -m "style(ui): mejorar diseño del sidebar"
git commit -m "docs(readme): actualizar instrucciones"
git commit -m "refactor(api): reorganizar rutas"
```

### Ver historial

```bash
git log --oneline
git log --graph --oneline --all
```

### Crear y cambiar de rama

```bash
git checkout -b nombre-rama
git checkout main
```

## 🧪 Testing y Debugging

### Ver logs del backend

```bash
# Backend muestra logs automáticamente con morgan
# Ver solo errores:
cd backend
npm run dev 2>&1 | grep "Error"
```

### Limpiar caché de npm

```bash
npm cache clean --force
```

### Reinstalar node_modules

```bash
rm -rf node_modules package-lock.json
npm install
```

## 🌐 Variables de Entorno

### Backend (.env)

```env
DATABASE_URL="file:./dev.db"
PORT=5000
JWT_SECRET=tu_secreto_aqui
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=tu_client_id
VITE_WEATHER_API_KEY=tu_weather_key
VITE_AI_API_KEY=tu_ai_key
```

## 🔍 Debugging

### Ver errores de compilación

```bash
# Frontend
cd frontend
npm run dev
# Errores aparecen en consola del navegador (F12)

# Backend
cd backend
npm run dev
# Errores aparecen en terminal
```

### Limpiar y reconstruir

```bash
# Frontend
cd frontend
rm -rf node_modules .vite dist
npm install
npm run dev

# Backend
cd backend
rm -rf node_modules dist
npm install
npm run dev
```

## 📊 Base de Datos

### Crear datos de prueba (seed)

```bash
# Crear archivo: backend/prisma/seed.js
# Luego ejecutar:
cd backend
node prisma/seed.js
```

### Backup de base de datos

```bash
cd backend/prisma
cp dev.db dev.db.backup
```

### Restaurar backup

```bash
cd backend/prisma
cp dev.db.backup dev.db
```

## 🚀 Build para Producción

### Frontend

```bash
cd frontend
npm run build
# Archivos en: frontend/dist/
```

### Previsualizar build

```bash
cd frontend
npm run preview
# Abre en http://localhost:4173
```

## 🔗 URLs Importantes

```
Frontend Dev:    http://localhost:3000
Backend Dev:     http://localhost:5000
Prisma Studio:   http://localhost:5555
API Docs:        http://localhost:5000/api
```

## 🆘 Solución Rápida de Problemas

### Puerto ocupado

```bash
# Encontrar proceso
lsof -i :3000
# o
lsof -i :5000

# Matar proceso
kill -9 <PID>
```

### Módulo no encontrado

```bash
# Reinstalar
npm install

# Si persiste, limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error de Prisma

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### Cambios no se reflejan

```bash
# Frontend: Forzar recarga (Ctrl+Shift+R en navegador)
# Backend: Verificar que nodemon esté corriendo
# Si no: Ctrl+C y npm run dev nuevamente
```

## 📱 Cambio de Idioma

El idioma se guarda en `localStorage`. Para cambiarlo programáticamente:

```javascript
// En consola del navegador (F12)
localStorage.setItem('language', 'en')  // Inglés
localStorage.setItem('language', 'es')  // Español
// Luego recargar página
```

## 🎨 Tailwind CSS - Clases Útiles

```css
/* Contenedor centrado */
.container mx-auto px-4

/* Tarjeta */
.card (ya definido en proyecto)

/* Botones */
.btn-primary (ya definido)
.btn-secondary (ya definido)

/* Espaciado */
p-4    padding: 1rem
m-4    margin: 1rem
gap-4  gap: 1rem

/* Grid responsive */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
```

## 📝 Snippets Útiles

### Crear componente React

```javascript
function NombreComponente() {
  return (
    <div>
      {/* Tu código aquí */}
    </div>
  )
}

export default NombreComponente
```

### Crear ruta Express

```javascript
import express from 'express'
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    // Tu lógica aquí
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
```

### Hacer petición con Axios

```javascript
import axios from 'axios'

const response = await axios.get('/api/clientes')
const data = response.data
```

---

**💡 Tip:** Guarda este archivo como marcador para acceso rápido durante el desarrollo.
