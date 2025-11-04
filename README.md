# 🌡️ Sistema de Gestión de Climatización

Aplicación web full-stack para la gestión interna de una empresa de climatización en Chile.

## 🚀 Tecnologías Utilizadas

### Frontend
- **React 18** con Vite
- **React Router** para navegación
- **Tailwind CSS** para estilos
- **react-i18next** para multilenguaje (ES/EN)
- **react-big-calendar** para calendario de OT
- **recharts** para gráficos
- **Lucide React** para íconos

### Backend
- **Node.js** con Express
- **Prisma** como ORM
- **SQLite** como base de datos
- **bcrypt** para encriptación de contraseñas
- **JWT** para autenticación
- **Passport.js** para OAuth con Google

### APIs Externas
- **OpenWeather API** - Consultar clima
- **OpenAI API / Gemini** - Inteligencia Artificial

## 📋 Requisitos Previos

- **Node.js** 18.x o superior
- **npm** o **yarn**
- **Git**

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd proyecto-climatizacion
```

### 2. Configurar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar archivo de variables de entorno
cp .env.example .env

# Editar .env con tus credenciales
nano .env  # o usa tu editor favorito

# Generar cliente de Prisma
npm run prisma:generate

# Crear la base de datos y ejecutar migraciones
npm run prisma:migrate

# Iniciar servidor de desarrollo
npm run dev
```

El servidor estará corriendo en `http://localhost:5000`

### 3. Configurar el Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Copiar archivo de variables de entorno
cp .env.example .env

# Editar .env con tus API keys
nano .env

# Iniciar aplicación de desarrollo
npm run dev
```

La aplicación estará corriendo en `http://localhost:3000`

## 🔑 Configuración de APIs

### Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Habilita la API de Google+
4. Crea credenciales OAuth 2.0
5. Agrega `http://localhost:5000/api/auth/google/callback` como URI de redirección
6. Copia el Client ID y Client Secret a tu `.env`

### OpenWeather API

1. Regístrate en [OpenWeather](https://openweathermap.org/api)
2. Obtén tu API Key gratuita
3. Agrégala a tu `.env` del frontend

### OpenAI API (o Gemini)

1. Regístrate en [OpenAI](https://platform.openai.com/) o [Google AI Studio](https://makersuite.google.com/)
2. Genera tu API Key
3. Agrégala a tu `.env` del frontend

## 📁 Estructura del Proyecto

```
proyecto-climatizacion/
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/           # Páginas de la aplicación
│   │   ├── services/        # Servicios y llamadas API
│   │   ├── locales/         # Archivos de idioma (ES/EN)
│   │   ├── utils/           # Utilidades y helpers
│   │   └── styles/          # Estilos globales
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── routes/          # Rutas de la API
│   │   ├── controllers/     # Controladores
│   │   ├── middleware/      # Middlewares
│   │   └── utils/           # Utilidades
│   ├── prisma/
│   │   └── schema.prisma    # Esquema de base de datos
│   └── package.json
└── README.md
```

## 🎯 Funcionalidades

### ✅ Implementadas en Setup Inicial

- [x] Estructura base de frontend y backend
- [x] Configuración de Prisma con SQLite
- [x] Sistema de multilenguaje (ES/EN)
- [x] Páginas de Login y Dashboard
- [x] Modelos de datos (User, Cliente, Equipo, OrdenTrabajo)
- [x] Validador de RUT chileno

### 🚧 Por Implementar (Días 2-9)

- [ ] Autenticación local (bcrypt + JWT)
- [ ] Autenticación con Google OAuth
- [ ] CRUD de Clientes
- [ ] CRUD de Equipos
- [ ] CRUD de Órdenes de Trabajo
- [ ] Calendario interactivo
- [ ] Integración con API de Clima
- [ ] Integración con API de IA
- [ ] Dashboard con estadísticas
- [ ] Diseño responsive completo
- [ ] Despliegue en Vercel

## 🚀 Scripts Disponibles

### Frontend

```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Compilar para producción
npm run preview  # Vista previa de build de producción
```

### Backend

```bash
npm run dev              # Iniciar servidor con nodemon
npm run start            # Iniciar servidor en producción
npm run prisma:generate  # Generar cliente de Prisma
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:studio    # Abrir Prisma Studio
```

## 📝 Commits y Control de Versiones

### Estructura de Commits

Cada commit debe seguir el formato:

```
tipo(módulo): descripción breve

Descripción más detallada si es necesario
```

**Tipos de commits:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bugs
- `docs`: Cambios en documentación
- `style`: Cambios de formato (no afectan lógica)
- `refactor`: Refactorización de código
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento

**Ejemplo:**
```
feat(auth): implementar login con Google OAuth

- Agregar passport-google-oauth20
- Configurar estrategia de Google
- Crear ruta /api/auth/google/callback
```

## 🌐 Despliegue

### Frontend en Vercel

1. Sube tu código a GitHub
2. Ve a [Vercel](https://vercel.com)
3. Importa tu repositorio
4. Configura las variables de entorno
5. Despliega

### Backend (Opciones)

- **Render**: Plan gratuito con PostgreSQL
- **Railway**: Fácil despliegue con base de datos
- **Heroku**: Opción clásica

## 👥 Equipo

- Miembro 1: [Nombre] - [Rol]
- Miembro 2: [Nombre] - [Rol]
- Miembro 3: [Nombre] - [Rol]

## 📄 Licencia

MIT

## 🆘 Soporte

Si tienes problemas:

1. Revisa que todas las dependencias estén instaladas
2. Verifica que las variables de entorno estén configuradas
3. Asegúrate de que el backend esté corriendo antes de iniciar el frontend
4. Revisa los logs en la consola para mensajes de error

---

**¡Hecho con ❤️ en Chile!** 🇨🇱
