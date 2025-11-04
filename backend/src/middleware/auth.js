import { verifyToken } from '../utils/jwt.js'

// Middleware para verificar autenticación
export const authenticate = (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Token no proporcionado' 
      })
    }

    // Formato esperado: "Bearer TOKEN"
    const token = authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ 
        error: 'Formato de token inválido' 
      })
    }

    // Verificar token
    const decoded = verifyToken(token)

    if (!decoded) {
      return res.status(401).json({ 
        error: 'Token inválido o expirado' 
      })
    }

    // Agregar userId al request para uso en las rutas
    req.userId = decoded.userId
    req.userEmail = decoded.email

    next()

  } catch (error) {
    console.error('Error en autenticación:', error)
    res.status(401).json({ 
      error: 'Error de autenticación' 
    })
  }
}