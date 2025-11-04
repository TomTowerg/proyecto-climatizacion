import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Users, Wrench, ClipboardList, LayoutDashboard } from 'lucide-react'
import { logout } from '../services/authService'
import toast from 'react-hot-toast'

function Navbar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Sesión cerrada correctamente')
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-gray-800">
              Sistema de Climatización
            </h1>
            
            <div className="hidden md:flex space-x-4">
              <Link 
                to="/dashboard" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
              <Link 
                to="/clientes" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Users size={18} />
                Clientes
              </Link>
              <Link 
                to="/equipos" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Wrench size={18} />
                Equipos
              </Link>
              <Link 
                to="/ordenes-trabajo" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ClipboardList size={18} />
                Órdenes de Trabajo
              </Link>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar