import { useState, useEffect } from 'react'
import { Plus, Trash2, MapPin, X, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getDireccionesCliente,
  createDireccionCliente,
  updateDireccionCliente,
  deleteDireccionCliente
} from '../services/direccionClienteService'

export default function DireccionesClienteModal({ cliente, onClose }) {
  const [direcciones, setDirecciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    comuna: '',
    ciudad: '',
    esPrincipal: false
  })

  useEffect(() => {
    fetchDirecciones()
  }, [])

  const fetchDirecciones = async () => {
    try {
      setLoading(true)
      const data = await getDireccionesCliente(cliente.id)
      setDirecciones(data)
    } catch (error) {
      console.error('Error cargando direcciones:', error)
      toast.error('Error al cargar direcciones')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (!formData.nombre || !formData.direccion) {
        toast.error('Nombre y dirección son obligatorios')
        return
      }

      await createDireccionCliente(cliente.id, formData)
      toast.success('Dirección agregada')
      
      setFormData({ nombre: '', direccion: '', comuna: '', ciudad: '', esPrincipal: false })
      setShowForm(false)
      fetchDirecciones()
    } catch (error) {
      console.error('Error guardando dirección:', error)
      toast.error('Error al guardar dirección')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta dirección?')) return

    try {
      await deleteDireccionCliente(cliente.id, id)
      toast.success('Dirección eliminada')
      fetchDirecciones()
    } catch (error) {
      console.error('Error eliminando dirección:', error)
      toast.error('Error al eliminar dirección')
    }
  }

  const handleSetPrincipal = async (dir) => {
    if (dir.esPrincipal) return
    try {
      await updateDireccionCliente(cliente.id, dir.id, { ...dir, esPrincipal: true })
      toast.success('Dirección principal actualizada')
      fetchDirecciones()
    } catch (error) {
      toast.error('Error al actualizar dirección principal')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="text-indigo-600" />
              Direcciones de {cliente.nombre}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Gesti&oacute;n de ubicaciones de instalaci&oacute;n</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 pr-2">
          {loading ? (
            <div className="flex justify-center p-8"><span className="animate-spin text-indigo-600">⌛</span></div>
          ) : direcciones.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
              <MapPin size={40} className="mx-auto text-gray-300 mb-3" />
              <p>Este cliente a&uacute;n no tiene direcciones registradas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {direcciones.map(dir => (
                <div key={dir.id} className={`p-4 rounded-xl border flex justify-between items-start transition-colors ${dir.esPrincipal ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:border-indigo-300'}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">{dir.nombre}</span>
                      {dir.esPrincipal && (
                        <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-indigo-100 text-indigo-700 rounded-full flex items-center gap-1">
                          <Star size={10} className="fill-indigo-600" /> Principal
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{dir.direccion}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {[dir.comuna, dir.ciudad].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!dir.esPrincipal && (
                      <button 
                        onClick={() => handleSetPrincipal(dir)}
                        className="text-xs px-2 py-1 text-indigo-600 hover:bg-indigo-100 rounded transition-colors"
                        title="Hacer Principal"
                      >
                        Hacer Principal
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(dir.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="mt-4 p-4 border border-indigo-200 bg-indigo-50/30 rounded-xl space-y-4">
              <h3 className="font-bold text-gray-800 text-sm">Nueva Direcci&oacute;n</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nombre Ej: Casa, Oficina *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={e => setFormData({...formData, nombre: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Comuna (Opcional)</label>
                  <input
                    type="text"
                    value={formData.comuna}
                    onChange={e => setFormData({...formData, comuna: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Direcci&oacute;n Completa *</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={e => setFormData({...formData, direccion: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="esPrincipal"
                    checked={formData.esPrincipal}
                    onChange={e => setFormData({...formData, esPrincipal: e.target.checked})}
                    className="rounded text-indigo-600 rounded"
                  />
                  <label htmlFor="esPrincipal" className="text-sm cursor-pointer text-gray-700">Esta es la direcci&oacute;n principal</label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg flex-1">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex-1">
                  Guardar
                </button>
              </div>
            </form>
          )}
        </div>

        {!showForm && (
          <div className="pt-4 border-t mt-auto">
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 bg-indigo-50 border-2 border-dashed border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-100 hover:border-indigo-300 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Agregar Direcci&oacute;n
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
