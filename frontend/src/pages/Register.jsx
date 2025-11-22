import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next' // 1. IMPORTAR
import PasswordInput from '../components/PasswordInput'

const Register = () => {
  const { t } = useTranslation() // 2. INICIALIZAR
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {t('auth.register')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('app.title')}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre Completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.form.fullName')}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('auth.form.namePlaceholder')}
            />
          </div>

          {/* Correo Electrónico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.email')}
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@email.com"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('auth.form.authorizedOnly')}
            </p>
          </div>

          {/* Usuario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.form.username')}
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('auth.form.usernamePlaceholder')}
            />
          </div>

          {/* Contraseña - CON VALIDACIÓN */}
          <PasswordInput
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            label={t('auth.password')}
          />

          {/* Confirmar Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.form.confirmPassword')}
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('auth.form.confirmPlaceholder')}
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">
                {t('auth.messages.passwordsDoNotMatch')}
              </p>
            )}
          </div>

          {/* Botón Registrarse */}
          <button
            type="submit"
            disabled={loading || formData.password !== formData.confirmPassword}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('common.loading') : t('auth.register')}
          </button>
        </form>

        {/* Link a Login */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t('auth.alreadyHaveAccount')}{' '}
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('auth.login')}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register