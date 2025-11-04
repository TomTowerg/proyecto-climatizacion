import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { isAuthenticated } from '../services/authService'
import api from '../services/authService'
import toast from 'react-hot-toast'

function PruebaIA() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState(null)

  if (!isAuthenticated()) {
    navigate('/')
    return null
  }

  const probarTraduccion = async () => {
    setLoading(true)
    try {
      const response = await api.post('/ia/traducir', {
        texto: 'Hola, ¿cómo estás?',
        idiomaDestino: 'en'
      })
      setResultado(response.data)
      toast.success('¡Traducción exitosa!')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al traducir: ' + (error.response?.data?.error || error.message))
      setResultado({ error: error.response?.data?.error || error.message })
    } finally {
      setLoading(false)
    }
  }

  const probarRecomendaciones = async () => {
    setLoading(true)
    try {
      const response = await api.post('/ia/recomendaciones', {
        tipo: 'mantenimiento',
        equipo: {
          marca: 'Samsung',
          modelo: 'AR12',
          tipo: 'Split'
        },
        trabajoRealizado: 'Se realizó limpieza de filtros y recarga de gas refrigerante R410A'
      })
      setResultado(response.data)
      toast.success('¡Recomendaciones generadas!')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al generar recomendaciones: ' + (error.response?.data?.error || error.message))
      setResultado({ error: error.response?.data?.error || error.message })
    } finally {
      setLoading(false)
    }
  }

  const probarAnalisis = async () => {
    setLoading(true)
    try {
      const response = await api.post('/ia/analizar-urgencia', {
        descripcion: 'El aire acondicionado del comedor principal dejó de funcionar completamente. Hace mucho calor y tenemos clientes esperando.',
        tipo: 'reparacion',
        cliente: 'Restaurant Don Pedro'
      })
      setResultado(response.data)
      toast.success('¡Análisis completado!')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al analizar: ' + (error.response?.data?.error || error.message))
      setResultado({ error: error.response?.data?.error || error.message })
    } finally {
      setLoading(false)
    }
  }

  const probarChat = async () => {
    setLoading(true)
    try {
      const response = await api.post('/ia/chat', {
        mensaje: 'Mi aire acondicionado no enfría, ¿qué puede ser?',
        historial: []
      })
      setResultado(response.data)
      toast.success('¡Chat respondió!')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error en chat: ' + (error.response?.data?.error || error.message))
      setResultado({ error: error.response?.data?.error || error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          🧪 Pruebas de IA - Gemini
        </h1>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={probarTraduccion}
            disabled={loading}
            className="btn-primary py-4"
          >
            {loading ? '⏳ Probando...' : '🌍 Probar Traductor'}
          </button>

          <button
            onClick={probarRecomendaciones}
            disabled={loading}
            className="btn-primary py-4"
          >
            {loading ? '⏳ Probando...' : '📋 Probar Recomendaciones'}
          </button>

          <button
            onClick={probarAnalisis}
            disabled={loading}
            className="btn-primary py-4"
          >
            {loading ? '⏳ Probando...' : '🔍 Probar Análisis Urgencia'}
          </button>

          <button
            onClick={probarChat}
            disabled={loading}
            className="btn-primary py-4"
          >
            {loading ? '⏳ Probando...' : '💬 Probar Chat'}
          </button>
        </div>

        {resultado && (
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Resultado:</h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(resultado, null, 2)}
            </pre>
          </div>
        )}
      </main>
    </div>
  )
}

export default PruebaIA