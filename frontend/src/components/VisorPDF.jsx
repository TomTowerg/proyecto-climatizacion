import { useState, useEffect } from 'react'
import { X, Download, FileText, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

function VisorPDF({ cotizacionId, onClose }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const token = localStorage.getItem('token')

  // Abrir PDF en nueva pestaña directamente
  useEffect(() => {
    const openPDF = async () => {
      try {
        const response = await fetch(`${API_URL}/cotizaciones/${cotizacionId}/pdf`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Error al cargar PDF')
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        // Abrir en nueva pestaña
        window.open(url, '_blank')
        
        // Limpiar URL después de 1 segundo
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
        }, 1000)

        // Cerrar modal inmediatamente
        onClose()
        
        toast.success('PDF abierto en nueva pestaña')
      } catch (error) {
        console.error('Error:', error)
        setError(true)
        setLoading(false)
        toast.error('Error al abrir el PDF')
      }
    }

    openPDF()
  }, [cotizacionId, token, onClose, API_URL])

  const handleDownload = async () => {
    try {
      const response = await fetch(`${API_URL}/cotizaciones/${cotizacionId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al descargar PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cotizacion-${cotizacionId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('PDF descargado exitosamente')
    } catch (error) {
      console.error('Error al descargar:', error)
      toast.error('Error al descargar el PDF')
    }
  }

  // Mostrar loading o error si es necesario
  if (loading && !error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={40} />
          <p className="text-gray-600">Abriendo PDF...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <FileText className="mx-auto mb-4 text-red-600" size={40} />
          <h3 className="text-xl font-bold mb-2">Error al abrir PDF</h3>
          <p className="text-gray-600 mb-4">No se pudo cargar el PDF</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Descargar PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default VisorPDF