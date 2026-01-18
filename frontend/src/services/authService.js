import axios from 'axios'

// ⭐ CORREGIDO: Puerto 3001 para desarrollo local
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
console.log('🌐 API URL:', API_URL)

// Configurar axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ⭐ AGREGAR: Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el token expiró o es inválido, hacer logout automático
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Opcional: redirigir al login
      // window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

// Registro de usuario
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData)
  if (response.data.token) {
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
  }
  return response.data
}

// Login de usuario
export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials)
  if (response.data.token) {
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
  }
  return response.data
}

// Logout
export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

// Obtener usuario actual
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me')
  return response.data
}

// Verificar si el usuario está autenticado
export const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}

// Obtener token
export const getToken = () => {
  return localStorage.getItem('token')
}

// Obtener usuario desde localStorage
export const getUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export default api