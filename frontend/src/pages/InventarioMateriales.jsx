import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, Search, Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { isAuthenticated } from '../services/authService'
import {
  getMateriales,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  ajustarStock,
  getEstadisticas
} from '../services/materialInventarioService'

const CATEGORIAS = [
  'Cañerías',
  'Soportes y Fijaciones',
  'Cables Eléctricos',
  'Gas Refrigerante',
  'Aislantes',
  'Accesorios de Montaje',
  'Herramientas Consumibles',
  'Otros'
]

const UNIDADES = [
  'metros',
  'unidades',
  'kilogramos',
  'litros',
  'cajas',
  'rollos',
  'pares'
]

function InventarioMateriales() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [materiales, setMateriales] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [showStockModal, setShowStockModal] = useState(false)
  const [materialStock, setMaterialStock] = useState(null)
  const [estadisticas, setEstadisticas] = useState(null)
  
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    unidad: '',
    precioNeto: '',
    precioConIVA: '',
    stock: 0,
    stockMinimo: 5,
    proveedor: '',
    codigoProducto: '',
    descripcion: ''
  })

  const [stockForm, setStockForm] = useState({
    cantidad: '',
    tipo: 'aumentar',
    motivo: ''
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/')
      return
    }
    fetchData()
  }, [navigate])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [materialesData, stats] = await Promise.all([
        getMateriales(),
        getEstadisticas()
      ])
      setMateriales(materialesData)
      setEstadisticas(stats)
    } catch (error) {
      console.error('Error al cargar materiales:', error)
      toast.error('Error al cargar materiales')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const dataToSend = {
        ...formData,
        precioNeto: parseFloat(formData.precioNeto),
        precioConIVA: formData.precioConIVA ? parseFloat(formData.precioConIVA) : parseFloat(formData.precioNeto) * 1.19,
        stock: parseInt(formData.stock),
        stockMinimo: parseInt(formData.stockMinimo)
      }

      if (editingMaterial) {
        await updateMaterial(editingMaterial.id, dataToSend)
        toast.success('Material actualizado exitosamente')
      } else {
        await createMaterial(dataToSend)
        toast.success('Material creado exitosamente')
      }
      
      fetchData()
      handleCloseModal()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.response?.data?.error || 'Error al guardar material')
    }
  }

  const handleEdit = (material) => {
    setEditingMaterial(material)
    setFormData({
      nombre: material.nombre,
      categoria: material.categoria,
      unidad: material.unidad,
      precioNeto: material.precioNeto,
      precioConIVA: material.precioConIVA,
      stock: material.stock,
      stockMinimo: material.stockMinimo,
      proveedor: material.proveedor || '',
      codigoProducto: material.codigoProducto || '',
      descripcion: material.descripcion || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este material?')) {
      return
    }

    try {
      await deleteMaterial(id)
      toast.success('Material eliminado exitosamente')
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.response?.data?.error || 'Error al eliminar material')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingMaterial(null)
    setFormData({
      nombre: '',
      categoria: '',
      unidad: '',
      precioNeto: '',
      precioConIVA: '',
      stock: 0,
      stockMinimo: 5,
      proveedor: '',
      codigoProducto: '',
      descripcion: ''
    })
  }

  const handleOpenStockModal = (material) => {
    setMaterialStock(material)
    setStockForm({
      cantidad: '',
      tipo: 'aumentar',
      motivo: ''
    })
    setShowStockModal(true)
  }

  const handleAjustarStock = async (e) => {
    e.preventDefault()

    try {
      await ajustarStock(
        materialStock.id,
        parseInt(stockForm.cantidad),
        stockForm.tipo,
        stockForm.motivo
      )
      
      toast.success(`Stock ${stockForm.tipo === 'aumentar' ? 'aumentado' : 'disminuido'} exitosamente`)
      fetchData()
      setShowStockModal(false)
      setMaterialStock(null)
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.response?.data?.error || 'Error al ajustar stock')
    }
  }

    const handlePrecioNetoChange = (value) => {
    const neto = value ? parseFloat(value) : 0
    setFormData({
      ...formData,
      precioNeto: value,
      precioConIVA: neto > 0 ? (neto * 1.19).toFixed(2) : ''
    })
  }

  const handlePrecioConIVAChange = (value) => {
    const conIVA = value ? parseFloat(value) : 0
    setFormData({
      ...formData,
      precioConIVA: value,
      precioNeto: conIVA > 0 ? (conIVA / 1.19).toFixed(2) : ''
    })
  }

  

  const getCategoriaColor = (categoria) => {
    const colores = {
      'Cañerías': 'bg-blue-100 text-blue-800',
      'Soportes y Fijaciones': 'bg-purple-100 text-purple-800',
      'Cables Eléctricos': 'bg-yellow-100 text-yellow-800',
      'Gas Refrigerante': 'bg-green-100 text-green-800',
      'Aislantes': 'bg-pink-100 text-pink-800',
      'Accesorios de Montaje': 'bg-indigo-100 text-indigo-800',
      'Herramientas Consumibles': 'bg-orange-100 text-orange-800',
      'Otros': 'bg-gray-100 text-gray-800'
    }
    return colores[categoria] || 'bg-gray-100 text-gray-800'
  }

  const getStockBadge = (material) => {
    if (material.stock === 0) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Sin stock</span>
    }
    if (material.stock <= material.stockMinimo) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Stock bajo</span>
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Disponible</span>
  }

  const filteredMateriales = materiales.filter(material =>
    material.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.proveedor?.toLowerCase().includes(searchTerm.toLowerCase())
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
            📦 Inventario de Materiales
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 btn-primary"
          >
            <Plus size={20} />
            Agregar Material
          </button>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Materiales</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.activos}</p>
                </div>
                <Package className="text-blue-500" size={32} />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stock Bajo</p>
                  <p className="text-2xl font-bold text-yellow-600">{estadisticas.stockBajo}</p>
                </div>
                <AlertTriangle className="text-yellow-500" size={32} />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sin Stock</p>
                  <p className="text-2xl font-bold text-red-600">{estadisticas.sinStock}</p>
                </div>
                <AlertTriangle className="text-red-500" size={32} />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${estadisticas.valorTotal.toLocaleString('es-CL')}
                  </p>
                </div>
                <Package className="text-green-500" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Buscador */}
        <div className="card mb-6">
          <div className="flex items-center gap-2">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Buscar material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border-0 focus:ring-0 outline-none"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMateriales.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No hay materiales registrados
                    </td>
                  </tr>
                ) : (
                  filteredMateriales.map((material) => (
                    <tr key={material.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{material.nombre}</div>
                        {material.codigoProducto && (
                          <div className="text-sm text-gray-500">Código: {material.codigoProducto}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoriaColor(material.categoria)}`}>
                          {material.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{material.stock} {material.unidad}</span>
                          {getStockBadge(material)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 font-medium">
                          ${material.precioConIVA.toLocaleString('es-CL')}
                        </div>
                        <div className="text-sm text-gray-500">
                          Neto: ${material.precioNeto.toLocaleString('es-CL')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {material.proveedor || '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenStockModal(material)}
                            className="text-purple-600 hover:text-purple-900 hover:bg-purple-50 p-2 rounded-full"
                            title="Ajustar stock"
                          >
                            <Package size={18} />
                          </button>
                          
                          <button
                            onClick={() => handleEdit(material)}
                            className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-2 rounded-full"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>

                          <button
                            onClick={() => handleDelete(material.id)}
                            className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded-full"
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

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingMaterial ? 'Editar Material' : 'Agregar Material'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {CATEGORIAS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad *
                  </label>
                  <select
                    value={formData.unidad}
                    onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {UNIDADES.map(unidad => (
                      <option key={unidad} value={unidad}>{unidad}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Neto *
                  </label>
                  <input
                    type="number"
                    value={formData.precioNeto}
                    onChange={(e) => handlePrecioNetoChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio con IVA
                  </label>
                  <input
                    type="number"
                    value={formData.precioConIVA}
                    onChange={(e) => handlePrecioConIVAChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Ingresa el precio neto o con IVA; el sistema calculará automáticamente el otro valor.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    value={formData.stockMinimo}
                    onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={formData.proveedor}
                    onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código de Producto
                  </label>
                  <input
                    type="text"
                    value={formData.codigoProducto}
                    onChange={(e) => setFormData({ ...formData, codigoProducto: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
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
                  {editingMaterial ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajustar Stock */}
      {showStockModal && materialStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              Ajustar Stock
            </h2>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{materialStock.nombre}</p>
              <p className="text-sm text-gray-600">Stock actual: {materialStock.stock} {materialStock.unidad}</p>
            </div>

            <form onSubmit={handleAjustarStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Ajuste
                </label>
                <select
                  value={stockForm.tipo}
                  onChange={(e) => setStockForm({ ...stockForm, tipo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="aumentar">➕ Aumentar Stock</option>
                  <option value="disminuir">➖ Disminuir Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  value={stockForm.cantidad}
                  onChange={(e) => setStockForm({ ...stockForm, cantidad: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo
                </label>
                <input
                  type="text"
                  value={stockForm.motivo}
                  onChange={(e) => setStockForm({ ...stockForm, motivo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ej: Compra, Uso en instalación, Ajuste de inventario..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowStockModal(false)
                    setMaterialStock(null)
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Ajustar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventarioMateriales
