import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, Search, Eye, CheckCircle, FileText, Upload, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { isAuthenticated } from '../services/authService'
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
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [pdfType, setPdfType] = useState(null) // 'orden' o 'documento'
  const [currentOrden, setCurrentOrden] = useState(null)
  const [formData, setFormData] = useState({
    clienteId: '',
    equipoId: '',
    tipo: '',
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
    tecnico: '',
    estado: 'pendiente',
    
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
    
    // Abrir en modal
    setPdfUrl(url)
    setPdfType('orden')
    setCurrentOrden(ordenes.find(o => o.id === ordenId))
    setShowPDFModal(true)
    
  } catch (error) {
    console.error('Error al generar PDF:', error)
    toast.error('Error al generar el PDF')
  }
}


// ⭐ DESCARGAR PDF DE ORDEN
const handleDescargarPDF = async (ordenId) => {
  try {
    const loadingToast = toast.loading('Descargando PDF...')
    
    const blob = await generarPDFOrden(ordenId)
    const url = window.URL.createObjectURL(blob)
    
    const orden = ordenes.find(o => o.id === ordenId)
    const clienteNombre = orden?.cliente?.nombre.replace(/\s+/g, '-') || 'Cliente'
    const fecha = new Date().toISOString().split('T')[0]
    const nombreArchivo = `OT-${ordenId.toString().padStart(6, '0')}-${clienteNombre}-${fecha}.pdf`
    
    const a = document.createElement('a')
    a.href = url
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    window.URL.revokeObjectURL(url)
    
    toast.dismiss(loadingToast)
    toast.success(`PDF descargado: ${nombreArchivo}`)
    
  } catch (error) {
    console.error('Error al descargar PDF:', error)
    toast.error('Error al descargar el PDF')
  }
}

