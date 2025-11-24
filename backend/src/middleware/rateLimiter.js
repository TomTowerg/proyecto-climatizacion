// ============================================
// RATE LIMITER - OPTIMIZADO
// backend/src/middleware/rateLimiter.js
// ============================================

import rateLimit from 'express-rate-limit'

// ============================================
// LOGIN LIMITER (Anti fuerza bruta)
// Protege contra intentos masivos de login
// ============================================
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos máximos
  message: {
    error: 'Demasiados intentos de login. Por favor intenta en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // No cuenta intentos exitosos
})

// ============================================
// REGISTER LIMITER (Anti spam de registros)
// Evita creación masiva de cuentas
// ============================================
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 registros por hora (aumentado de 3)
  message: {
    error: 'Demasiados registros desde esta IP. Por favor intenta más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// ============================================
// API LIMITER GENERAL
// Para uso normal de la aplicación
// ============================================
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // ⭐ AUMENTADO: 100 → 1000 requests por 15 minutos
  message: {
    error: 'Demasiadas peticiones. Por favor intenta más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip si estamos en desarrollo
  skip: (req) => process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true'
})

// ============================================
// STRICT LIMITER (Operaciones sensibles)
// Para: cambio de contraseña, eliminación masiva, etc.
// ============================================
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 30, // ⭐ AUMENTADO: 10 → 30 operaciones por hora
  message: {
    error: 'Has excedido el límite de operaciones sensibles. Intenta en 1 hora.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// ============================================
// IA LIMITER (Para llamadas a Gemini API)
// Protege contra uso excesivo de IA
// ============================================
export const iaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // 50 llamadas a IA por hora
  message: {
    error: 'Has excedido el límite de consultas de IA. Intenta en 1 hora.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// ============================================
// RESUMEN DE LÍMITES
// ============================================
// 
// | Limiter       | Límite          | Uso                        |
// |---------------|-----------------|----------------------------|
// | loginLimiter  | 5 / 15 min      | Intentos de login          |
// | registerLimiter| 5 / 1 hora     | Registros de cuenta        |
// | apiLimiter    | 1000 / 15 min   | API general                |
// | strictLimiter | 30 / 1 hora     | Cambio contraseña, etc.    |
// | iaLimiter     | 50 / 1 hora     | Llamadas a Gemini          |
// 
// ============================================