import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, Search, Wind, Filter, X } from 'lucide-react'
import toast from 'react-hot-toast'
import MainLayout from '../components/MainLayout'
import Pagination from '../components/Pagination'
import LoadingSkeleton from '../components/LoadingSkeleton'
import { isAuthenticated } from '../services/authService'
import { getEquipos, createEquipo, updateEquipo, deleteEquipo } from '../services/equipoService'
import { getClientes } from '../services/clienteService'
import '../styles/tablas-compactas.css'

function Equipos() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [equipos, setEquipos] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ tipo: '' })
  const [showModal, setShowModal] = useState(false)
  const [editingEquipo, setEditingEquipo] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [paginationInfo, setPaginationInfo] = useState(null)
  const ITEMS_PER_PAGE = 20
  const isFirstRender = useRef(true)
  const [formData, setFormData] = useState({
    tipo: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    capacidad: '',
    tipoGas: '',
    ano: new Date().getFullYear(),
    clienteId: ''
  })

  const fetchData = useCallback(async (page = 1, search = '') => {
    try {
      setLoading(true)
      const [equiposData, clientesData] = await Promise.all([
        getEquipos({ page, limit: ITEMS_PER_PAGE, search: search || undefined }),
        getClientes()
      ])

      if (equiposData.pagination) {
        setEquipos(equiposData.data)
        setPaginationInfo(equiposData.pagination)
      } else {
        setEquipos(equiposData)
        setPaginationInfo(null)
      }
      setClientes(Array.isArray(clientesData) ? clientesData : clientesData.data || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error(t('equipment.messages.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/')
      return
    }
    fetchData(currentPage, debouncedSearch)
  }, [navigate, fetchData, currentPage, debouncedSearch])

  // Debounce del término de búsqueda (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Cuando cambia la búsqueda debounced, resetear a página 1
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setCurrentPage(1)
  }, [debouncedSearch])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingEquipo) {
        await updateEquipo(editingEquipo.id, formData)
        toast.success(t('equipment.messages.updateSuccess'))
      } else {
        await createEquipo(formData)
        toast.success(t('equipment.messages.createSuccess'))
      }

      fetchData(currentPage, debouncedSearch)
      handleCloseModal()
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error.response?.data?.error || t('equipment.messages.saveError')
      toast.error(errorMessage)
    }
  }

  const handleEdit = (equipo) => {
    setEditingEquipo(equipo)
    setFormData({
      tipo: equipo.tipo,
      marca: equipo.marca,
      modelo: equipo.modelo,
      numeroSerie: equipo.numeroSerie,
      capacidad: equipo.capacidad,
      tipoGas: equipo.tipoGas,
      ano: equipo.ano,
      clienteId: equipo.clienteId
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('equipment.messages.deleteConfirm'))) {
      return
    }

    try {
      await deleteEquipo(id)
      toast.success(t('equipment.messages.deleteSuccess'))
      fetchData(currentPage, debouncedSearch)
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error.response?.data?.error || t('equipment.messages.deleteError')
      toast.error(errorMessage)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingEquipo(null)
    setFormData({
      tipo: '',
      marca: '',
      modelo: '',
      numeroSerie: '',
      capacidad: '',
      tipoGas: '',
      ano: new Date().getFullYear(),
      clienteId: ''
    })
  }

  const clearFilters = () => {
    setFilters({ tipo: '' })
  }

  const filteredEquipos = equipos.filter(equipo => {
    const matchesTipo = !filters.tipo || equipo.tipo === filters.tipo
    return matchesTipo
  })

  if (loading && equipos.length === 0) {
    return <LoadingSkeleton accentColor="cyan" rows={8} columns={6} showStats={true} statCards={4} />
  }

  return (
    <MainLayout>
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 backdrop-blur-sm bg-white/80">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Wind className="text-white" size={22} />
                </div>
                {t('equipment.title')}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestión de equipos HVAC • Total: {paginationInfo ? paginationInfo.total : equipos.length}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus size={20} />
                {t('equipment.add')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="p-8">
        {/* Barra de búsqueda */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t('equipment.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${showFilters ? 'bg-cyan-600 text-white shadow-lg' : 'border border-gray-200 hover:bg-gray-50'}`}
            >
              <Filter size={20} />
              <span>Filtros</span>
            </button>
          </div>

          {showFilters && (
            <div className="flex gap-4 pt-4 mt-4 border-t border-gray-200 items-center">
              <select
                value={filters.tipo}
                onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">{t('equipment.allTypes', 'Todos los tipos')}</option>
                <option value="Split Muro">Split Muro</option>
                <option value="Split">Split</option>
                <option value="Cassette">Cassette</option>
                <option value="Piso-Techo">Piso-Techo</option>
                <option value="VRF">VRF</option>
                <option value="Ventana">Ventana</option>
              </select>

              {filters.tipo && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                >
                  <X size={16} />
                  Limpiar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tabla de equipos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="tabla-compacta overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider col-tipo">
                    {t('equipment.table.type')}
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider col-marca-modelo">
                    {t('equipment.table.brandModel')}
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider col-numero-serie">
                    {t('equipment.table.serialNumber')}
                  </th>
                  <th className="px-3 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider col-capacidad">
                    {t('equipment.table.capacity')}
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider col-cliente">
                    {t('equipment.table.client')}
                  </th>
                  <th className="px-3 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider col-acciones">
                    {t('equipment.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredEquipos.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <Wind size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">{t('equipment.table.empty')}</p>
                    </td>
                  </tr>
                ) : (
                  filteredEquipos.map((equipo) => (
                    <tr key={equipo.id} className="hover:bg-cyan-50/30 transition-colors">
                      {/* Tipo */}
                      <td className="px-3 py-3 col-tipo">
                        <span className="text-sm font-medium text-gray-900">
                          {equipo.tipo}
                        </span>
                      </td>

                      {/* Marca/Modelo */}
                      <td className="px-3 py-3 col-marca-modelo">
                        <div className="info-2-lineas">
                          <div className="info-principal">{equipo.marca}</div>
                          <div className="info-secundaria truncate-text" title={equipo.modelo}>
                            {equipo.modelo}
                          </div>
                        </div>
                      </td>

                      {/* N° Serie */}
                      <td className="px-3 py-3 col-numero-serie">
                        <span className="numero-serie-text font-mono text-xs" title={equipo.numeroSerie}>
                          {equipo.numeroSerie}
                        </span>
                      </td>

                      {/* Capacidad */}
                      <td className="px-3 py-3 col-capacidad text-center">
                        <span className="badge-compacto bg-cyan-100 text-cyan-800">
                          {equipo.capacidad}
                        </span>
                      </td>

                      {/* Cliente */}
                      <td className="px-3 py-3 col-cliente">
                        <span className="text-sm text-gray-900 truncate-text" title={equipo.cliente?.nombre}>
                          {equipo.cliente?.nombre}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-3 py-3 col-acciones">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleEdit(equipo)}
                            className="btn-accion-compacto text-cyan-600 hover:bg-cyan-50"
                            title={t('common.edit')}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(equipo.id)}
                            className="btn-accion-compacto text-red-600 hover:bg-red-50"
                            title={t('common.delete')}
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

        {/* Paginación */}
        {paginationInfo && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={paginationInfo.totalPages}
              onPageChange={handlePageChange}
              totalItems={paginationInfo.total}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              {editingEquipo ? t('equipment.edit') : t('equipment.add')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('equipment.form.type')} *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">{t('common.select')}...</option>
                    <option value="Split Muro">Split Muro</option>
                    <option value="Split">Split</option>
                    <option value="Cassette">Cassette</option>
                    <option value="Piso-Techo">Piso-Techo</option>
                    <option value="VRF">VRF</option>
                    <option value="Ventana">Ventana</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('equipment.form.client')} *
                  </label>
                  <select
                    value={formData.clienteId}
                    onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('equipment.form.brand')} *
                  </label>
                  <input
                    type="text"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('equipment.form.model')} *
                  </label>
                  <input
                    type="text"
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('equipment.form.serialNumber')} *
                  </label>
                  <input
                    type="text"
                    value={formData.numeroSerie}
                    onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('equipment.form.year')} *
                  </label>
                  <input
                    type="number"
                    value={formData.ano}
                    onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('equipment.form.capacity')} *
                  </label>
                  <input
                    type="text"
                    value={formData.capacidad}
                    onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                    placeholder="12000 BTU"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('equipment.form.gasType')} *
                  </label>
                  <select
                    value={formData.tipoGas}
                    onChange={(e) => setFormData({ ...formData, tipoGas: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">{t('common.select')}...</option>
                    <option value="R410A">R410A</option>
                    <option value="R32">R32</option>
                    <option value="R22">R22</option>
                    <option value="R134A">R134A</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-700 hover:to-blue-700 transition-all font-medium shadow-lg"
                >
                  {editingEquipo ? t('common.save') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default Equipos