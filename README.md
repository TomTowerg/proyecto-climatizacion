# 🌡️ KMTS Powertech - Sistema de Gestión HVAC

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Sistema integral de gestión para empresas de climatización**

[Demo en Vivo](https://proyecto-climatizacion-p629.vercel.app)

</div>

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Licencia](#-licencia)

---

## 📖 Descripción

**KMTS Powertech** es un sistema de gestión empresarial diseñado específicamente para empresas de climatización y HVAC (Heating, Ventilation, and Air Conditioning). Permite administrar clientes, equipos, órdenes de trabajo, inventario y cotizaciones de manera integrada y eficiente.

### 🎯 Objetivo del Proyecto

Sistema desarrollado con estándares de producción empresarial, demostrando competencias en desarrollo Full-Stack moderno con énfasis en seguridad y experiencia de usuario.

---

## ✨ Características

### 🔐 Autenticación y Seguridad
- Autenticación segura con JWT
- Integración OAuth 2.0 con Google
- Cifrado de datos sensibles
- Protección contra ataques comunes
- Validación de RUT chileno

### 👥 Gestión de Clientes
- CRUD completo de clientes
- Protección de datos sensibles
- Búsqueda avanzada
- Historial de equipos y servicios

### 🔧 Gestión de Equipos
- Registro de equipos HVAC
- Información técnica completa
- Trazabilidad de instalaciones

### 📋 Órdenes de Trabajo
- Tipos: Instalación, Mantención, Reparación
- Gestión de estados y urgencias
- **Análisis inteligente con IA**
- Asignación de técnicos
- Integración con calendario

### 📦 Inventario
- Control de stock en tiempo real
- Alertas automáticas
- Gestión de precios
- Historial de movimientos

### 💰 Cotizaciones
- Generación de cotizaciones
- Creación rápida de clientes
- Cálculo automático con descuentos
- Generación de PDF
- Flujo de aprobación automatizado

### 📅 Calendario
- Vistas: mensual, semanal, diaria
- Codificación por colores
- Navegación intuitiva

### 📊 Dashboard
- Estadísticas en tiempo real
- Gráficos interactivos
- Indicadores económicos chilenos
- Alertas y accesos rápidos

### 🌍 Multilenguaje
- 🇪🇸 Español
- 🇺🇸 English 
- 🇧🇷 Português (Proximante)
- 🇫🇷 Français (Proximante)
- 🇩🇪 Deutsch (Proximante)
- 🇮🇹 Italiano (Proximante)
- 🇨🇳 中文 (Proximante)

### 🤖 Inteligencia Artificial
- Análisis automático de urgencia
- Recomendaciones inteligentes
- Asistente virtual integrado

---

## 🛠 Tecnologías

### Frontend
- React 18 con Vite
- Tailwind CSS
- React Router
- Internacionalización (i18next)
- Gráficos interactivos

### Backend
- Node.js con Express
- PostgreSQL con Prisma ORM
- Autenticación JWT
- Integración con Google AI

### Infraestructura
- Vercel (Frontend)
- Railway (Backend + BD)
- GitHub (Control de versiones)

---

## 🚀 Instalación

### Prerrequisitos

- Node.js 18 o superior
- PostgreSQL 15 o superior
- Cuenta de Google Cloud (para OAuth)

### Clonar el Repositorio

```bash
git clone https://github.com/TomTowerg/proyecto-climatizacion.git
cd proyecto-climatizacion
```

### Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Configurar Variables de Entorno

Copia los archivos de ejemplo y configura tus valores:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### Inicializar Base de Datos

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

### Ejecutar en Desarrollo

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Acceder a: `http://localhost:5173`

---

## 📱 Uso

### Acceso al Sistema

1. Accede a la aplicación
2. Inicia sesión con tu cuenta o con Google
3. Navega por los módulos desde el menú

### Módulos Principales

| Módulo | Función |
|--------|---------|
| Dashboard | Vista general y estadísticas |
| Clientes | Gestión de clientes |
| Equipos | Registro de equipos HVAC |
| Órdenes | Gestión de trabajos |
| Inventario | Control de stock |
| Cotizaciones | Generación de presupuestos |
| Calendario | Vista de agenda |

### Cambiar Idioma

Utiliza el selector de idioma en la barra de navegación para cambiar entre los 7 idiomas disponibles.

---


## 🔒 Seguridad

Este sistema implementa múltiples capas de seguridad:

- Autenticación robusta
- Cifrado de datos sensibles
- Protección contra ataques comunes
- Rate limiting
- Validación de datos

---

## 🤝 Contribución

1. Fork el repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👨‍💻 Autor

**KMTS Powertech**

---

<div align="center">

**[⬆ Volver arriba](https://github.com/TomTowerg/proyecto-climatizacion/blob/main/README.md#%EF%B8%8F-kmts-powertech---sistema-de-gesti%C3%B3n-hvac)**

</div>
