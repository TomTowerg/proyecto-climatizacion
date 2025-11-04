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
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/?error=google_auth_failed`
  }),
  googleCallback
)

// Rutas protegidas (requieren autenticación)
router.get('/me', authenticate, getCurrentUser)
router.post('/logout', authenticate, logout)

export default router