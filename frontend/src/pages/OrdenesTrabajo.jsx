import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, Search, Sparkles, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { isAuthenticated } from '../services/authService'
import { getOrdenesTrabajo, createOrdenTrabajo, updateOrdenTrabajo, deleteOrdenTrabajo } from '../services/ordenTrabajoService'
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

  const handleAnalizarUrgencia = async () => {
    if (!formData.notas || formData.notas.trim() === '') {
      toast.error('Por favor escribe una descripción del problema para analizar')
      return
    }

    if (!formData.tipo) {
      toast.error('Por favor selecciona el tipo de trabajo')
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
      
      // Mapear el nivel a nuestro formato
      const urgenciaMap = {
        'CRÍTICA': 'critica',
        'CRITICA': 'critica',
        'MEDIA': 'media',
        'BAJA': 'baja'
      }
      
      setFormData({
        ...formData,
        urgencia: urgenciaMap[analisis.nivel] || 'media'
      })

      toast.success('Análisis completado')
    } catch (error) {
      console.error('Error al analizar:', error)
      toast.error('Error al analizar urgencia')
    } finally {
      setAnalizando(false)
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
      estado: orden.estado,
      urgencia: orden.urgencia || 'media'
    })
    
    // Parsear análisis IA si existe
    if (orden.analisisIA) {
      try {
        setAnalisisIA(JSON.parse(orden.analisisIA))
      } catch (e) {
        setAnalisisIA(null)
      }
    }
    
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
      toast.error('Esta orden no tiene análisis de IA')
      return
    }
    
    try {
      const analisis = typeof orden.analisisIA === 'string' 
        ? JSON.parse(orden.analisisIA) 
        : orden.analisisIA
      setAnalisisSeleccionado(analisis)
      setShowAnalisisModal(true)
    } catch (e) {
      toast.error('Error al cargar análisis')
    }
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

  const getUrgenciaBadge = (urgencia) => {
    const badges = {
      baja: 'bg-green-100 text-green-800',
      media: 'bg-yellow-100 text-yellow-800',
      critica: 'bg-red-100 text-red-800'
    }
    const labels = {
      baja: '🟢 Baja',
      media: '🟡 Media',
      critica: '🔴 Crítica'
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
                    Urgencia
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
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getUrgenciaBadge(orden.urgencia)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {orden.tecnico}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(orden.estado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {orden.analisisIA && (
                            <button
                              onClick={() => verAnalisisIA(orden)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Ver análisis de IA"
                            >
                              <Eye size={18} />
                            </button>
                          )}
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

      {/* Modal de Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
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
                  Notas / Descripción del Problema *
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe el problema o trabajo a realizar..."
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
                  {analizando ? 'Analizando...' : '🤖 Analizar Urgencia con IA'}
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
                          ? '⚠️ URGENCIA CRÍTICA' 
                          : analisisIA.nivel === 'MEDIA' 
                          ? '⚡ URGENCIA MEDIA' 
                          : '✅ URGENCIA BAJA'}
                      </h3>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Razones:</strong>
                          <ul className="list-disc list-inside ml-2 mt-1">
                            {analisisIA.razones?.map((razon, idx) => (
                              <li key={idx}>{razon}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <strong>🎯 Acción Recomendada:</strong>
                          <p className="ml-2 mt-1">{analisisIA.accionRecomendada}</p>
                        </div>
                        
                        <div>
                          <strong>⏱️ Tiempo de Respuesta:</strong>
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

      {/* Modal de Ver Análisis */}
      {showAnalisisModal && analisisSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">📊 Análisis de IA</h2>
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
                      ? '⚠️ URGENCIA CRÍTICA' 
                      : analisisSeleccionado.nivel === 'MEDIA' 
                      ? '⚡ URGENCIA MEDIA' 
                      : '✅ URGENCIA BAJA'}
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <strong className="text-gray-700">Razones:</strong>
                      <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
                        {analisisSeleccionado.razones?.map((razon, idx) => (
                          <li key={idx} className="text-gray-600">{razon}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <strong className="text-gray-700">🎯 Acción Recomendada:</strong>
                      <p className="ml-2 mt-1 text-gray-600">{analisisSeleccionado.accionRecomendada}</p>
                    </div>
                    
                    <div>
                      <strong className="text-gray-700">⏱️ Tiempo de Respuesta:</strong>
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
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdenesTrabajo