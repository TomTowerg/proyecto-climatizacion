import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no está definida en variables de entorno')
}

/**
 * MIDDLEWARE DE AUTENTICACIÓN
 * Verifica el token JWT en:
 * 1. Authorization header (Bearer token)
 * 2. Query parameter ?token=xxx (para PDFs en iframes)
 */
export const authenticate = (req, res, next) => {
  try {
    let token = null

    // 1. Intentar obtener token del header Authorization
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    // 2. Si no hay token en header, intentar desde query params
    if (!token && req.query.token) {
      token = req.query.token
    }

    // 3. Verificar que haya token
    if (!token) {
      return res.status(401).json({ error: 'No se proporcionó token de autenticación' })
    }

    // 4. Verificar y decodificar el token
    const decoded = jwt.verify(token, JWT_SECRET)

    // 5. Agregar información del usuario a la request
    req.userId = decoded.userId
    req.userEmail = decoded.email

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' })
    }
    console.error('Error en autenticación:', error)
    return res.status(500).json({ error: 'Error al verificar autenticación' })
  }
}

// ============================================
// VERIFICAR ROL DE ADMINISTRADOR
// ============================================
export const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      error: 'Acceso denegado. Se requieren permisos de administrador'
    })
  }
  next()
}

// ============================================
// VERIFICAR ROLES ESPECÍFICOS
// ============================================
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        error: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}`
      })
    }
    next()
  }
}

export default authenticate