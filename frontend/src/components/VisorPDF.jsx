import { useState, useEffect } from 'react'
import { X, Download, ExternalLink, Loader, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

function VisorPDF({ cotizacionId, onClose }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [pdfBlob, setPdfBlob] = useState(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const token = localStorage.getItem('token')

  useEffect(() => {
    loadPDF()

    // Limpiar URL al desmontar
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [cotizacionId])

  const loadPDF = async () => {
    try {
      setLoading(true)
      setError(false)

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

      setPdfBlob(blob)
      setPdfUrl(url)
      setLoading(false)

    } catch (error) {
      console.error('Error al cargar PDF:', error)
      setError(true)
      setLoading(false)
      toast.error('Error al cargar el PDF')
    }
  }

  const handleDownload = () => {
    if (!pdfBlob) {
      toast.error('PDF no disponible para descarga')
      return
    }

    try {
      const url = window.URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cotizacion-${cotizacionId.toString().padStart(6, '0')}.pdf`
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

  const handleOpenNewTab = () => {
    if (!pdfUrl) {
      toast.error('PDF no disponible')
      return
    }

    // Crear un enlace temporal con download para forzar el nombre
    const a = document.createElement('a')
    a.href = pdfUrl
    a.target = '_blank'
    a.download = `cotizacion-${cotizacionId.toString().padStart(6, '0')}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    toast.success('PDF abierto en nueva pestaña')
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={40} />
          <p className="text-gray-600">Cargando PDF...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <FileText className="mx-auto mb-4 text-red-600" size={40} />
          <h3 className="text-xl font-bold mb-2 text-gray-900">Error al cargar PDF</h3>
          <p className="text-gray-600 mb-4">
            No se pudo cargar el PDF. Intenta nuevamente o contacta al administrador.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => loadPDF()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <FileText className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">
              Cotización #{cotizacionId.toString().padStart(6, '0')}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Descargar PDF"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Descargar</span>
            </button>

            <button
              onClick={handleOpenNewTab}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Abrir en nueva pestaña"
            >
              <ExternalLink size={18} />
              <span className="hidden sm:inline">Nueva Pestaña</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              title="Cerrar"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {pdfUrl && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title={`Cotización ${cotizacionId}`}
            />
          )}
        </div>

        {/* Footer con instrucciones */}
        <div className="p-3 border-t bg-gray-50 text-center">
          <p className="text-sm text-gray-600">
            💡 <strong>Tip:</strong> Usa el botón "Descargar" para guardar el PDF con el nombre correcto
          </p>
        </div>
      </div>
    </div>
  )
}

export default VisorPDF