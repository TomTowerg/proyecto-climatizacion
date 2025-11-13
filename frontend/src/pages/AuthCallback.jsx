import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('Procesando autenticación...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token')
        const userString = searchParams.get('user')
        const error = searchParams.get('error')

        console.log('AuthCallback - Parámetros recibidos:', { 
          token: token ? 'Presente' : 'Ausente', 
          user: userString ? 'Presente' : 'Ausente',
          error 
        })

        // Si hay error, redirigir a login
        if (error) {
          console.error('Error en callback:', error)
          toast.error('Error al iniciar sesión con Google')
          navigate('/')
          return
        }

        // Verificar que al menos tengamos el token
        if (!token) {
          console.error('No se recibió token')
          toast.error('No se recibió token de autenticación')
          navigate('/')
          return
        }

        // Guardar token
        localStorage.setItem('token', token)
        console.log('Token guardado en localStorage')

        // Intentar guardar información del usuario si viene
        if (userString) {
          try {
            const user = JSON.parse(decodeURIComponent(userString))
            localStorage.setItem('user', JSON.stringify(user))
            console.log('Usuario guardado:', user.email)
            setStatus(`¡Bienvenido ${user.name || user.email}!`)
          } catch (parseError) {
            console.warn('No se pudo parsear usuario, continuando sin él:', parseError)
            // No es crítico, continuamos
          }
        }

        // Éxito
        toast.success('¡Autenticación exitosa!')
        
        // Pequeño delay para que el usuario vea el mensaje
        setTimeout(() => {
          navigate('/dashboard')
        }, 500)

      } catch (err) {
        console.error('Error al procesar callback:', err)
        toast.error('Error al procesar autenticación')
        navigate('/')
      }
    }

    handleCallback()
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
        <p className="text-white text-xl font-medium">{status}</p>
        <p className="text-blue-100 text-sm mt-2">Por favor espera...</p>
      </div>
    </div>
  )
}

export default AuthCallback