import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { login } from '../services/authService'

function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

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
const handleGoogleLogin = () => {
  window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`
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

          <button
           type="button"
            onClick={handleGoogleLogin}
           className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            disabled={loading}
          >
           <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
           {t('auth.loginWithGoogle')}
          </button>
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