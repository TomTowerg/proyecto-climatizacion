import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Search, CheckCircle, XCircle, AlertCircle, Filter, X, FileText } from 'lucide-react'
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
import { getClientes } from '../services/clienteService'
import { getInventario } from '../services/inventarioService'
import '../styles/tablas-compactas.css'

function Cotizaciones() {
  const navigate = useNavigate()
  const [cotizaciones, setCotizaciones] = useState([])
  const [clientes, setClientes] = useState([])
  const [inventario, setInventario] = useState([])
  const [inventarioDisponible, setInventarioDisponible] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [pdfCotizacionId, setPdfCotizacionId] = useState(null)
  const [cotizacionToApprove, setCotizacionToApprove] = useState(null)
  const [approving, setApproving] = useState(false)
  const [editingCotizacion, setEditingCotizacion] = useState(null)
  const [filters, setFilters] = useState({
    estado: '',
    tipo: ''
  })
  const [formData, setFormData] = useState({
    tipo: 'instalacion',
    clienteId: '',
    inventarioId: '',
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
        costoMaterial: prev.costoMaterial || '20000'
      }))
    } else if (formData.tipo === 'mantencion') {
      setFormData(prev => ({
        ...prev,
        costoInstalacion: '0',
        costoMaterial: '10000'
      }))
    } else if (formData.tipo === 'reparacion') {
      setFormData(prev => ({
        ...prev,
        costoInstalacion: '0',
        costoMaterial: prev.costoMaterial || '15000'
      }))
    }
  }, [formData.tipo])

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
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
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
        inventarioId: parseInt(formData.inventarioId),
        precioOfertado: parseFloat(formData.precioOfertado),
        costoInstalacion: parseFloat(formData.costoInstalacion) || 0,
        costoMaterial: parseFloat(formData.costoMaterial) || 0,
        descuento: parseFloat(formData.descuento) || 0,
        notas: formData.notas,
        agente: formData.agente || JSON.parse(localStorage.getItem('user'))?.name || 'Administrador',
        direccionInstalacion: formData.direccionInstalacion
      }

      if (editingCotizacion) {
        await updateCotizacion(editingCotizacion.id, {
          ...dataToSend,
          estado: formData.estado
        })
        toast.success('Cotización actualizada exitosamente')
      } else {
        await createCotizacion(dataToSend)
        toast.success('Cotización creada exitosamente')
      }
      
      fetchData()
      handleCloseModal()
    } catch (error) {
      console.error('Error completo:', error)
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Error al guardar cotización'
      toast.error(errorMessage)
    }
  }

  const handleEdit = (cotizacion) => {
    setEditingCotizacion(cotizacion)
    setFormData({
      tipo: cotizacion.tipo || 'instalacion',
      clienteId: cotizacion.clienteId,
      inventarioId: cotizacion.inventarioId,
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
    if (!window.confirm('¿Estás seguro de eliminar esta cotización?')) {
      return
    }

    try {
      await deleteCotizacion(id)
      toast.success('Cotización eliminada exitosamente')
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error.response?.data?.error || 'Error al eliminar cotización'
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
      
      const loadingToast = toast.loading('Aprobando cotización...')
      
      const resultado = await aprobarCotizacion(cotizacionToApprove.id)
      
      toast.dismiss(loadingToast)
      
      toast.success(
        <div>
          <p className="font-bold">¡Cotización aprobada exitosamente!</p>
          <p className="text-sm mt-1">✅ Equipo creado: #{resultado.equipo?.id}</p>
          <p className="text-sm">✅ Orden de trabajo: #{resultado.ordenTrabajo?.id}</p>
        </div>,
        { duration: 5000 }
      )
      
      setShowApproveModal(false)
      setCotizacionToApprove(null)
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error.response?.data?.detalle || error.response?.data?.error || 'Error al aprobar cotización'
      toast.error(errorMessage)
    } finally {
      setApproving(false)
    }
  }

  const handleRechazar = async (cotizacion) => {
    const motivo = window.prompt('Motivo del rechazo (opcional):')
    if (motivo === null) return

    try {
      await rechazarCotizacion(cotizacion.id, motivo)
      toast.success('Cotización rechazada')
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al rechazar cotización')
    }
  }

  const handleVerPDF = (cotizacionId) => {
    setPdfCotizacionId(cotizacionId)
    setShowPDFModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCotizacion(null)
    setFormData({
      tipo: 'instalacion',
      clienteId: '',
      inventarioId: '',
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
      pendiente: 'Pendiente',
      aprobada: 'Aprobada',
      rechazada: 'Rechazada'
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
      instalacion: '🔧 Instalación',
      mantencion: '⚙️ Mantención',
      reparacion: '🔨 Reparación'
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
      cot.inventario?.modelo.toLowerCase().includes(searchTerm.toLowerCase())
    
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
              Cotizaciones
            </h1>
            <p className="text-gray-600 mt-1">
              Gestión de presupuestos y servicios
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 btn-primary"
          >
            <Plus size={20} />
            Nueva Cotización
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Aprobadas</p>
            <p className="text-2xl font-bold text-green-600">{stats.aprobadas}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Rechazadas</p>
            <p className="text-2xl font-bold text-red-600">{stats.rechazadas}</p>
          </div>
        </div>

        {/* Búsqueda y Filtros */}
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente o equipo..."
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
              Filtros
            </button>
          </div>

          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={filters.estado}
                    onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Todos</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="aprobada">Aprobada</option>
                    <option value="rechazada">Rechazada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Servicio
                  </label>
                  <select
                    value={filters.tipo}
                    onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Todos</option>
                    <option value="instalacion">Instalación</option>
                    <option value="mantencion">Mantención</option>
                    <option value="reparacion">Reparación</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-2"
                  >
                    <X size={16} />
                    Limpiar filtros
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
                    Tipo
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase col-equipo-info">
                    Equipo
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase col-precio">
                    Precio
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase col-descuento">
                    Desc.
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase col-total">
                    Total
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase col-estado">
                    Estado
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase col-acciones-cot">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCotizaciones.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      {searchTerm || Object.values(filters).some(v => v) ? (
                        'No se encontraron cotizaciones con estos filtros'
                      ) : (
                        'No hay cotizaciones registradas'
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredCotizaciones.map((cotizacion) => (
                    <tr key={cotizacion.id} className="hover:bg-gray-50">
                      {/* Tipo */}
                      <td className="px-3 py-3 col-tipo-cot">
                        {getTipoBadge(cotizacion.tipo)}
                      </td>
                      
                      {/* Equipo - 2 líneas */}
                      <td className="px-3 py-3 col-equipo-info">
                        <div className="info-2-lineas">
                          <div className="info-principal truncate-text" title={`${cotizacion.inventario?.marca} ${cotizacion.inventario?.modelo}`}>
                            {cotizacion.inventario?.marca} {cotizacion.inventario?.modelo}
                          </div>
                          <div className="info-secundaria">
                            {cotizacion.inventario?.capacidadBTU?.toLocaleString('es-CL')} BTU
                          </div>
                        </div>
                      </td>
                      
                      {/* Precio */}
                      <td className="px-3 py-3 col-precio text-right">
                        <span className="text-sm text-gray-900">
                          ${cotizacion.precioOfertado?.toLocaleString('es-CL')}
                        </span>
                      </td>
                      
                      {/* Descuento */}
                      <td className="px-3 py-3 col-descuento text-center">
                        <span className="text-sm text-gray-600">
                          {cotizacion.descuento}%
                        </span>
                      </td>
                      
                      {/* Total */}
                      <td className="px-3 py-3 col-total text-right">
                        <span className="text-sm font-bold text-green-600">
                          ${cotizacion.precioFinal?.toLocaleString('es-CL')}
                        </span>
                      </td>
                      
                      {/* Estado */}
                      <td className="px-3 py-3 col-estado">
                        {getEstadoBadge(cotizacion.estado)}
                      </td>
                      
                      {/* Acciones */}
                      <td className="px-3 py-3 col-acciones-cot">
                        <div className="flex gap-1 justify-center flex-wrap">
                          {cotizacion.estado === 'aprobada' && (
                            <button
                              onClick={() => handleVerPDF(cotizacion.id)}
                              className="btn-accion-compacto text-purple-600 hover:bg-purple-50"
                              title="Ver PDF"
                            >
                              <FileText size={16} />
                            </button>
                          )}
                          
                          {cotizacion.estado === 'pendiente' && (
                            <>
                              <button
                                onClick={() => handleAprobar(cotizacion)}
                                className="btn-accion-compacto text-green-600 hover:bg-green-50"
                                title="Aprobar"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                onClick={() => handleRechazar(cotizacion)}
                                className="btn-accion-compacto text-red-600 hover:bg-red-50"
                                title="Rechazar"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleEdit(cotizacion)}
                            className="btn-accion-compacto text-blue-600 hover:bg-blue-50"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(cotizacion.id)}
                            className="btn-accion-compacto text-red-600 hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
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

        <div className="mt-4 text-sm text-gray-600 text-center">
          Mostrando {filteredCotizaciones.length} de {cotizaciones.length} cotizaciones
        </div>
      </main>

      {/* Modales (sin cambios, continúan igual) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold mb-4">
              {editingCotizacion ? 'Editar Cotización' : 'Nueva Cotización'}
            </h2>
            
            {/* Resto del formulario igual que el original */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-3">Tipo de Servicio</h3>
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
                        {tipo === 'instalacion' && '🔧 Instalación'}
                        {tipo === 'mantencion' && '⚙️ Mantención'}
                        {tipo === 'reparacion' && '🔨 Reparación'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente *
                  </label>
                  <select
                    value={formData.clienteId}
                    onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={editingCotizacion}
                  >
                    <option value="">Seleccionar...</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Producto *
                  </label>
                  <select
                    value={formData.inventarioId}
                    onChange={(e) => handleInventarioChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={editingCotizacion}
                  >
                    <option value="">Seleccionar...</option>
                    {inventarioDisponible.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.marca} {item.modelo} ({item.capacidadBTU} BTU) - Stock: {item.stock}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Equipo *
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
                      Costo Instalación *
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
                    Costo Material *
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
                    Descuento (%)
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

              {formData.precioOfertado && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Equipo:</span>
                      <span>${parseFloat(formData.precioOfertado || 0).toLocaleString('es-CL')}</span>
                    </div>
                    {formData.tipo === 'instalacion' && (
                      <div className="flex justify-between">
                        <span>Instalación:</span>
                        <span>${parseFloat(formData.costoInstalacion || 0).toLocaleString('es-CL')}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Material:</span>
                      <span>${parseFloat(formData.costoMaterial || 0).toLocaleString('es-CL')}</span>
                    </div>
                    {formData.descuento > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Descuento ({formData.descuento}%):</span>
                        <span>-${((calcularTotal() / (1 - formData.descuento / 100)) - calcularTotal()).toLocaleString('es-CL')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-green-600 pt-2 border-t">
                      <span>TOTAL:</span>
                      <span>${calcularTotal().toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                </div>
              )}

              {formData.tipo === 'instalacion' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección de Instalación
                  </label>
                  <input
                    type="text"
                    value={formData.direccionInstalacion}
                    onChange={(e) => setFormData({ ...formData, direccionInstalacion: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Calle, número, comuna"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Detalles adicionales..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingCotizacion ? 'Actualizar' : 'Crear'}
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
                Aprobar Cotización
              </h2>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-gray-700">
                ¿Confirmas la aprobación de esta cotización?
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <p className="font-medium text-gray-900">
                  {cotizacionToApprove.cliente?.nombre}
                </p>
                <p className="text-sm text-gray-600">
                  {cotizacionToApprove.inventario?.marca} {cotizacionToApprove.inventario?.modelo}
                </p>
                <div className="pt-2">
                  {getTipoBadge(cotizacionToApprove.tipo)}
                </div>
                <p className="text-lg font-bold text-green-600 pt-2">
                  ${cotizacionToApprove.precioFinal.toLocaleString('es-CL')}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">El sistema automáticamente:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Creará el equipo para el cliente</li>
                      <li>Generará una orden de trabajo</li>
                      <li>Reducirá el stock del producto</li>
                      <li>Marcará la cotización como aprobada</li>
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
                Cancelar
              </button>
              <button
                onClick={confirmarAprobacion}
                disabled={approving}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {approving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Aprobando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Confirmar Aprobación
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
    </div>
  )
}

export default Cotizaciones