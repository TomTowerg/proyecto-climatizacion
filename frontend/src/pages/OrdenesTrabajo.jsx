import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, Search, Sparkles, Eye, CheckCircle, FileText, Upload, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { 
  getOrdenesTrabajo, 
  createOrdenTrabajo, 
  updateOrdenTrabajo, 
  deleteOrdenTrabajo, 
  completarOrden,
  generarPDFOrden,
  subirDocumentoFirmado,
  descargarDocumentoFirmado
} from '../services/ordenTrabajoService'
import { getClientes } from '../services/clienteService'
import { getEquipos } from '../services/equipoService'
import { analizarUrgencia } from '../services/iaService'

function OrdenesTrabajo() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [ordenes, setOrdenes] = useState([])
  const [clientes, setClientes] = useState([])
  const [equipos, setEquipos] = useState([])
  const [equiposFiltrados, setEquiposFiltrados] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingOrden, setEditingOrden] = useState(null)
  const [analizando, setAnalizando] = useState(false)
  const [analisisIA, setAnalisisIA] = useState(null)
  const [showAnalisisModal, setShowAnalisisModal] = useState(false)
  const [analisisSeleccionado, setAnalisisSeleccionado] = useState(null)
  const [formData, setFormData] = useState({
    clienteId: '',
    equipoId: '',
    tipo: '',
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
    tecnico: '',
    estado: 'pendiente',
    urgencia: 'media'
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/')
      return
    }
    fetchData()
  }, [navigate])

  useEffect(() => {
    if (formData.clienteId) {
      const equiposDelCliente = equipos.filter(
        eq => eq.clienteId === parseInt(formData.clienteId)
      )
      setEquiposFiltrados(equiposDelCliente)
    } else {
      setEquiposFiltrados([])
    }
  }, [formData.clienteId, equipos])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [ordenesData, clientesData, equiposData] = await Promise.all([
        getOrdenesTrabajo(),
        getClientes(),
        getEquipos()
      ])
      setOrdenes(ordenesData)
      setClientes(clientesData)
      setEquipos(equiposData)
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error(t('workOrders.messages.loadError'))
    } finally {
      setLoading(false)
    }
  }

  // ⭐ GENERAR Y VER PDF
const handleVerPDF = async (ordenId) => {
  try {
    const loadingToast = toast.loading('Generando PDF...')
    
    const blob = await generarPDFOrden(ordenId)
    const url = window.URL.createObjectURL(blob)
    
    toast.dismiss(loadingToast)
    
    // Abrir en nueva pestaña
    window.open(url, '_blank')
    
    toast.success('PDF generado exitosamente')
    
    // Limpiar URL después de un tiempo
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 100)
    
  } catch (error) {
    console.error('Error al generar PDF:', error)
    toast.error('Error al generar el PDF')
  }
}

// ⭐ SUBIR DOCUMENTO FIRMADO
const handleUploadDocument = (ordenId) => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf,.jpg,.jpeg,.png'
  
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no debe superar los 10MB')
      return
    }
    
    try {
      const loadingToast = toast.loading('Subiendo documento...')
      
      await subirDocumentoFirmado(ordenId, file)
      
      toast.dismiss(loadingToast)
      toast.success('Documento firmado subido exitosamente')
      
      // Recargar órdenes para mostrar el checkmark
      fetchData()
      
    } catch (error) {
      console.error('Error al subir documento:', error)
      toast.error(error.message || 'Error al subir el documento')
    }
  }
  
  input.click()
}

