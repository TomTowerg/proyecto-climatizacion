import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, Search, Users, Mail, Phone, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import MainLayout from '../components/MainLayout'
import Pagination from '../components/Pagination'
import LoadingSkeleton from '../components/LoadingSkeleton'
import { isAuthenticated } from '../services/authService'
import { getClientes, createCliente, updateCliente, deleteCliente } from '../services/clienteService'
import { validarRut, formatearRut } from '../utils/rutValidator'
import RutInput from '../components/RutInput'
import PhoneInput from '../components/PhoneInput'

function Clientes() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [paginationInfo, setPaginationInfo] = useState(null)
  const ITEMS_PER_PAGE = 20
  const isFirstRender = useRef(true)
  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    email: '',
    telefono: '',
    direccion: ''
  })

  const fetchClientes = useCallback(async (page, search) => {
    try {
      setLoading(true)
      const data = await getClientes({ page, limit: ITEMS_PER_PAGE, search: search || undefined })

      // Respuesta paginada: { data: [...], pagination: {...} }
      if (data.pagination) {
        setClientes(data.data)
        setPaginationInfo(data.pagination)
      } else {
        // Fallback retrocompatible (array directo)
        setClientes(data)
        setPaginationInfo(null)
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error)
      toast.error(t('clients.messages.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/')
      return
    }
    fetchClientes(currentPage, debouncedSearch)
  }, [navigate, fetchClientes, currentPage, debouncedSearch])

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

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // ⭐ RutInput ya valida, pero por seguridad verificamos
    if (!formData.rut || formData.rut.length < 11) {
      toast.error(t('clients.messages.invalidRut'))
      return
    }

    try {
      if (editingCliente) {
        await updateCliente(editingCliente.id, formData)
        toast.success(t('clients.messages.updateSuccess'))
      } else {
        await createCliente(formData)
        toast.success(t('clients.messages.createSuccess'))
      }

      fetchClientes()
      handleCloseModal()
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error.response?.data?.error || t('clients.messages.saveError')
      toast.error(errorMessage)
    }
  }

  const handleEdit = (cliente) => {
    setEditingCliente(cliente)
    setFormData({
      nombre: cliente.nombre,
      rut: cliente.rut,
      email: cliente.email,
      telefono: cliente.telefono,
      direccion: cliente.direccion
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('clients.deleteConfirm'))) {
      return
    }

    try {
      await deleteCliente(id)
      toast.success(t('clients.messages.deleteSuccess'))
      fetchClientes()
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error.response?.data?.error || t('clients.messages.deleteError')
      toast.error(errorMessage)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCliente(null)
    setFormData({
      nombre: '',
      rut: '',
      email: '',
      telefono: '',
      direccion: ''
    })
  }


  // Los datos ya vienen filtrados del servidor
  const filteredClientes = clientes

  if (loading && clientes.length === 0) {
    return <LoadingSkeleton accentColor="indigo" rows={8} columns={5} />
  }

  return (
    <MainLayout>
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 backdrop-blur-sm bg-white/80">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="text-white" size={22} />
                </div>
                {t('clients.title')}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {t('clients.subtitle')} • Total: {paginationInfo ? paginationInfo.total : clientes.length}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus size={20} />
                {t('clients.add')}
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
                placeholder={t('clients.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Tabla de clientes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('clients.table.name')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('clients.table.rut')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('clients.table.email')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('clients.table.phone')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('clients.table.address')}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('clients.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredClientes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <Users size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">{t('clients.table.empty')}</p>
                    </td>
                  </tr>
                ) : (
                  filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-bold text-indigo-600">
                              {cliente.nombre?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="font-medium text-gray-900">{cliente.nombre}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-mono text-sm">
                        {cliente.rut}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail size={14} className="text-gray-400" />
                          <span className="text-sm">{cliente.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone size={14} className="text-gray-400" />
                          <span className="text-sm">{cliente.telefono}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600 max-w-xs">
                          <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-sm truncate" title={cliente.direccion}>
                            {cliente.direccion || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(cliente)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(cliente.id)}
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

          {/* Paginación */}
          {paginationInfo && (
            <Pagination
              currentPage={currentPage}
              totalPages={paginationInfo.totalPages}
              total={paginationInfo.total}
              limit={paginationInfo.limit}
              onPageChange={handlePageChange}
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              {editingCliente ? t('clients.edit') : t('clients.add')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('clients.form.name')} *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('clients.form.rut')} *
                </label>
                <RutInput
                  value={formData.rut}
                  onChange={(valor) => setFormData({ ...formData, rut: valor })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                  showValidation={true}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('clients.form.email')} *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('clients.form.phone')} *
                </label>
                <PhoneInput
                  value={formData.telefono}
                  onChange={(valor) => setFormData({ ...formData, telefono: valor })}
                  defaultCountry="CL"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('clients.form.address')} *
                </label>
                <textarea
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  {t('clients.form.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all font-medium shadow-lg"
                >
                  {editingCliente ? t('clients.form.update') : t('clients.form.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default Clientes
