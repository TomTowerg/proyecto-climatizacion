import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PasswordInput from '../components/PasswordInput'
import LanguageSelector from '../components/LanguageSelector'
import { User, Mail, AtSign, Lock, UserPlus, AlertCircle } from 'lucide-react'
import './Login.css' // Reutilizar los estilos

const Register = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.messages.passwordsDoNotMatch'))
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          username: formData.username,
          password: formData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Manejo de errores del backend
        if (response.status === 403) {
          setError(t('auth.messages.emailNotAuthorized'))
        } else if (response.status === 400) {
          if (data.error === 'Contraseña débil') {
            setError(`${t('auth.messages.weakPassword')}: ${data.details.join(', ')}`)
          } else {
            setError(data.error || t('auth.messages.registrationError'))
          }
        } else {
          setError(data.error || t('auth.messages.registrationError'))
        }
        return
      }

      // Registro exitoso
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      // Redirigir al dashboard
      navigate('/dashboard')

    } catch (err) {
      console.error('Error en registro:', err)
      setError(t('auth.messages.connectionError'))
    } finally {
      setLoading(false)
    }
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

      {/* Card de registro */}
      <div className="login-card register-card">
        <div className="login-card-header">
          <h1 className="login-title">{t('auth.register')}</h1>
          <p className="login-subtitle">{t('auth.createAccount', 'Crea tu cuenta')}</p>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          {/* Nombre Completo */}
          <div className="login-input-group">
            <label className="login-label">
              <User size={16} />
              {t('auth.form.fullName')}
            </label>
            <div className="login-input-wrapper">
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="login-input"
                placeholder={t('auth.form.namePlaceholder')}
                disabled={loading}
              />
            </div>
          </div>

          {/* Correo Electrónico */}
          <div className="login-input-group">
            <label className="login-label">
              <Mail size={16} />
              {t('auth.email')}
            </label>
            <div className="login-input-wrapper">
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="login-input"
                placeholder="tu@email.com"
                disabled={loading}
              />
            </div>
            <p className="login-input-hint">
              {t('auth.form.authorizedOnly')}
            </p>
          </div>

          {/* Usuario */}
          <div className="login-input-group">
            <label className="login-label">
              <AtSign size={16} />
              {t('auth.form.username')}
            </label>
            <div className="login-input-wrapper">
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="login-input"
                placeholder={t('auth.form.usernamePlaceholder')}
                disabled={loading}
              />
            </div>
          </div>

          {/* Contraseña - CON VALIDACIÓN */}
          <div className="login-input-group">
            <label className="login-label">
              <Lock size={16} />
              {t('auth.password')}
            </label>
            <PasswordInput
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              label=""
              className="login-password-input"
            />
          </div>

          {/* Confirmar Contraseña */}
          <div className="login-input-group">
            <label className="login-label">
              <Lock size={16} />
              {t('auth.form.confirmPassword')}
            </label>
            <div className="login-input-wrapper">
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="login-input"
                placeholder={t('auth.form.confirmPlaceholder')}
                disabled={loading}
              />
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="login-input-error">
                {t('auth.messages.passwordsDoNotMatch')}
              </p>
            )}
          </div>

          {/* Botón Registrarse */}
          <button
            type="submit"
            disabled={loading || formData.password !== formData.confirmPassword}
            className="login-button"
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
                <UserPlus size={18} />
                {t('auth.register')}
              </span>
            )}
          </button>
        </form>

        {/* Link a Login */}
        <p className="login-register-link">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/admin">{t('auth.login')}</Link>
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

export default Register
