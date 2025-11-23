import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Home, Users, Wind, ClipboardList, Package, FileText, Calendar, TrendingUp, LogOut, Menu, X 
} from 'lucide-react'
import { logout } from '../services/authService'
import LanguageSelector from './LanguageSelector' // <--- 1. IMPORTAR

function Navbar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

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
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <Wind className="text-blue-600" size={32} />
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              KMTS Powertech
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    isActive(item.path) ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Right Actions (Desktop) */}
          <div className="flex items-center gap-2">
            
            {/* ⭐ SELECTOR DE IDIOMA (PC) - Al lado de salir */}
            <div className="hidden md:block">
              <LanguageSelector />
            </div>

            {/* Logout Button (Desktop) */}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
              title={t('nav.logout')}
            >
              <LogOut size={20} />
              <span className="text-sm font-medium">{t('nav.logout')}</span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-1 px-2 pb-3">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path) ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
            
            {/* Footer del Menú Móvil */}
            <div className="border-t border-gray-100 pt-4 pb-2 px-4">
              <div className="flex items-center justify-between">
                {/* ⭐ SELECTOR DE IDIOMA (Móvil) */}
                <LanguageSelector />
                
                {/* Botón Salir (Móvil) */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={20} />
                  <span className="font-medium">{t('nav.logout')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar