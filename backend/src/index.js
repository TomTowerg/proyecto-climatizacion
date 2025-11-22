// ============================================
// INDEX.JS CON SEGURIDAD COMPLETA + INDICADORES
// Reemplazar: backend/src/index.js
// ============================================

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import xss from 'xss-clean'

// Importar rate limiters
import { apiLimiter, loginLimiter, registerLimiter } from './middleware/rateLimiter.js'

// Importar rutas
import authRoutes from './routes/auth.js'
import clientesRoutes from './routes/clientes.js'
import equiposRoutes from './routes/equipos.js'
import ordenesTrabajoRoutes from './routes/ordenesTrabajo.js'
import inventarioRoutes from './routes/inventario.js'
import cotizacionesRoutes from './routes/cotizaciones.js'
import iaRoutes from './routes/ia.js'
import indicatorRoutes from './routes/indicators.js' // ⭐ 1. NUEVO IMPORT

dotenv.config()

const app = express()
// Configurar trust proxy para Railway/proxies
app.set('trust proxy', 1)

const PORT = process.env.PORT || 5000

// ============================================
// MIDDLEWARES DE SEGURIDAD
// ============================================

// 1. Helmet - Headers de seguridad HTTP
app.use(helmet({
  contentSecurityPolicy: false, // Deshabilitar para desarrollo
  crossOriginEmbedderPolicy: false
}))

// 2. XSS Protection - Prevenir ataques XSS
app.use(xss())

// 3. CORS configurado
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

// 4. Parse JSON
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 5. Rate Limiting General para toda la API
app.use('/api', apiLimiter)

// ============================================
// RUTAS
// ============================================

// Health check (sin rate limiting)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Rutas de autenticación (con rate limiting específico)
app.use('/api/auth', authRoutes)

// Rutas protegidas
app.use('/api/clientes', clientesRoutes)
app.use('/api/equipos', equiposRoutes)
app.use('/api/ordenes-trabajo', ordenesTrabajoRoutes)
app.use('/api/inventario', inventarioRoutes)
app.use('/api/cotizaciones', cotizacionesRoutes)
app.use('/api/ia', iaRoutes)
app.use('/api/indicators', indicatorRoutes) // ⭐ 2. NUEVA RUTA AGREGADA

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.originalUrl 
  })
})

// ============================================
// MANEJO DE ERRORES GLOBAL
// ============================================
app.use((err, req, res, next) => {
  console.error('Error:', err)
  
  // Error de rate limiting
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Demasiadas peticiones',
      message: err.message
    })
  }
  
  // Error general
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`)
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔒 Seguridad: Helmet + XSS + Rate Limiting activos`)
  console.log(`💰 Módulo Económico: Activo (mindicador.cl)`)
  console.log(`🔐 Cifrado de datos: ${process.env.ENCRYPTION_KEY ? 'Activo' : '⚠️  NO CONFIGURADO'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
})

export default app