import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import toast from 'react-hot-toast'
import { login } from '../services/authService'
import LanguageSelector from '../components/LanguageSelector'
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react'
import './Login.css'

function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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

  // LOGIN CON GOOGLE
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
    <div className="login-page">
      {/* Fondo animado */}
      <div className="login-bg-pattern"></div>
      
      {/* Selector de idioma */}
      <div className="login-language-selector">
        <LanguageSelector />
      </div>

      {/* Logo */}
      <div className="login-logo">
        <img src="/logo-kmts.png" alt="KMTS Powertech" />
      </div>

      {/* Card de login */}
      <div className="login-card">
        <div className="login-card-header">
          <h1 className="login-title">{t('app.title')}</h1>
          <p className="login-subtitle">{t('auth.welcomeBack', 'Bienvenido de vuelta')}</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          {/* Email */}
          <div className="login-input-group">
            <label className="login-label">
              <Mail size={16} />
              {t('auth.email')}
            </label>
            <div className="login-input-wrapper">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                placeholder="correo@ejemplo.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="login-input-group">
            <label className="login-label">
              <Lock size={16} />
              {t('auth.password')}
            </label>
            <div className="login-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Botón de login */}
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <span className="login-button-loading">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                {t('common.loading')}
              </span>
            ) : (
              <span className="login-button-content">
                <LogIn size={18} />
                {t('auth.login')}
              </span>
            )}
          </button>

          {/* Divisor */}
          <div className="login-divider">
            <span>{t('auth.or', 'o')}</span>
          </div>

          {/* Google Login */}
          <div className="login-google-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="signin_with"
              locale={t('auth.loginWithGoogle') === "Iniciar sesión con Google" ? "es" : "en"} 
              theme="filled_black"
              size="large"
              width="100%"
              shape="pill"
            />
          </div>
        </form>

        {/* Link a registro */}
        <p className="login-register-link">
          {t('auth.dontHaveAccount')}{' '}
          <Link to="/register">{t('auth.register')}</Link>
        </p>

        {/* Link a landing */}
        <Link to="/" className="login-back-link">
          ← {t('auth.backToHome', 'Volver al inicio')}
        </Link>
      </div>

      {/* Partículas decorativas */}
      <div className="login-particles">
        {[...Array(12)].map((_, i) => (
          <div key={i} className={`login-particle p${i + 1}`}></div>
        ))}
      </div>
    </div>
  )
}

export default Login
