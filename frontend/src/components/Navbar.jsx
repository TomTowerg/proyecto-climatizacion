import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next' // 1. IMPORTAR ESTO
import { 
  Home, 
  Users, 
  Wind, 
  ClipboardList, 
  Package, 
  FileText, 
  Calendar,
  TrendingUp,
  LogOut, 
  Menu, 
  X 
} from 'lucide-react'
import { logout } from '../services/authService'

function Navbar() {
  const { t } = useTranslation() // 2. INICIALIZAR HOOK
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  // 3. USAR t() EN LAS ETIQUETAS
  const navItems = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: Home },
    { path: '/clientes', label: t('nav.clients'), icon: Users },
    { path: '/equipos', label: t('nav.equipment'), icon: Wind },
    { path: '/ordenes-trabajo', label: t('nav.workOrders'), icon: ClipboardList },
    { path: '/inventario', label: t('nav.inventory'), icon: Package },
    { path: '/cotizaciones', label: t('nav.quotes'), icon: FileText },
    { path: '/calendario', label: t('nav.calendar'), icon: Calendar },
    { path: '/stock-panel', label: t('nav.stockPanel'), icon: TrendingUp },
  ]

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <Wind className="text-blue-600" size={32} />
            <span className="text-xl font-bold text-gray-900">
              KMTS Powertech
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Logout Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">{t('nav.logout')}</span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar