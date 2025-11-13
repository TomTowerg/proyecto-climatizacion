import express from 'express'
import passport from 'passport'
import { register, login, getCurrentUser, logout, googleCallback } from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Rutas públicas (no requieren autenticación)
router.post('/register', register)
router.post('/login', login)

// Rutas de Google OAuth
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false
  })
)

router.get('/google/callback', 
  (req, res, next) => {
    console.log('=== GOOGLE CALLBACK INICIADO ===')
    console.log('URL completa:', req.url)
    console.log('Query params:', req.query)
    next()
  },
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/?error=google_auth_failed`
  }),
  (req, res, next) => {
    console.log('=== DESPUÉS DE PASSPORT.AUTHENTICATE ===')
    console.log('Usuario autenticado:', req.user ? 'SÍ' : 'NO')
    if (req.user) {
      console.log('Usuario:', { id: req.user.id, email: req.user.email })
    }
    next()
  },
  googleCallback
)

// Rutas protegidas (requieren autenticación)
router.get('/me', authenticate, getCurrentUser)
router.post('/logout', authenticate, logout)

export default router