import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import session from 'express-session'
import path from 'path'
import { fileURLToPath } from 'url'

// ⭐ NUEVO: Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Cargar variables de entorno PRIMERO
dotenv.config()

console.log('🚀 Iniciando servidor...')
console.log('Environment:', process.env.NODE_ENV || 'development')

// Importar passport DESPUÉS de dotenv
import passport from './config/passport.js'
console.log('✅ Passport importado')

// Importar rutas
import authRoutes from './routes/auth.js'
import clienteRoutes from './routes/clientes.js'
import equipoRoutes from './routes/equipos.js'
import ordenTrabajoRoutes from './routes/ordenesTrabajo.js'
import inventarioRoutes from './routes/inventario.js'
import cotizacionRoutes from './routes/cotizaciones.js'
import iaRoutes from './routes/ia.js'

const app = express()
const PORT = process.env.PORT || 5000

// Middleware básico
app.use(helmet())
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://proyecto-climatizacion-production.up.railway.app',
    'https://proyecto-climatizacion-p629.vercel.app',
    'https://proyecto-climatizacion-nhc3xx8az-tomas-torres-projects.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ⭐ NUEVO: Servir archivos PDF generados
app.use('/pdfs', express.static(path.join(__dirname, '../pdfs')))

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}))

// Initialize Passport
app.use(passport.initialize())
app.use(passport.session())

console.log('✅ Middleware configurado')
console.log('✅ Passport inicializado')

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Gestión de Climatización',
    version: '1.0.0',
    status: 'running'
  })
})

// Auth routes
app.use('/api/auth', authRoutes)
app.use('/api/clientes', clienteRoutes)
app.use('/api/equipos', equipoRoutes)
app.use('/api/ordenes-trabajo', ordenTrabajoRoutes)
app.use('/api/inventario', inventarioRoutes)
app.use('/api/cotizaciones', cotizacionRoutes)
app.use('/api/ia', iaRoutes)

console.log('✅ Rutas configuradas')

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack)
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
})