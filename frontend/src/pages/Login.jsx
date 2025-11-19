// ============================================
// LOGIN.JSX CON GOOGLE SIGN-IN CORRECTO
// Ubicación: frontend/src/pages/Login.jsx
// ============================================

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import toast from 'react-hot-toast'
import { login } from '../services/authService'

function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Login normal con email/password
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await login({ email, password })
      toast.success(response.message || 'Login exitoso')
      navigate('/dashboard')
    } catch (error) {
      console.error('Error en login:', error)
      const errorMessage = error.response?.data?.error || 'Error al iniciar sesión'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // ⭐ LOGIN CON GOOGLE (CORRECTO)
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true)

      // Decodificar el JWT de Google para obtener los datos del usuario
      const decoded = jwtDecode(credentialResponse.credential)
      
      // Enviar al backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          googleId: decoded.sub,
          email: decoded.email,
          name: decoded.name
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || error.error || 'Error al iniciar sesión con Google')
      }

      const data = await response.json()
      
      // Guardar token y usuario en localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      toast.success('Login con Google exitoso')
      navigate('/dashboard')
    } catch (error) {
      console.error('Error en Google login:', error)
      toast.error(error.message || 'Error al iniciar sesión con Google')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    toast.error('Error al iniciar sesión con Google')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="card max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          {t('app.title')}
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('auth.login')}
          </button>

          {/* ⭐ BOTÓN DE GOOGLE (CORRECTO) */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="signin_with"
              locale="es"
              theme="outline"
              size="large"
              width="100%"
            />
          </div>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          {t('auth.dontHaveAccount')}{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login