// ⭐ CERRAR MODAL PDF
const handleClosePDFModal = () => {
  if (pdfUrl) {
    window.URL.revokeObjectURL(pdfUrl)
  }
  setPdfUrl(null)
  setPdfType(null)
  setCurrentOrden(null)
  setShowPDFModal(false)
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
// ⭐ VER DOCUMENTO FIRMADO EN MODAL
const handleVerDocumentoFirmado = async (ordenId) => {
  try {
    const loadingToast = toast.loading('Cargando documento...')
    
    const blob = await descargarDocumentoFirmado(ordenId)
    const url = window.URL.createObjectURL(blob)
    
    toast.dismiss(loadingToast)
    
    // Abrir en modal
    setPdfUrl(url)
    setPdfType('documento')
    setCurrentOrden(ordenes.find(o => o.id === ordenId))
    setShowPDFModal(true)
    
  } catch (error) {
    console.error('Error al cargar documento:', error)
    toast.error('Error al cargar el documento')
  }
}

// ⭐ DESCARGAR DOCUMENTO FIRMADO
const handleDescargarDocumentoFirmado = async (ordenId) => {
  try {
    const loadingToast = toast.loading('Descargando documento...')
    
    const blob = await descargarDocumentoFirmado(ordenId)
    const url = window.URL.createObjectURL(blob)
    
    const orden = ordenes.find(o => o.id === ordenId)
    const clienteNombre = orden?.cliente?.nombre.replace(/\s+/g, '-') || 'Cliente'
    const nombreArchivo = `OT-${ordenId.toString().padStart(6, '0')}-${clienteNombre}-Firmada.pdf`
    
    const a = document.createElement('a')
    a.href = url
    a.download = nombreArchivo
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

  // Reemplazar desde línea 229
const handleCompletar = async (ordenId) => {  // ⭐ Recibe ID directamente
  console.log('🔍 Completando orden ID:', ordenId)
  
  if (!ordenId) {
    toast.error('Error: ID de orden inválido')
    return
  }

  // Buscar la orden para verificar estado
  const orden = ordenes.find(o => o.id === ordenId)
  
  if (!orden) {
    toast.error('Orden no encontrada')
    return
  }

  if (orden.estado === 'completado') {
    toast.error(t('workOrders.messages.alreadyCompleted'))
    return
  }

  if (!window.confirm(t('workOrders.messages.completeConfirm', { id: ordenId }))) {
    return
  }

  try {
    await completarOrden(ordenId)
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
      
    })
    
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
    setFormData({
      clienteId: '',
      equipoId: '',
      tipo: '',
      fecha: new Date().toISOString().split('T')[0],
      notas: '',
      tecnico: '',
      estado: 'pendiente',
      
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
  
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {orden.tecnico || t('workOrders.unassigned')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(orden.estado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {/* VER PDF DE ORDEN */}
                        <button
                          onClick={() => handleVerPDF(orden.id)}
                          className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-2 rounded-full transition-colors"
                          title="Ver orden de trabajo"
                        >
                          <Eye size={18} />
                        </button>

                        {/* DOCUMENTO FIRMADO O SUBIR */}
                        {orden.documentoFirmado ? (
                          <div className="relative group">
                            <button
                              className="relative text-green-600 hover:text-green-900 hover:bg-green-50 p-2 rounded-full transition-colors"
                              title="Documento firmado disponible"
                            >
                              <FileText size={18} />
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                              </span>
                            </button>
                            
                            <div className="hidden group-hover:block absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <div className="px-4 py-2 bg-green-50 border-b">
                                <p className="text-xs font-semibold text-green-800">Documento Firmado</p>
                              </div>
                              <button
                                onClick={() => handleVerDocumentoFirmado(orden.id)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700"
                              >
                                <Eye size={16} />
                                Ver documento
                              </button>
                              <button
                                onClick={() => handleDescargarDocumentoFirmado(orden.id)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 rounded-b-lg"
                              >
                                <Download size={16} />
                                Descargar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleUploadDocument(orden.id)}
                            className="text-purple-600 hover:text-purple-900 hover:bg-purple-50 p-2 rounded-full transition-colors"
                            title="Subir documento firmado"
                          >
                            <Upload size={18} />
                          </button>
                        )}

                        {/* ⭐ VER/DESCARGAR DOCUMENTO FIRMADO */}
                        {orden.documentoFirmado && (
                          <>
                            <button
                              onClick={() => handleVerDocumentoFirmado(orden.id)}
                              className="text-green-600 hover:text-green-900 hover:bg-green-50 p-2 rounded-full transition-colors"
                              title="Ver documento firmado"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleDescargarDocumentoFirmado(orden.id)}
                              className="text-green-600 hover:text-green-900 hover:bg-green-50 p-2 rounded-full transition-colors"
                              title="Descargar documento firmado"
                            >
                              <Download size={18} />
                            </button>
                          </>
                        )}

                        {/* COMPLETAR */}
                        {orden.estado === 'pendiente' && (
                          <button
                            onClick={() => handleCompletar(orden)}
                            className="text-green-600 hover:text-green-900 hover:bg-green-50 p-2 rounded-full transition-colors"
                            title="Completar"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}

                        {/* EDITAR */}
                        <button
                          onClick={() => handleEdit(orden)}
                          className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-2 rounded-full transition-colors"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>

                        {/* ELIMINAR */}
                        <button
                          onClick={() => handleDelete(orden.id)}
                          className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded-full transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
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

      {/* ⭐ MODAL DE VISUALIZACIÓN DE PDF */}
      {showPDFModal && pdfUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <FileText className="text-blue-600" size={24} />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {pdfType === 'orden' 
                      ? `Orden de Trabajo #${currentOrden?.id.toString().padStart(6, '0')}` 
                      : `Documento Firmado - OT #${currentOrden?.id.toString().padStart(6, '0')}`
                    }
                  </h2>
                  {currentOrden && (
                    <p className="text-sm text-gray-600">
                      Cliente: {currentOrden.cliente?.nombre}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* ⭐ BOTÓN DESCARGAR */}
                <button
                  onClick={() => pdfType === 'orden' 
                    ? handleDescargarPDF(currentOrden?.id) 
                    : handleDescargarDocumentoFirmado(currentOrden?.id)
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download size={18} />
                  Descargar
                </button>

                {/* ⭐ BOTÓN NUEVA PESTAÑA */}
                <button
                  onClick={() => window.open(pdfUrl, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye size={18} />
                  Nueva Pestaña
                </button>

                {/* ⭐ BOTÓN CERRAR */}
                <button
                  onClick={handleClosePDFModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none p-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* ⭐ IFRAME DEL PDF */}
            <div className="flex-1 p-4 overflow-hidden">
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0 rounded-lg shadow-inner"
                title={pdfType === 'orden' ? 'Vista previa PDF Orden' : 'Vista previa Documento Firmado'}
              />
            </div>

            {/* ⭐ TIP EN EL FOOTER */}
            <div className="p-3 bg-yellow-50 border-t border-yellow-200 text-center">
              <p className="text-sm text-yellow-800 flex items-center justify-center gap-2">
                <span>💡</span>
                <span>
                  <strong>Tip:</strong> Usa el botón "Descargar" para guardar el PDF con el nombre correcto
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdenesTrabajo
