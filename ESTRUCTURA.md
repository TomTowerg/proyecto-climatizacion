# 📂 Estructura del Proyecto

```
proyecto-climatizacion/
│
├── README.md
├── .gitignore
├── INSTALACION-DIA1.md
│
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── .env                    # (crear manualmente)
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── dev.db             # (se crea automáticamente)
│   │   └── migrations/        # (se crea con prisma migrate)
│   │
│   └── src/
│       ├── index.js
│       │
│       ├── routes/            # (crear en Día 2)
│       │   ├── auth.js
│       │   ├── clientes.js
│       │   ├── equipos.js
│       │   ├── ordenes.js
│       │   ├── weather.js
│       │   └── ai.js
│       │
│       ├── controllers/       # (crear en Día 2)
│       │   ├── authController.js
│       │   ├── clientesController.js
│       │   ├── equiposController.js
│       │   └── ordenesController.js
│       │
│       ├── middleware/        # (crear en Día 2)
│       │   └── auth.js
│       │
│       └── utils/             # (crear en Día 3)
│           └── validarRut.js
│
└── frontend/
    ├── package.json
    ├── .env.example
    ├── .env                   # (crear manualmente)
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    │
    ├── public/                # (crear para assets)
    │   └── vite.svg
    │
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        │
        ├── i18n/
        │   ├── config.js
        │   └── locales/
        │       ├── es.json
        │       └── en.json
        │
        ├── components/        # (crear en Día 4-5)
        │   ├── layout/
        │   │   ├── Navbar.jsx
        │   │   ├── Sidebar.jsx
        │   │   └── Layout.jsx
        │   │
        │   ├── forms/
        │   │   ├── ClienteForm.jsx
        │   │   ├── EquipoForm.jsx
        │   │   └── OrdenForm.jsx
        │   │
        │   ├── tables/
        │   │   ├── ClientesTable.jsx
        │   │   ├── EquiposTable.jsx
        │   │   └── OrdenesTable.jsx
        │   │
        │   └── common/
        │       ├── Button.jsx
        │       ├── Input.jsx
        │       ├── Modal.jsx
        │       └── Card.jsx
        │
        ├── pages/             # (crear en Día 4-5)
        │   ├── auth/
        │   │   ├── Login.jsx
        │   │   └── Register.jsx
        │   │
        │   ├── Dashboard.jsx
        │   ├── Clientes.jsx
        │   ├── Equipos.jsx
        │   ├── OrdenesTrabajoPage.jsx
        │   ├── Calendar.jsx
        │   ├── Weather.jsx
        │   └── Settings.jsx
        │
        ├── services/          # (crear en Día 3-4)
        │   ├── api.js
        │   ├── authService.js
        │   ├── clientesService.js
        │   ├── equiposService.js
        │   ├── ordenesService.js
        │   ├── weatherService.js
        │   └── aiService.js
        │
        ├── context/           # (crear en Día 4)
        │   └── AuthContext.jsx
        │
        └── utils/             # (crear según necesidad)
            ├── validarRut.js
            └── formatters.js
```

## 📝 Notas sobre la Estructura

### ✅ Ya Creados (Día 1)
- Todos los archivos de configuración
- Estructura base de carpetas
- package.json con dependencias
- Configuración de Prisma
- Archivos de i18n (multilenguaje)
- App.jsx y main.jsx básicos

### 🔜 Por Crear (Días 2-9)
- Rutas y controladores del backend
- Componentes React
- Páginas completas
- Servicios de API
- Context de autenticación
- Utilidades (validación RUT)

## 🎯 Estado Actual del Proyecto

**Backend**: ✅ Configurado y listo
- Express iniciado
- Prisma configurado
- Base de datos creada
- Estructura de rutas preparada

**Frontend**: ✅ Configurado y listo
- React + Vite funcionando
- Tailwind CSS configurado
- React Router preparado
- Multilenguaje configurado (es/en)
- Componentes placeholder creados

**Git**: 🟡 Por inicializar
- Estructura lista para primer commit
- .gitignore configurado

## 🚀 Cómo empezar a trabajar

1. **Crear nuevas carpetas** según las vayas necesitando
2. **Seguir la guía INSTALACION-DIA1.md** para el setup completo
3. **Hacer commits frecuentes** de tus avances
4. **Mantener esta estructura** para organización

## 💡 Convenciones

- **Backend**: Usar camelCase para funciones y variables
- **Frontend**: Usar PascalCase para componentes
- **Archivos**: Nombrar según su función (ClienteForm, authService)
- **Carpetas**: Plural para colecciones (components, pages, routes)
