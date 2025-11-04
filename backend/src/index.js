import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import session from 'express-session'
import passport from './config/passport.js'
import authRoutes from './routes/auth.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Session middleware (para Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // En producción usar true con HTTPS
}))

// Initialize Passport
app.use(passport.initialize())
app.use(passport.session())

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

// TODO: Import and use other routes
// import clienteRoutes from './routes/clientes.js'
// import equipoRoutes from './routes/equipos.js'
// import ordenTrabajoRoutes from './routes/ordenesTrabajo.js'

// app.use('/api/clientes', clienteRoutes)
// app.use('/api/equipos', equipoRoutes)
// app.use('/api/ordenes-trabajo', ordenTrabajoRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
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