// ⭐ DESCARGAR DOCUMENTO FIRMADO
const handleDownloadDocument = async (ordenId) => {
  try {
    const loadingToast = toast.loading('Descargando documento...')
    
    const blob = await descargarDocumentoFirmado(ordenId)
    const url = window.URL.createObjectURL(blob)
    
    // Crear enlace de descarga
    const a = document.createElement('a')
    a.href = url
    a.download = `orden-${ordenId}-firmada.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    window.URL.revokeObjectURL(url)
    
    toast.dismiss(loadingToast)
    toast.success('Documento descargado')
    
  } catch (error) {
    console.error('Error al descargar documento:', error)
    toast.error('Error al descargar el documento')
  }
}

  const handleAnalizarUrgencia = async () => {
    if (!formData.notas || formData.notas.trim() === '') {
      toast.error(t('workOrders.messages.missingDescription'))
      return
    }

    if (!formData.tipo) {
      toast.error(t('workOrders.messages.missingType'))
      return
    }

    setAnalizando(true)
    try {
      const clienteNombre = clientes.find(c => c.id === parseInt(formData.clienteId))?.nombre || 'No especificado'
      
      const analisis = await analizarUrgencia(
        formData.notas,
        formData.tipo,
        clienteNombre
      )

      setAnalisisIA(analisis)
      
      const urgenciaMap = {
        'CRÍTICA': 'critica',
        'CRITICA': 'critica',
        'MEDIA': 'media',
        'BAJA': 'baja'
      }
      
      const urgenciaCalculada = urgenciaMap[analisis.nivel?.toUpperCase()] || 'media'
      
      setFormData({
        ...formData,
        urgencia: urgenciaCalculada
      })

      toast.success(t('workOrders.messages.analysisSuccess'))
    } catch (error) {
      console.error('Error al analizar:', error)
      toast.error(t('workOrders.messages.analysisError'))
    } finally {
      setAnalizando(false)
    }
  }

  const handleCompletar = async (orden) => {
    if (orden.estado === 'completado') {
      toast.error(t('workOrders.messages.alreadyCompleted'))
      return
    }

    if (!window.confirm(t('workOrders.messages.completeConfirm', { id: orden.id }))) {
      return
    }

    try {
      await completarOrden(orden.id)
      toast.success(t('workOrders.messages.completeSuccess'))
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      toast.error(t('workOrders.messages.completeError'))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const dataToSend = {
        ...formData,
        equipoId: formData.equipoId || null,
        analisisIA: analisisIA
      }

      if (editingOrden) {
        await updateOrdenTrabajo(editingOrden.id, dataToSend)
        toast.success(t('workOrders.messages.updateSuccess'))
      } else {
        await createOrdenTrabajo(dataToSend)
        toast.success(t('workOrders.messages.createSuccess'))
      }
      
      fetchData()
      handleCloseModal()
    } catch (error) {
      console.error('Error:', error)
      toast.error(t('workOrders.messages.saveError'))
    }
  }

  const handleEdit = (orden) => {
    setEditingOrden(orden)
    setFormData({
      clienteId: orden.clienteId,
      equipoId: orden.equipoId || '',
      tipo: orden.tipo,
      fecha: new Date(orden.fecha).toISOString().split('T')[0],
      notas: orden.notas || '',
      tecnico: orden.tecnico,
      estado: orden.estado,
      urgencia: orden.urgencia || 'media'
    })
    
    if (orden.analisisIA) {
      try {
        const analisis = typeof orden.analisisIA === 'string' 
          ? JSON.parse(orden.analisisIA) 
          : orden.analisisIA
        setAnalisisIA(analisis)
      } catch (e) {
        setAnalisisIA(null)
      }
    }
    
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('workOrders.messages.deleteConfirm'))) {
      return
    }

    try {
      await deleteOrdenTrabajo(id)
      toast.success(t('workOrders.messages.deleteSuccess'))
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      toast.error(t('workOrders.messages.deleteError'))
    }
  }



  const handleCloseModal = () => {
    setShowModal(false)
    setEditingOrden(null)
    setAnalisisIA(null)
    setFormData({
      clienteId: '',
      equipoId: '',
      tipo: '',
      fecha: new Date().toISOString().split('T')[0],
      notas: '',
      tecnico: '',
      estado: 'pendiente',
      urgencia: 'media'
    })
  }

  const verAnalisisIA = (orden) => {
    if (!orden.analisisIA) {
      toast.error(t('workOrders.messages.noAnalysis'))
      return
    }
    
    try {
      const analisis = typeof orden.analisisIA === 'string' 
        ? JSON.parse(orden.analisisIA) 
        : orden.analisisIA
      setAnalisisSeleccionado(analisis)
      setShowAnalisisModal(true)
    } catch (e) {
      toast.error(t('common.error'))
    }
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      en_proceso: 'bg-blue-100 text-blue-800',
      completado: 'bg-green-100 text-green-800'
    }
    const labels = {
      pendiente: t('workOrders.statuses.pending'),
      en_proceso: t('workOrders.statuses.inProgress'),
      completado: t('workOrders.statuses.completed')
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[estado]}`}>
        {labels[estado]}
      </span>
    )
  }

  const getTipoBadge = (tipo) => {
    const badges = {
      instalacion: 'bg-blue-100 text-blue-800',
      mantencion: 'bg-purple-100 text-purple-800',
      mantenimiento: 'bg-purple-100 text-purple-800',
      reparacion: 'bg-orange-100 text-orange-800'
    }
    const labels = {
      instalacion: `${t('workOrders.types.installation')}`,
      mantencion: `⚙️ ${t('workOrders.types.maintenance')}`,
      mantenimiento: `⚙️ ${t('workOrders.types.maintenance')}`,
      reparacion: `🔨 ${t('workOrders.types.repair')}`
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[tipo]}`}>
        {labels[tipo] || tipo}
      </span>
    )
  }

  const getUrgenciaBadge = (urgencia) => {
    const badges = {
      baja: 'bg-green-100 text-green-800',
      media: 'bg-yellow-100 text-yellow-800',
      critica: 'bg-red-100 text-red-800'
    }
    const labels = {
      baja: `🟢 ${t('workOrders.urgencies.low')}`,
      media: `🟡 ${t('workOrders.urgencies.medium')}`,
      critica: `🔴 ${t('workOrders.urgencies.critical')}`
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[urgencia]}`}>
        {labels[urgencia]}
      </span>
    )
  }

  const filteredOrdenes = ordenes.filter(orden =>
    orden.cliente?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.tecnico.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('workOrders.title')}
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 btn-primary"
          >
            <Plus size={20} />
            {t('workOrders.add')}
          </button>
        </div>

        <div className="card mb-6">
          <div className="flex items-center gap-2">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder={t('workOrders.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border-0 focus:ring-0 outline-none"
            />
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('workOrders.table.date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('workOrders.table.client')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('workOrders.table.type')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('workOrders.table.urgency')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('workOrders.table.technician')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('workOrders.table.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('workOrders.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrdenes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      {t('workOrders.table.empty')}
                    </td>
                  </tr>
                ) : (
                  filteredOrdenes.map((orden) => (
                    <tr key={orden.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">
                          {new Date(orden.fecha).toLocaleDateString(t('common.dateFormat'))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{orden.cliente?.nombre}</div>
                        {orden.equipo && (
                          <div className="text-sm text-gray-500 mt-1">
                            <span className="font-medium">{orden.equipo.tipo}</span>
                            {' • '}
                            {orden.equipo.marca} {orden.equipo.modelo}
                            {orden.equipo.capacidad && (
                              <span className="text-blue-600 ml-1">
                                ({orden.equipo.capacidad})
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTipoBadge(orden.tipo)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getUrgenciaBadge(orden.urgencia)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {orden.tecnico || t('workOrders.unassigned')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(orden.estado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {/* ⭐ BOTÓN VER PDF */}
                        <button
                          onClick={() => handleVerPDF(orden.id)}
                          className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-2 rounded-full transition-colors"
                          title="Ver PDF"
                        >
                          <FileText size={18} />
                        </button>

                        {/* ⭐ BOTÓN SUBIR DOCUMENTO */}
                        <button
                          onClick={() => handleUploadDocument(orden.id)}
                          className="text-green-600 hover:text-green-900 hover:bg-green-50 p-2 rounded-full transition-colors"
                          title="Subir documento firmado"
                        >
                          <Upload size={18} />
                        </button>

                        {/* ⭐ INDICADOR DE DOCUMENTO FIRMADO */}
                        {orden.documentoFirmado && (
                          <button
                            onClick={() => handleDownloadDocument(orden.id)}
                            className="text-green-600 hover:text-green-900 hover:bg-green-50 p-2 rounded-full transition-colors"
                            title="Descargar documento firmado"
                          >
                            <Download size={18} />
                          </button>
                        )}

                        {/* BOTONES EXISTENTES - MANTENER */}
                        {orden.estado === 'pendiente' && (
                          <button
                            onClick={() => handleCompletar(orden.id)}
                            className="text-green-600 hover:text-green-900 hover:bg-green-50 p-2 rounded-full transition-colors"
                            title="Completar"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}

                        <button
                          onClick={() => handleEdit(orden)}
                          className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-2 rounded-full transition-colors"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>

                        <button
                          onClick={() => handleDelete(orden.id)}
                          className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded-full transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>

                        {orden.analisisIA && (
                          <button
                            onClick={() => {
                              setAnalisisSeleccionado(JSON.parse(orden.analisisIA))
                              setShowAnalisisModal(true)
                            }}
                            className="text-purple-600 hover:text-purple-900 hover:bg-purple-50 p-2 rounded-full transition-colors"
                            title="Ver análisis IA"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal de Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingOrden ? t('workOrders.edit') : t('workOrders.add')}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('workOrders.form.client')} *
                  </label>
                  <select
                    value={formData.clienteId}
                    onChange={(e) => setFormData({ ...formData, clienteId: e.target.value, equipoId: '' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">{t('common.select')}...</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('workOrders.form.equipmentOptional')}
                  </label>
                  <select
                    value={formData.equipoId}
                    onChange={(e) => setFormData({ ...formData, equipoId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!formData.clienteId}
                  >
                    <option value="">{t('common.select')}...</option>
                    {equiposFiltrados.map(equipo => (
                      <option key={equipo.id} value={equipo.id}>
                        {equipo.tipo} - {equipo.marca} {equipo.modelo} ({equipo.numeroSerie})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('workOrders.form.type')} *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">{t('common.select')}...</option>
                    <option value="instalacion">{t('workOrders.types.installation')}</option>
                    <option value="mantencion">⚙️ {t('workOrders.types.maintenance')}</option>
                    <option value="reparacion">🔨 {t('workOrders.types.repair')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('workOrders.form.status')} *
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="pendiente">{t('workOrders.statuses.pending')}</option>
                    <option value="en_proceso">{t('workOrders.statuses.inProgress')}</option>
                    <option value="completado">{t('workOrders.statuses.completed')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('workOrders.form.date')} *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('workOrders.form.technician')} *
                  </label>
                  <input
                    type="text"
                    value={formData.tecnico}
                    onChange={(e) => setFormData({ ...formData, tecnico: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('workOrders.form.technicianPlaceholder')}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('workOrders.form.notes')} *
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('workOrders.form.notesPlaceholder')}
                  required
                />
              </div>

              {/* Botón Analizar con IA */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAnalizarUrgencia}
                  disabled={analizando || !formData.notas || !formData.tipo}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Sparkles size={18} />
                  {analizando ? t('workOrders.form.analyzing') : `🤖 ${t('workOrders.form.analyzeAI')}`}
                </button>
              </div>

              {/* Mostrar Análisis de IA */}
              {analisisIA && (
                <div className={`p-4 rounded-lg border-2 ${
                  analisisIA.nivel === 'CRÍTICA' || analisisIA.nivel === 'CRITICA' 
                    ? 'bg-red-50 border-red-200' 
                    : analisisIA.nivel === 'MEDIA' 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">
                      {analisisIA.nivel === 'CRÍTICA' || analisisIA.nivel === 'CRITICA' ? '🔴' : analisisIA.nivel === 'MEDIA' ? '🟡' : '🟢'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">
                        {analisisIA.nivel === 'CRÍTICA' || analisisIA.nivel === 'CRITICA' 
                          ? `${t('workOrders.ai.critical')}` 
                          : analisisIA.nivel === 'MEDIA' 
                          ? `${t('workOrders.ai.medium')}` 
                          : `${t('workOrders.ai.low')}`}
                      </h3>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>{t('workOrders.ai.reasons')}:</strong>
                          <ul className="list-disc list-inside ml-2 mt-1">
                            {analisisIA.razones?.map((razon, idx) => (
                              <li key={idx}>{razon}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <strong>{t('workOrders.ai.recommendation')}:</strong>
                          <p className="ml-2 mt-1">{analisisIA.accionRecomendada}</p>
                        </div>
                        
                        <div>
                          <strong>⏱️ {t('workOrders.ai.responseTime')}:</strong>
                          <p className="ml-2 mt-1">{analisisIA.tiempoRespuesta}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  {editingOrden ? t('common.update') : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Ver Análisis */}
      {showAnalisisModal && analisisSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{t('workOrders.ai.title')}</h2>
              <button
                onClick={() => setShowAnalisisModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ✕
              </button>
            </div>
            
            <div className={`p-4 rounded-lg border-2 ${
              analisisSeleccionado.nivel === 'CRÍTICA' || analisisSeleccionado.nivel === 'CRITICA' 
                ? 'bg-red-50 border-red-200' 
                : analisisSeleccionado.nivel === 'MEDIA' 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className="text-4xl">
                  {analisisSeleccionado.nivel === 'CRÍTICA' || analisisSeleccionado.nivel === 'CRITICA' ? '🔴' : analisisSeleccionado.nivel === 'MEDIA' ? '🟡' : '🟢'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-3">
                    {analisisSeleccionado.nivel === 'CRÍTICA' || analisisSeleccionado.nivel === 'CRITICA' 
                      ? `${t('workOrders.ai.critical')}` 
                      : analisisSeleccionado.nivel === 'MEDIA' 
                      ? `${t('workOrders.ai.medium')}` 
                      : `${t('workOrders.ai.low')}`}
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <strong className="text-gray-700">{t('workOrders.ai.reasons')}:</strong>
                      <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
                        {analisisSeleccionado.razones?.map((razon, idx) => (
                          <li key={idx} className="text-gray-600">{razon}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <strong className="text-gray-700">{t('workOrders.ai.recommendation')}:</strong>
                      <p className="ml-2 mt-1 text-gray-600">{analisisSeleccionado.accionRecomendada}</p>
                    </div>
                    
                    <div>
                      <strong className="text-gray-700">⏱️ {t('workOrders.ai.responseTime')}:</strong>
                      <p className="ml-2 mt-1 text-gray-600">{analisisSeleccionado.tiempoRespuesta}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowAnalisisModal(false)}
                className="btn-primary"
              >
                {t('workOrders.ai.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdenesTrabajo