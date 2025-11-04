import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { isAuthenticated } from '../services/authService'
import { getOrdenesTrabajo, createOrdenTrabajo, updateOrdenTrabajo, deleteOrdenTrabajo } from '../services/ordenTrabajoService'
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
  const [formData, setFormData] = useState({
    clienteId: '',
    equipoId: '',
    tipo: '',
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
    tecnico: '',
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
    // Filtrar equipos cuando cambia el cliente
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
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const dataToSend = {
        ...formData,
        equipoId: formData.equipoId || null
      }

      if (editingOrden) {
        await updateOrdenTrabajo(editingOrden.id, dataToSend)
        toast.success('Orden de trabajo actualizada exitosamente')
      } else {
        await createOrdenTrabajo(dataToSend)
        toast.success('Orden de trabajo creada exitosamente')
      }
      
      fetchData()
      handleCloseModal()
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error.response?.data?.error || 'Error al guardar orden de trabajo'
      toast.error(errorMessage)
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
      estado: orden.estado
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta orden de trabajo?')) {
      return
    }

    try {
      await deleteOrdenTrabajo(id)
      toast.success('Orden de trabajo eliminada exitosamente')
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error.response?.data?.error || 'Error al eliminar orden de trabajo'
      toast.error(errorMessage)
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
      estado: 'pendiente'
    })
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      en_proceso: 'bg-blue-100 text-blue-800',
      completado: 'bg-green-100 text-green-800'
    }
    const labels = {
      pendiente: 'Pendiente',
      en_proceso: 'En Proceso',
      completado: 'Completado'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[estado]}`}>
        {labels[estado]}
      </span>
    )
  }

  const getTipoBadge = (tipo) => {
    const badges = {
      instalacion: 'bg-purple-100 text-purple-800',
      mantenimiento: 'bg-blue-100 text-blue-800',
      reparacion: 'bg-red-100 text-red-800'
    }
    const labels = {
      instalacion: 'Instalación',
      mantenimiento: 'Mantenimiento',
      reparacion: 'Reparación'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[tipo]}`}>
        {labels[tipo]}
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
              placeholder="Buscar por cliente, técnico o tipo..."
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
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Técnico
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
                {filteredOrdenes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No hay órdenes de trabajo registradas
                    </td>
                  </tr>
                ) : (
                  filteredOrdenes.map((orden) => (
                    <tr key={orden.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">
                          {new Date(orden.fecha).toLocaleDateString('es-CL')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{orden.cliente?.nombre}</div>
                        {orden.equipo && (
                          <div className="text-sm text-gray-500">
                            {orden.equipo.marca} {orden.equipo.modelo}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTipoBadge(orden.tipo)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {orden.tecnico}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(orden.estado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(orden)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(orden.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
              {editingOrden ? 'Editar Orden de Trabajo' : 'Crear Orden de Trabajo'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente *
                  </label>
                  <select
                    value={formData.clienteId}
                    onChange={(e) => setFormData({ ...formData, clienteId: e.target.value, equipoId: '' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
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
                    Equipo (Opcional)
                  </label>
                  <select
                    value={formData.equipoId}
                    onChange={(e) => setFormData({ ...formData, equipoId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!formData.clienteId}
                  >
                    <option value="">Seleccionar...</option>
                    {equiposFiltrados.map(equipo => (
                      <option key={equipo.id} value={equipo.id}>
                        {equipo.marca} {equipo.modelo} - {equipo.numeroSerie}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    <option value="instalacion">Instalación</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="reparacion">Reparación</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado *
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="completado">Completado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
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
                    Técnico *
                  </label>
                  <input
                    type="text"
                    value={formData.tecnico}
                    onChange={(e) => setFormData({ ...formData, tecnico: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descripción del trabajo a realizar..."
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
                  {editingOrden ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdenesTrabajo