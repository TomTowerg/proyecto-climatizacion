import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

  // Estados para materiales
  const [materiales, setMateriales] = useState([])
  const [nuevoMaterial, setNuevoMaterial] = useState({
    nombre: '',
    cantidad: 1,
    unidad: 'unidades',
    precioUnitario: 0
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

  // Calcular costoMaterial automáticamente desde materiales
  useEffect(() => {
    const totalMateriales = calcularTotalMateriales()
    setFormData(prev => ({
      ...prev,
      costoMaterial: totalMateriales.toString()
    }))
  }, [materiales])

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
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const fetchEquiposCliente = async (clienteId) => {
    try {
      const equipos = await getEquiposByCliente(clienteId)
      setEquiposCliente(equipos)
      
      if (equipos.length === 0) {
        toast.info('Este cliente no tiene equipos registrados')
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

  const calcularTotalMateriales = () => {
    return materiales.reduce((acc, m) => acc + m.subtotal, 0)
  }

  const agregarMaterial = () => {
    if (!nuevoMaterial.nombre.trim()) {
      toast.error('Ingresa el nombre del material')
      return
    }
    if (nuevoMaterial.cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }
    if (nuevoMaterial.precioUnitario <= 0) {
      toast.error('El precio unitario debe ser mayor a 0')
      return
    }

    const materialConSubtotal = {
      ...nuevoMaterial,
      subtotal: nuevoMaterial.cantidad * nuevoMaterial.precioUnitario
    }

    setMateriales([...materiales, materialConSubtotal])
    
    setNuevoMaterial({
      nombre: '',
      cantidad: 1,
      unidad: 'unidades',
      precioUnitario: 0
    })

    toast.success('Material agregado')
  }

  const eliminarMaterial = (index) => {
    setMateriales(materiales.filter((_, i) => i !== index))
    toast.success('Material eliminado')
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
        direccionInstalacion: formData.direccionInstalacion,
        materiales: materiales
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
        toast.success('Cotización actualizada exitosamente')
      } else {
        await createCotizacion(dataToSend)
        toast.success('Cotización creada exitosamente')
      }
      
      fetchData()
      handleCloseModal()
    } catch (error) {
      console.error('Error completo:', error)
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Error al guardar la cotización'
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
    if (cotizacion.materiales && cotizacion.materiales.length > 0) {
      setMateriales(cotizacion.materiales)
    }
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
      const errorMessage = error.response?.data?.error || 'Error al eliminar la cotización'
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
      
      const mensajesTipo = {
        instalacion: 'Equipo registrado',
        mantencion: 'Mantención programada',
        reparacion: 'Reparación programada'
      }
      
      toast.success(
        <div>
          <p className="font-bold">Cotización Aprobada</p>
          <p className="text-sm mt-1">{mensajesTipo[cotizacionToApprove.tipo]}: #{resultado.equipo?.id || resultado.ordenTrabajo?.id}</p>
          <p className="text-sm">Orden de Trabajo: #{resultado.ordenTrabajo?.id}</p>
        </div>,
        { duration: 5000 }
      )
      
      setShowApproveModal(false)
      setCotizacionToApprove(null)
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error.response?.data?.detalle || error.response?.data?.error || 'Error al aprobar la cotización'
      toast.error(errorMessage)
    } finally {
      setApproving(false)
    }
  }

  const handleRechazar = async (cotizacion) => {
    const motivo = window.prompt('¿Motivo del rechazo?')
    if (motivo === null) return

    try {
      await rechazarCotizacion(cotizacion.id, motivo)
      toast.success('Cotización rechazada')
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al rechazar la cotización')
    }
  }

  const handleVerPDF = (cotizacionId) => {
    setPdfCotizacionId(cotizacionId)
    setShowPDFModal(true)
  }

  const handleCreateQuickClient = async () => {
    if (!newClientData.nombre.trim()) {
      toast.error('El nombre del cliente es requerido')
      return
    }

    setCreatingClient(true)
    try {
      const nuevoCliente = await createCliente(newClientData)
      
      setClientes(prev => [...prev, nuevoCliente])
      setFormData(prev => ({ ...prev, clienteId: nuevoCliente.id.toString() }))
      
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
    setMateriales([])
    setNuevoMaterial({
      nombre: '',
      cantidad: 1,
      unidad: 'unidades',
      precioUnitario: 0
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
            <p className="text-sm text-gray-600">Pendiente</p>
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
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                showFilters ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Filter size={18} />
              Filtros
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <select
                value={filters.estado}
                onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobada">Aprobada</option>
                <option value="rechazada">Rechazada</option>
              </select>

              <select
                value={filters.tipo}
                onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos los tipos</option>
                <option value="instalacion">Instalación</option>
                <option value="mantencion">Mantención</option>
                <option value="reparacion">Reparación</option>
              </select>

              {(filters.estado || filters.tipo) && (
                <button
                  onClick={clearFilters}
                  className="col-span-2 text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
                >
                  <X size={16} />
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tabla-compacta">
              <thead>
                <tr>
                  <th className="text-left">ID</th>
                  <th className="text-left">Tipo</th>
                  <th className="text-left">Cliente</th>
                  <th className="text-left">Equipo</th>
                  <th className="text-right">Total</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center">Fecha</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCotizaciones.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-gray-500 py-8">
                      {searchTerm || filters.estado || filters.tipo
                        ? 'No se encontraron resultados'
                        : 'No hay cotizaciones registradas'}
                    </td>
                  </tr>
                ) : (
                  filteredCotizaciones.map((cotizacion) => {
                    const producto = cotizacion.inventario
                      ? `${cotizacion.inventario.marca} ${cotizacion.inventario.modelo}`
                      : cotizacion.equipo
                      ? `${cotizacion.equipo.marca} ${cotizacion.equipo.modelo}`
                      : 'N/A'

                    return (
                      <tr key={cotizacion.id}>
                        <td className="font-mono">#{cotizacion.id}</td>
                        <td>{getTipoBadge(cotizacion.tipo)}</td>
                        <td>{cotizacion.cliente?.nombre}</td>
                        <td className="text-sm">{producto}</td>
                        <td className="text-right font-semibold text-green-600">
                          ${cotizacion.precioFinal.toLocaleString('es-CL')}
                        </td>
                        <td className="text-center">{getEstadoBadge(cotizacion.estado)}</td>
                        <td className="text-center text-sm">
                          {new Date(cotizacion.createdAt).toLocaleDateString('es-CL')}
                        </td>
                        <td>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleVerPDF(cotizacion.id)}
                              className="btn-accion-compacto text-gray-600 hover:bg-gray-50"
                              title="Ver PDF"
                            >
                              <FileText size={16} />
                            </button>
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
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600 text-center">
          Mostrando {filteredCotizaciones.length} de {cotizaciones.length} cotizaciones
        </div>
      </main>

      {/* Modal de Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingCotizacion ? 'Editar Cotización' : 'Nueva Cotización'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo de Servicio */}
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

              {/* Cliente y Producto/Equipo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.clienteId}
                      onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    
                    {!editingCotizacion && (
                      <button
                        type="button"
                        onClick={() => setShowClientModal(true)}
                        className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                        title="Crear cliente"
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
                      Equipo *
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
                )}

                {/* MANTENCIÓN/REPARACIÓN: Mostrar equipos del cliente */}
                {(formData.tipo === 'mantencion' || formData.tipo === 'reparacion') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Equipo del Cliente *
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
                          ? 'Primero selecciona un cliente'
                          : equiposCliente.length === 0
                          ? 'Este cliente no tiene equipos'
                          : 'Seleccionar...'}
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
                    {formData.tipo === 'instalacion' && 'Precio del Equipo *'}
                    {formData.tipo === 'mantencion' && 'Precio Mantención *'}
                    {formData.tipo === 'reparacion' && 'Precio Reparación *'}
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
                    Costo Materiales
                  </label>
                  <input
                    type="number"
                    value={formData.costoMaterial}
                    onChange={(e) => setFormData({ ...formData, costoMaterial: e.target.value })}
                    step="1"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    readOnly
                    title="Se calcula automáticamente desde los materiales agregados"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Se calcula automáticamente con los materiales
                  </p>
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

              {/* SECCIÓN MATERIALES */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  📦 Materiales
                  <span className="text-sm font-normal text-gray-600">
                    ({materiales.length} {materiales.length === 1 ? 'material' : 'materiales'})
                  </span>
                </h3>

                {/* Formulario para agregar material */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Nombre del Material
                      </label>
                      <input
                        type="text"
                        value={nuevoMaterial.nombre}
                        onChange={(e) => setNuevoMaterial({...nuevoMaterial, nombre: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Ej: Cañería de cobre 1/2"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        value={nuevoMaterial.cantidad}
                        onChange={(e) => setNuevoMaterial({...nuevoMaterial, cantidad: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        min="0"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Unidad
                      </label>
                      <select
                        value={nuevoMaterial.unidad}
                        onChange={(e) => setNuevoMaterial({...nuevoMaterial, unidad: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="unidades">Unidades</option>
                        <option value="metros">Metros</option>
                        <option value="kilogramos">Kilogramos</option>
                        <option value="litros">Litros</option>
                        <option value="cajas">Cajas</option>
                        <option value="paquetes">Paquetes</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Precio Unitario ($)
                      </label>
                      <input
                        type="number"
                        value={nuevoMaterial.precioUnitario}
                        onChange={(e) => setNuevoMaterial({...nuevoMaterial, precioUnitario: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        min="0"
                        step="1"
                        placeholder="0"
                      />
                    </div>

                    <div className="col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={agregarMaterial}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        disabled={!nuevoMaterial.nombre || nuevoMaterial.precioUnitario <= 0}
                      >
                        <Plus size={16} />
                        Agregar Material
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lista de materiales agregados */}
                {materiales.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Material</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-700">Cantidad</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-700">Unidad</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700">Precio Unit.</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700">Subtotal</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-700">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {materiales.map((material, index) => (
                          <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                            <td className="px-3 py-2">{material.nombre}</td>
                            <td className="px-3 py-2 text-center">{material.cantidad}</td>
                            <td className="px-3 py-2 text-center">{material.unidad}</td>
                            <td className="px-3 py-2 text-right">
                              ${material.precioUnitario.toLocaleString('es-CL')}
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              ${material.subtotal.toLocaleString('es-CL')}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => eliminarMaterial(index)}
                                className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                                title="Eliminar material"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr className="border-t-2 border-gray-300">
                          <td colSpan="4" className="px-3 py-2 text-right font-bold text-gray-700">
                            Total Materiales:
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-green-600">
                            ${calcularTotalMateriales().toLocaleString('es-CL')}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {materiales.length === 0 && (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-sm">No hay materiales agregados</p>
                    <p className="text-xs mt-1">Agrega materiales usando el formulario de arriba</p>
                  </div>
                )}
              </div>

              {/* Vista Previa del Total */}
              {formData.precioOfertado && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>
                        {formData.tipo === 'instalacion' && 'Equipo:'}
                        {formData.tipo === 'mantencion' && 'Mantención:'}
                        {formData.tipo === 'reparacion' && 'Reparación:'}
                      </span>
                      <span>${parseFloat(formData.precioOfertado || 0).toLocaleString('es-CL')}</span>
                    </div>
                    {formData.tipo === 'instalacion' && (
                      <div className="flex justify-between">
                        <span>Instalación:</span>
                        <span>${parseFloat(formData.costoInstalacion || 0).toLocaleString('es-CL')}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Materiales:</span>
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

              {/* Información Adicional */}
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
                    placeholder="Dirección donde se realizará la instalación"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas u Observaciones
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Información adicional sobre la cotización"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingCotizacion ? 'Guardar Cambios' : 'Crear Cotización'}
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
                ¿Estás seguro de aprobar esta cotización?
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
                  ${cotizacionToApprove.precioFinal.toLocaleString('es-CL')}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">El sistema realizará:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      {cotizacionToApprove.tipo === 'instalacion' ? (
                        <>
                          <li>Crear registro de equipo para el cliente</li>
                          <li>Reducir stock del inventario</li>
                        </>
                      ) : (
                        <li>Usar equipo existente del cliente</li>
                      )}
                      <li>Crear orden de trabajo</li>
                      <li>Marcar cotización como aprobada</li>
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
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Aprobar
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

      {/* Modal CREAR CLIENTE RÁPIDO */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <UserPlus className="text-green-500" size={24} />
                <h2 className="text-xl font-bold text-gray-800">
                  Crear Cliente Rápido
                </h2>
              </div>
              <button
                onClick={() => setShowClientModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RUT
                </label>
                <input
                  type="text"
                  value={newClientData.rut}
                  onChange={(e) => setNewClientData({ ...newClientData, rut: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="12.345.678-9"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="cliente@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={newClientData.telefono}
                  onChange={(e) => setNewClientData({ ...newClientData, telefono: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
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

            <div className="flex gap-3 p-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setShowClientModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={creatingClient}
              >
                Cancelar
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
                    Creando...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Crear Cliente
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
