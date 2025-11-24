import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next' // 1. IMPORTAR
import { Plus, Edit, Trash2, Search, CheckCircle, XCircle, AlertCircle, Filter, X, FileText, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import VisorPDF from '../components/VisorPDF'
import { isAuthenticated } from '../services/authService'
import { 
  getCotizaciones, 
  createCotizacion, 
  updateCotizacion, 
  deleteCotizacion,
  aprobarCotizacion,
  rechazarCotizacion
} from '../services/cotizacionService'
import { getClientes, createCliente } from '../services/clienteService'
import { getInventario } from '../services/inventarioService'
import { getEquiposByCliente } from '../services/equipoService'
import '../styles/tablas-compactas.css'

function Cotizaciones() {
  const { t } = useTranslation() // 2. INICIALIZAR
  const navigate = useNavigate()
  const [cotizaciones, setCotizaciones] = useState([])
  const [clientes, setClientes] = useState([])
  const [inventario, setInventario] = useState([])
  const [inventarioDisponible, setInventarioDisponible] = useState([])
  const [equiposCliente, setEquiposCliente] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [pdfCotizacionId, setPdfCotizacionId] = useState(null)
  const [cotizacionToApprove, setCotizacionToApprove] = useState(null)
  const [approving, setApproving] = useState(false)
  // ⭐ NUEVO: Estado para modal de cliente rápido
  const [showClientModal, setShowClientModal] = useState(false)
  const [creatingClient, setCreatingClient] = useState(false)
  const [newClientData, setNewClientData] = useState({
    nombre: '',
    rut: '',
    email: '',
    telefono: '',
    direccion: ''
  })
  const [editingCotizacion, setEditingCotizacion] = useState(null)
  const [filters, setFilters] = useState({
    estado: '',
    tipo: ''
  })
  const [formData, setFormData] = useState({
    tipo: 'instalacion',
    clienteId: '',
    inventarioId: '',
    equipoId: '',
    precioOfertado: '',
    costoInstalacion: '50000',
    costoMaterial: '20000',
    descuento: 0,
    notas: '',
    agente: '',
    direccionInstalacion: '',
    estado: 'pendiente'
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/')
      return
    }
    fetchData()
  }, [navigate])

  useEffect(() => {
    if (formData.tipo === 'instalacion') {
      setFormData(prev => ({
        ...prev,
        costoInstalacion: prev.costoInstalacion || '50000',
        costoMaterial: prev.costoMaterial || '20000',
        equipoId: ''
      }))
    } else if (formData.tipo === 'mantencion') {
      setFormData(prev => ({
        ...prev,
        costoInstalacion: '0',
        costoMaterial: '10000',
        inventarioId: '',
        precioOfertado: '50000'
      }))
    } else if (formData.tipo === 'reparacion') {
      setFormData(prev => ({
        ...prev,
        costoInstalacion: '0',
        costoMaterial: prev.costoMaterial || '15000',
        inventarioId: '',
        precioOfertado: '60000'
      }))
    }
  }, [formData.tipo])

  useEffect(() => {
    if (formData.clienteId && (formData.tipo === 'mantencion' || formData.tipo === 'reparacion')) {
      fetchEquiposCliente(formData.clienteId)
    }
  }, [formData.clienteId, formData.tipo])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [cotizacionesData, clientesData, inventarioData] = await Promise.all([
        getCotizaciones(),
        getClientes(),
        getInventario()
      ])
      setCotizaciones(cotizacionesData)
      setClientes(clientesData)
      setInventario(inventarioData)
      
      const disponible = inventarioData.filter(item => 
        item.stock > 0 && item.estado === 'disponible'
      )
      setInventarioDisponible(disponible)
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error(t('quotes.messages.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const fetchEquiposCliente = async (clienteId) => {
    try {
      const equipos = await getEquiposByCliente(clienteId)
      setEquiposCliente(equipos)
      
      if (equipos.length === 0) {
        toast.info(t('quotes.messages.noEquipment'))
      }
    } catch (error) {
      console.error('Error al cargar equipos del cliente:', error)
      setEquiposCliente([])
    }
  }

  const calcularTotal = () => {
    const precio = parseFloat(formData.precioOfertado) || 0
    const instalacion = parseFloat(formData.costoInstalacion) || 0
    const material = parseFloat(formData.costoMaterial) || 0
    const descuento = parseFloat(formData.descuento) || 0
    
    const subtotal = precio + instalacion + material
    const montoDescuento = subtotal * (descuento / 100)
    return subtotal - montoDescuento
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const dataToSend = {
        tipo: formData.tipo,
        clienteId: parseInt(formData.clienteId),
        precioOfertado: parseFloat(formData.precioOfertado),
        costoInstalacion: parseFloat(formData.costoInstalacion) || 0,
        costoMaterial: parseFloat(formData.costoMaterial) || 0,
        descuento: parseFloat(formData.descuento) || 0,
        notas: formData.notas,
        agente: formData.agente || JSON.parse(localStorage.getItem('user'))?.name || 'Administrador',
        direccionInstalacion: formData.direccionInstalacion
      }

      if (formData.tipo === 'instalacion') {
        dataToSend.inventarioId = parseInt(formData.inventarioId)
      } else {
        dataToSend.equipoId = parseInt(formData.equipoId)
      }

      if (editingCotizacion) {
        await updateCotizacion(editingCotizacion.id, {
          ...dataToSend,
          estado: formData.estado
        })
        toast.success(t('quotes.messages.updateSuccess'))
      } else {
        await createCotizacion(dataToSend)
        toast.success(t('quotes.messages.createSuccess'))
      }
      
      fetchData()
      handleCloseModal()
    } catch (error) {
      console.error('Error completo:', error)
      const errorMessage = error.response?.data?.error || error.response?.data?.details || t('quotes.messages.saveError')
      toast.error(errorMessage)
    }
  }

  const handleEdit = (cotizacion) => {
    setEditingCotizacion(cotizacion)
    setFormData({
      tipo: cotizacion.tipo || 'instalacion',
      clienteId: cotizacion.clienteId,
      inventarioId: cotizacion.inventarioId || '',
      equipoId: cotizacion.equipoId || '', 
      precioOfertado: cotizacion.precioOfertado,
      costoInstalacion: cotizacion.costoInstalacion || 0,
      costoMaterial: cotizacion.costoMaterial || 0,
      descuento: cotizacion.descuento,
      notas: cotizacion.notas || '',
      agente: cotizacion.agente || '',
      direccionInstalacion: cotizacion.direccionInstalacion || '',
      estado: cotizacion.estado
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('quotes.messages.deleteConfirm'))) {
      return
    }

    try {
      await deleteCotizacion(id)
      toast.success(t('quotes.messages.deleteSuccess'))
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error.response?.data?.error || t('quotes.messages.deleteError')
      toast.error(errorMessage)
    }
  }

  const handleAprobar = (cotizacion) => {
    setCotizacionToApprove(cotizacion)
    setShowApproveModal(true)
  }

  const confirmarAprobacion = async () => {
    if (!cotizacionToApprove) return

    try {
      setApproving(true)
      
      const loadingToast = toast.loading(t('quotes.messages.approving'))
      
      const resultado = await aprobarCotizacion(cotizacionToApprove.id)
      
      toast.dismiss(loadingToast)
      
      const mensajesTipo = {
        instalacion: t('quotes.messages.approvalSuccess.installation'),
        mantencion: t('quotes.messages.approvalSuccess.maintenance'),
        reparacion: t('quotes.messages.approvalSuccess.repair')
      }
      
      toast.success(
        <div>
          <p className="font-bold">{t('quotes.messages.approvalSuccess.title')}</p>
          <p className="text-sm mt-1">{mensajesTipo[cotizacionToApprove.tipo]}: #{resultado.equipo?.id}</p>
          <p className="text-sm">✅ {t('nav.workOrders')}: #{resultado.ordenTrabajo?.id}</p>
        </div>,
        { duration: 5000 }
      )
      
      setShowApproveModal(false)
      setCotizacionToApprove(null)
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error.response?.data?.detalle || error.response?.data?.error || t('quotes.messages.approvalError')
      toast.error(errorMessage)
    } finally {
      setApproving(false)
    }
  }

  const handleRechazar = async (cotizacion) => {
    const motivo = window.prompt(t('quotes.messages.rejectReason'))
    if (motivo === null) return

    try {
      await rechazarCotizacion(cotizacion.id, motivo)
      toast.success(t('quotes.messages.rejectSuccess'))
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      toast.error(t('quotes.messages.rejectError'))
    }
  }

  const handleVerPDF = (cotizacionId) => {
    setPdfCotizacionId(cotizacionId)
    setShowPDFModal(true)
  }

  // ⭐ NUEVO: Crear cliente rápido desde cotización
  const handleCreateQuickClient = async () => {
    if (!newClientData.nombre.trim()) {
      toast.error('El nombre del cliente es requerido')
      return
    }

    setCreatingClient(true)
    try {
      const nuevoCliente = await createCliente(newClientData)
      
      // Agregar el nuevo cliente a la lista
      setClientes(prev => [...prev, nuevoCliente])
      
      // Seleccionar automáticamente el nuevo cliente
      setFormData(prev => ({ ...prev, clienteId: nuevoCliente.id.toString() }))
      
      // Cerrar modal y limpiar
      setShowClientModal(false)
      setNewClientData({
        nombre: '',
        rut: '',
        email: '',
        telefono: '',
        direccion: ''
      })
      
      toast.success(`Cliente "${nuevoCliente.nombre}" creado exitosamente`)
    } catch (error) {
      console.error('Error al crear cliente:', error)
      toast.error(error.response?.data?.error || 'Error al crear cliente')
    } finally {
      setCreatingClient(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCotizacion(null)
    setEquiposCliente([])
    setFormData({
      tipo: 'instalacion',
      clienteId: '',
      inventarioId: '',
      equipoId: '',
      precioOfertado: '',
      costoInstalacion: '50000',
      costoMaterial: '20000',
      descuento: 0,
      notas: '',
      agente: '',
      direccionInstalacion: '',
      estado: 'pendiente'
    })
  }

  const handleInventarioChange = (inventarioId) => {
    const item = inventario.find(i => i.id === parseInt(inventarioId))
    if (item) {
      setFormData({
        ...formData,
        inventarioId,
        precioOfertado: item.precioCliente.toString()
      })
    } else {
      setFormData({
        ...formData,
        inventarioId,
        precioOfertado: ''
      })
    }
  }

  const handleEquipoChange = (equipoId) => {
    setFormData({
      ...formData,
      equipoId
    })
  }

  const clearFilters = () => {
    setFilters({ estado: '', tipo: '' })
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      aprobada: 'bg-green-100 text-green-800',
      rechazada: 'bg-red-100 text-red-800'
    }
    const labels = {
      pendiente: t('workOrders.statuses.pending'),
      aprobada: t('dashboard.approved'),
      rechazada: t('dashboard.rejected')
    }
    return (
      <span className={`badge-compacto ${badges[estado]}`}>
        {labels[estado]}
      </span>
    )
  }

  const getTipoBadge = (tipo) => {
    const badges = {
      instalacion: 'bg-blue-100 text-blue-800',
      mantencion: 'bg-purple-100 text-purple-800',
      reparacion: 'bg-orange-100 text-orange-800'
    }
    const labels = {
      instalacion: `🔧 ${t('workOrders.types.installation')}`,
      mantencion: `⚙️ ${t('workOrders.types.maintenance')}`,
      reparacion: `🔨 ${t('workOrders.types.repair')}`
    }
    return (
      <span className={`badge-compacto ${badges[tipo]}`}>
        {labels[tipo]}
      </span>
    )
  }

  const filteredCotizaciones = cotizaciones.filter(cot => {
    const matchesSearch = 
      cot.cliente?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cot.inventario?.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cot.inventario?.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cot.equipo?.marca.toLowerCase().includes(searchTerm.toLowerCase()) || 
      cot.equipo?.modelo.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesEstado = !filters.estado || cot.estado === filters.estado
    const matchesTipo = !filters.tipo || cot.tipo === filters.tipo

    return matchesSearch && matchesEstado && matchesTipo
  })

  const stats = {
    total: cotizaciones.length,
    pendientes: cotizaciones.filter(c => c.estado === 'pendiente').length,
    aprobadas: cotizaciones.filter(c => c.estado === 'aprobada').length,
    rechazadas: cotizaciones.filter(c => c.estado === 'rechazada').length
  }

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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('quotes.title')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('quotes.subtitle')}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 btn-primary"
          >
            <Plus size={20} />
            {t('quotes.add')}
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-600">{t('inventory.stats.total')}</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">{t('workOrders.statuses.pending')}</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">{t('dashboard.approved')}</p>
            <p className="text-2xl font-bold text-green-600">{stats.aprobadas}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">{t('dashboard.rejected')}</p>
            <p className="text-2xl font-bold text-red-600">{stats.rechazadas}</p>
          </div>
        </div>

        {/* Búsqueda y Filtros */}
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder={t('quotes.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border-0 focus:ring-0 outline-none"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter size={18} />
              {t('common.filter')}
            </button>
          </div>

          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('workOrders.form.status')}
                  </label>
                  <select
                    value={filters.estado}
                    onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">{t('quotes.filters.all')}</option>
                    <option value="pendiente">{t('workOrders.statuses.pending')}</option>
                    <option value="aprobada">{t('dashboard.approved')}</option>
                    <option value="rechazada">{t('dashboard.rejected')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('workOrders.form.type')}
                  </label>
                  <select
                    value={filters.tipo}
                    onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">{t('quotes.filters.all')}</option>
                    <option value="instalacion">{t('workOrders.types.installation')}</option>
                    <option value="mantencion">{t('workOrders.types.maintenance')}</option>
                    <option value="reparacion">{t('workOrders.types.repair')}</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-2"
                  >
                    <X size={16} />
                    {t('quotes.filters.clear')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabla Optimizada */}
        <div className="card">
          <div className="tabla-compacta">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase col-tipo-cot">
                    {t('workOrders.table.type')}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('quotes.form.client')}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase col-equipo-info">
                    {t('quotes.table.equipment')}
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase col-precio">
                    {t('quotes.table.price')}
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase col-descuento">
                    {t('quotes.table.discount')}
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase col-total">
                    {t('inventory.stats.total')}
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase col-estado">
                    {t('workOrders.table.status')}
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase col-acciones-cot">
                    {t('workOrders.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCotizaciones.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      {searchTerm || Object.values(filters).some(v => v) ? (
                        t('quotes.table.noResults')
                      ) : (
                        t('quotes.table.empty')
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredCotizaciones.map((cotizacion) => {
                    let marca = 'N/A'
                    let modelo = 'N/A'
                    let capacidad = 'N/A'
                    
                    if (cotizacion.tipo === 'instalacion' && cotizacion.inventario) {
                      marca = cotizacion.inventario.marca
                      modelo = cotizacion.inventario.modelo
                      capacidad = cotizacion.inventario.capacidadBTU
                    } else if ((cotizacion.tipo === 'mantencion' || cotizacion.tipo === 'reparacion') && cotizacion.equipo) {
                      marca = cotizacion.equipo.marca
                      modelo = cotizacion.equipo.modelo
                      capacidad = cotizacion.equipo.capacidad
                    }
                    
                    return (
                      <tr key={cotizacion.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 col-tipo-cot">
                          {getTipoBadge(cotizacion.tipo)}
                        </td>
                        
                        {/* ⭐ NUEVO: Columna Cliente */}
                        <td className="px-3 py-3">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]" title={cotizacion.cliente?.nombre}>
                            {cotizacion.cliente?.nombre || 'Sin cliente'}
                          </div>
                        </td>
                        
                        <td className="px-3 py-3 col-equipo-info">
                          <div className="info-2-lineas">
                            <div className="info-principal truncate-text" title={`${marca} ${modelo}`}>
                              {marca} {modelo}
                            </div>
                            <div className="info-secundaria">
                              {typeof capacidad === 'number' 
                                ? `${capacidad.toLocaleString(t('common.dateFormat'))} BTU`
                                : capacidad}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-3 py-3 col-precio text-right">
                          <span className="text-sm text-gray-900">
                            ${cotizacion.precioOfertado?.toLocaleString(t('common.dateFormat'))}
                          </span>
                        </td>
                        
                        <td className="px-3 py-3 col-descuento text-center">
                          <span className="text-sm text-gray-600">
                            {cotizacion.descuento}%
                          </span>
                        </td>
                        
                        <td className="px-3 py-3 col-total text-right">
                          <span className="text-sm font-bold text-green-600">
                            ${cotizacion.precioFinal?.toLocaleString(t('common.dateFormat'))}
                          </span>
                        </td>
                        
                        <td className="px-3 py-3 col-estado">
                          {getEstadoBadge(cotizacion.estado)}
                        </td>
                        
                        <td className="px-3 py-3 col-acciones-cot">
                          <div className="flex gap-1 justify-center flex-wrap">
                            {/* ⭐ MODIFICADO: PDF visible SIEMPRE (no solo aprobadas) */}
                            <button
                              onClick={() => handleVerPDF(cotizacion.id)}
                              className="btn-accion-compacto text-purple-600 hover:bg-purple-50"
                              title={t('quotes.actions.viewPdf')}
                            >
                              <FileText size={16} />
                            </button>
                            
                            {cotizacion.estado === 'pendiente' && (
                              <>
                                <button
                                  onClick={() => handleAprobar(cotizacion)}
                                  className="btn-accion-compacto text-green-600 hover:bg-green-50"
                                  title={t('quotes.actions.approve')}
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() => handleRechazar(cotizacion)}
                                  className="btn-accion-compacto text-red-600 hover:bg-red-50"
                                  title={t('quotes.actions.reject')}
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleEdit(cotizacion)}
                              className="btn-accion-compacto text-blue-600 hover:bg-blue-50"
                              title={t('common.edit')}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(cotizacion.id)}
                              className="btn-accion-compacto text-red-600 hover:bg-red-50"
                              title={t('common.delete')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600 text-center">
          {t('inventory.showing', { count: filteredCotizaciones.length, total: cotizaciones.length })}
        </div>
      </main>

      {/* Modal de Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold mb-4">
              {editingCotizacion ? t('quotes.edit') : t('quotes.add')}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo de Servicio */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-3">{t('quotes.form.serviceType')}</h3>
                <div className="grid grid-cols-3 gap-3">
                  {['instalacion', 'mantencion', 'reparacion'].map((tipo) => (
                    <label
                      key={tipo}
                      className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.tipo === tipo
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipo"
                        value={tipo}
                        checked={formData.tipo === tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        className="sr-only"
                      />
                      <span className="font-medium">
                        {tipo === 'instalacion' && `🔧 ${t('workOrders.types.installation')}`}
                        {tipo === 'mantencion' && `⚙️ ${t('workOrders.types.maintenance')}`}
                        {tipo === 'reparacion' && `🔨 ${t('workOrders.types.repair')}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Cliente y Producto/Equipo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('quotes.form.client')} *
                  </label>
                  {/* ⭐ MODIFICADO: Flex container con botón + */}
                  <div className="flex gap-2">
                    <select
                      value={formData.clienteId}
                      onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={editingCotizacion}
                    >
                      <option value="">{t('common.select')}...</option>
                      {clientes.map(cliente => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nombre}
                        </option>
                      ))}
                    </select>
                    
                    {/* ⭐ NUEVO: Botón crear cliente rápido */}
                    {!editingCotizacion && (
                      <button
                        type="button"
                        onClick={() => setShowClientModal(true)}
                        className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                        title={t('clients.add')}
                      >
                        <UserPlus size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {/* INSTALACIÓN: Mostrar inventario */}
                {formData.tipo === 'instalacion' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('quotes.form.product')} *
                    </label>
                    <select
                      value={formData.inventarioId}
                      onChange={(e) => handleInventarioChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={editingCotizacion}
                    >
                      <option value="">{t('common.select')}...</option>
                      {inventarioDisponible.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.marca} {item.modelo} ({item.capacidadBTU} BTU) - Stock: {item.stock}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* MANTENCIÓN/REPARACIÓN: Mostrar equipos del cliente */}
                {(formData.tipo === 'mantencion' || formData.tipo === 'reparacion') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('quotes.form.equipment')} *
                    </label>
                    <select
                      value={formData.equipoId}
                      onChange={(e) => handleEquipoChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={editingCotizacion || !formData.clienteId}
                    >
                      <option value="">
                        {!formData.clienteId 
                          ? t('quotes.form.selectClientFirst')
                          : equiposCliente.length === 0
                          ? t('quotes.form.noClientEquipment')
                          : t('common.select')}
                      </option>
                      {equiposCliente.map(equipo => (
                        <option key={equipo.id} value={equipo.id}>
                          {equipo.marca} {equipo.modelo} - {equipo.capacidad}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Precios */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.tipo === 'instalacion' && `${t('quotes.form.priceEquipment')} *`}
                    {formData.tipo === 'mantencion' && `${t('quotes.form.priceMaintenance')} *`}
                    {formData.tipo === 'reparacion' && `${t('quotes.form.priceRepair')} *`}
                  </label>
                  <input
                    type="number"
                    value={formData.precioOfertado}
                    onChange={(e) => setFormData({ ...formData, precioOfertado: e.target.value })}
                    step="1"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                {formData.tipo === 'instalacion' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('quotes.form.priceInstallation')} *
                    </label>
                    <input
                      type="number"
                      value={formData.costoInstalacion}
                      onChange={(e) => setFormData({ ...formData, costoInstalacion: e.target.value })}
                      step="1"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('quotes.form.priceMaterial')} *
                  </label>
                  <input
                    type="number"
                    value={formData.costoMaterial}
                    onChange={(e) => setFormData({ ...formData, costoMaterial: e.target.value })}
                    step="1"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('quotes.form.discount')} (%)
                  </label>
                  <input
                    type="number"
                    value={formData.descuento}
                    onChange={(e) => setFormData({ ...formData, descuento: e.target.value })}
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Vista Previa del Total */}
              {formData.precioOfertado && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>
                        {formData.tipo === 'instalacion' && t('quotes.form.priceEquipment') + ':'}
                        {formData.tipo === 'mantencion' && t('quotes.form.priceMaintenance') + ':'}
                        {formData.tipo === 'reparacion' && t('quotes.form.priceRepair') + ':'}
                      </span>
                      <span>${parseFloat(formData.precioOfertado || 0).toLocaleString(t('common.dateFormat'))}</span>
                    </div>
                    {formData.tipo === 'instalacion' && (
                      <div className="flex justify-between">
                        <span>{t('quotes.form.priceInstallation')}:</span>
                        <span>${parseFloat(formData.costoInstalacion || 0).toLocaleString(t('common.dateFormat'))}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>{t('quotes.form.priceMaterial')}:</span>
                      <span>${parseFloat(formData.costoMaterial || 0).toLocaleString(t('common.dateFormat'))}</span>
                    </div>
                    {formData.descuento > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>{t('quotes.form.discount')} ({formData.descuento}%):</span>
                        <span>-${((calcularTotal() / (1 - formData.descuento / 100)) - calcularTotal()).toLocaleString(t('common.dateFormat'))}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-green-600 pt-2 border-t">
                      <span>TOTAL:</span>
                      <span>${calcularTotal().toLocaleString(t('common.dateFormat'))}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Información Adicional */}
              {formData.tipo === 'instalacion' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('quotes.form.address')}
                  </label>
                  <input
                    type="text"
                    value={formData.direccionInstalacion}
                    onChange={(e) => setFormData({ ...formData, direccionInstalacion: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder={t('quotes.form.addressPlaceholder')}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('quotes.form.notes')}
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder={t('quotes.form.notesPlaceholder')}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingCotizacion ? t('common.save') : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Aprobación */}
      {showApproveModal && cotizacionToApprove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {t('quotes.approval.title')}
              </h2>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-gray-700">
                {t('quotes.approval.confirm')}
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <p className="font-medium text-gray-900">
                  {cotizacionToApprove.cliente?.nombre}
                </p>
                <p className="text-sm text-gray-600">
                  {cotizacionToApprove.inventario?.marca || cotizacionToApprove.equipo?.marca}{' '}
                  {cotizacionToApprove.inventario?.modelo || cotizacionToApprove.equipo?.modelo}
                </p>
                <div className="pt-2">
                  {getTipoBadge(cotizacionToApprove.tipo)}
                </div>
                <p className="text-lg font-bold text-green-600 pt-2">
                  ${cotizacionToApprove.precioFinal.toLocaleString(t('common.dateFormat'))}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">{t('quotes.approval.systemActions')}:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      {cotizacionToApprove.tipo === 'instalacion' ? (
                        <>
                          <li>{t('quotes.approval.actionCreateEquipment')}</li>
                          <li>{t('quotes.approval.actionReduceStock')}</li>
                        </>
                      ) : (
                        <li>{t('quotes.approval.actionUseEquipment')}</li>
                      )}
                      <li>{t('quotes.approval.actionCreateOrder')}</li>
                      <li>{t('quotes.approval.actionMarkApproved')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowApproveModal(false)
                  setCotizacionToApprove(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={approving}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmarAprobacion}
                disabled={approving}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {approving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    {t('quotes.actions.approve')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de PDF */}
      {showPDFModal && pdfCotizacionId && (
        <VisorPDF
          cotizacionId={pdfCotizacionId}
          onClose={() => {
            setShowPDFModal(false)
            setPdfCotizacionId(null)
          }}
        />
      )}

      {/* ⭐ NUEVO: MODAL CREAR CLIENTE RÁPIDO */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <UserPlus className="text-green-500" size={24} />
                <h2 className="text-xl font-bold text-gray-800">
                  {t('clients.add')}
                </h2>
              </div>
              <button
                onClick={() => setShowClientModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clients.form.name')} *
                </label>
                <input
                  type="text"
                  value={newClientData.nombre}
                  onChange={(e) => setNewClientData({ ...newClientData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Nombre del cliente"
                  autoFocus
                />
              </div>

              {/* RUT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clients.form.rut')}
                </label>
                <input
                  type="text"
                  value={newClientData.rut}
                  onChange={(e) => setNewClientData({ ...newClientData, rut: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="12.345.678-9"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clients.form.email')}
                </label>
                <input
                  type="email"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="cliente@email.com"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clients.form.phone')}
                </label>
                <input
                  type="text"
                  value={newClientData.telefono}
                  onChange={(e) => setNewClientData({ ...newClientData, telefono: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="+56 9 1234 5678"
                />
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clients.form.address')}
                </label>
                <input
                  type="text"
                  value={newClientData.direccion}
                  onChange={(e) => setNewClientData({ ...newClientData, direccion: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Calle, número, comuna"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setShowClientModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={creatingClient}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleCreateQuickClient}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={creatingClient || !newClientData.nombre.trim()}
              >
                {creatingClient ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    {t('common.create')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cotizaciones