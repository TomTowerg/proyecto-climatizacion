import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const userString = searchParams.get('user')
    const error = searchParams.get('error')

    if (error) {
      toast.error('Error al iniciar sesión con Google')
      navigate('/')
      return
    }

    if (token && userString) {
      try {
        const user = JSON.parse(decodeURIComponent(userString))
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        toast.success('¡Login con Google exitoso!')
        navigate('/dashboard')
      } catch (err) {
        console.error('Error al procesar callback:', err)
        toast.error('Error al procesar autenticación')
        navigate('/')
      }
    } else {
      toast.error('Error: no se recibió información de autenticación')
      navigate('/')
    }
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto"></div>
        <p className="mt-4 text-white text-lg font-medium">Procesando autenticación...</p>
      </div>
    </div>
  )
}

export default AuthCallback