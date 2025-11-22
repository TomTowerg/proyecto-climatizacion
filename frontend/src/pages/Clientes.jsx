import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { isAuthenticated } from '../services/authService'
import { getClientes, createCliente, updateCliente, deleteCliente } from '../services/clienteService'
import { validarRut, formatearRut } from '../utils/rutValidator'

function Clientes() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    email: '',
    telefono: '',
    direccion: ''
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/')
      return
    }
    fetchClientes()
  }, [navigate])

  const fetchClientes = async () => {
    try {
      setLoading(true)
      const data = await getClientes()
      setClientes(data)
    } catch (error) {
      console.error('Error al cargar clientes:', error)
      toast.error(t('clients.messages.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar RUT
    if (!validarRut(formData.rut)) {
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

  const handleRutChange = (e) => {
    const formattedRut = formatearRut(e.target.value)
    setFormData({ ...formData, rut: formattedRut })
  }

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.rut.includes(searchTerm) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase())
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
            {t('clients.title')}
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 btn-primary"
          >
            <Plus size={20} />
            {t('clients.add')}
          </button>
        </div>

        <div className="card mb-6">
          <div className="flex items-center gap-2">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder={t('clients.searchPlaceholder')}
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
                    {t('clients.table.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('clients.table.rut')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('clients.table.email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('clients.table.phone')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('clients.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClientes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      {t('clients.table.empty')}
                    </td>
                  </tr>
                ) : (
                  filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{cliente.nombre}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {cliente.rut}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {cliente.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {cliente.telefono}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(cliente)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(cliente.id)}
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
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingCliente ? t('clients.edit') : t('clients.add')}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clients.form.name')} *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clients.form.rut')} *
                </label>
                <input
                  type="text"
                  value={formData.rut}
                  onChange={handleRutChange}
                  placeholder="12.345.678-9"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clients.form.email')} *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clients.form.phone')} *
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clients.form.address')} *
                </label>
                <textarea
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 btn-secondary"
                >
                  {t('clients.form.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  {editingCliente ? t('clients.form.update') : t('clients.form.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Clientes