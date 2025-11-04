import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Search, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { isAuthenticated } from '../services/authService'
import { getCotizaciones, createCotizacion, updateCotizacion, deleteCotizacion } from '../services/cotizacionService'
import { getClientes } from '../services/clienteService'
import { getInventario } from '../services/inventarioService'

function Cotizaciones() {
  const navigate = useNavigate()
  const [cotizaciones, setCotizaciones] = useState([])
  const [clientes, setClientes] = useState([])
  const [inventario, setInventario] = useState([])
  const [inventarioDisponible, setInventarioDisponible] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCotizacion, setEditingCotizacion] = useState(null)
  const [formData, setFormData] = useState({
    clienteId: '',
    inventarioId: '',
    precioOfertado: '',
    descuento: 0,
    notas: '',
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
    // Calcular precio final cuando cambia precio o descuento
    if (formData.precioOfertado) {
      const precio = parseFloat(formData.precioOfertado)
      const desc = parseFloat(formData.descuento) || 0
      const precioFinal = precio - (precio * (desc / 100))
      // No guardamos en formData porque se calcula en backend
    }
  }, [formData.precioOfertado, formData.descuento])

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
      
      // Filtrar solo inventario disponible o reservado (no vendido)
      const disponible = inventarioData.filter(item => 
        item.estado === 'disponible' || item.estado === 'reservado'
      )
      setInventarioDisponible(disponible)
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      // Preparar datos con valores numéricos
      const dataToSend = {
        clienteId: parseInt(formData.clienteId),
        inventarioId: parseInt(formData.inventarioId),
        precioOfertado: parseFloat(formData.precioOfertado),
        descuento: parseFloat(formData.descuento) || 0,
        notas: formData.notas
      }

      // Log para debug
      console.log('Enviando datos:', dataToSend)

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
      console.error('Respuesta del servidor:', error.response?.data)
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Error al guardar cotización'
      toast.error(errorMessage)
    }
  }

  const handleEdit = (cotizacion) => {
    setEditingCotizacion(cotizacion)
    setFormData({
      clienteId: cotizacion.clienteId,
      inventarioId: cotizacion.inventarioId,
      precioOfertado: cotizacion.precioOfertado,
      descuento: cotizacion.descuento,
      notas: cotizacion.notas || '',
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

  const handleAprobar = async (cotizacion) => {
    if (!window.confirm('¿Aprobar esta cotización? El equipo se marcará como vendido.')) {
      return
    }

    try {
      await updateCotizacion(cotizacion.id, {
        estado: 'aprobada',
        fechaRespuesta: new Date().toISOString()
      })
      toast.success('Cotización aprobada exitosamente')
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al aprobar cotización')
    }
  }

  const handleRechazar = async (cotizacion) => {
    if (!window.confirm('¿Rechazar esta cotización? El equipo quedará disponible nuevamente.')) {
      return
    }

    try {
      await updateCotizacion(cotizacion.id, {
        estado: 'rechazada',
        fechaRespuesta: new Date().toISOString()
      })
      toast.success('Cotización rechazada')
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al rechazar cotización')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCotizacion(null)
    setFormData({
      clienteId: '',
      inventarioId: '',
      precioOfertado: '',
      descuento: 0,
      notas: '',
      estado: 'pendiente'
    })
  }

  const handleInventarioChange = (inventarioId) => {
    const item = inventario.find(i => i.id === parseInt(inventarioId))
    if (item) {
      setFormData({
        ...formData,
        inventarioId,
        precioOfertado: item.precioVenta.toString() // Convertir a string para el input
      })
    } else {
      setFormData({
        ...formData,
        inventarioId,
        precioOfertado: ''
      })
    }
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
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[estado]}`}>
        {labels[estado]}
      </span>
    )
  }

  const calcularPrecioFinal = (precio, descuento) => {
    const precioNum = parseFloat(precio)
    const descNum = parseFloat(descuento) || 0
    return precioNum - (precioNum * (descNum / 100))
  }

  const filteredCotizaciones = cotizaciones.filter(cot =>
    cot.cliente?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cot.inventario?.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cot.inventario?.modelo.toLowerCase().includes(searchTerm.toLowerCase())
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
            Cotizaciones
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 btn-primary"
          >
            <Plus size={20} />
            Nueva Cotización
          </button>
        </div>

        <div className="card mb-6">
          <div className="flex items-center gap-2">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente o equipo..."
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
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descuento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCotizaciones.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      No hay cotizaciones registradas
                    </td>
                  </tr>
                ) : (
                  filteredCotizaciones.map((cotizacion) => (
                    <tr key={cotizacion.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(cotizacion.fechaCotizacion).toLocaleDateString('es-CL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{cotizacion.cliente?.nombre}</div>
                        <div className="text-sm text-gray-500">{cotizacion.cliente?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{cotizacion.inventario?.marca} {cotizacion.inventario?.modelo}</div>
                        <div className="text-sm text-gray-500">{cotizacion.inventario?.capacidad}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        ${cotizacion.precioOfertado.toLocaleString('es-CL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {cotizacion.descuento}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-green-600">
                          ${cotizacion.precioFinal.toLocaleString('es-CL')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(cotizacion.estado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {cotizacion.estado === 'pendiente' && (
                            <>
                              <button
                                onClick={() => handleAprobar(cotizacion)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Aprobar"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleRechazar(cotizacion)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Rechazar"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleEdit(cotizacion)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(cotizacion.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingCotizacion ? 'Editar Cotización' : 'Nueva Cotización'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente *
                  </label>
                  <select
                    value={formData.clienteId}
                    onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    Equipo del Inventario *
                  </label>
                  <select
                    value={formData.inventarioId}
                    onChange={(e) => handleInventarioChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={editingCotizacion}
                  >
                    <option value="">Seleccionar...</option>
                    {inventarioDisponible.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.marca} {item.modelo} - {item.precioVenta.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Ofertado *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      value={formData.precioOfertado}
                      onChange={(e) => setFormData({ ...formData, precioOfertado: e.target.value })}
                      step="1000"
                      min="0"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      required
                    />
                  </div>
                  {formData.precioOfertado && (
                    <p className="text-xs text-gray-500 mt-1">
                      {parseFloat(formData.precioOfertado).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}
                    </p>
                  )}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {formData.precioOfertado && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Precio Final:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${calcularPrecioFinal(formData.precioOfertado, formData.descuento).toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>
              )}

              {editingCotizacion && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="aprobada">Aprobada</option>
                    <option value="rechazada">Rechazada</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Detalles adicionales de la cotización..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  {editingCotizacion ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cotizaciones