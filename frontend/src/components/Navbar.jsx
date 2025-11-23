import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Home, Users, Wind, ClipboardList, Package, FileText, Calendar, TrendingUp, 
  LogOut, Menu, X, MoreVertical, Globe, Check
} from 'lucide-react'
import { logout } from '../services/authService'
// Ya no necesitamos importar LanguageSelector aquí para el desktop, 
// implementaremos la lógica integrada para que quede mejor en el menú.
import LanguageSelector from './LanguageSelector' 

function Navbar() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Estados para los menús
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false)
  
  // Ref para cerrar el menú al hacer clic fuera
  const desktopMenuRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('language', lng)
    setDesktopMenuOpen(false) // Cerrar menú al seleccionar
  }

  const isActive = (path) => location.pathname === path

  // Cerrar menú desktop si hago clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target)) {
        setDesktopMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

          {/* Desktop Navigation (Links Centrales) */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar mx-4">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
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

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            
            {/* ⭐ MENÚ DESKTOP (3 PUNTITOS) */}
            <div className="hidden md:block relative" ref={desktopMenuRef}>
              <button
                onClick={() => setDesktopMenuOpen(!desktopMenuOpen)}
                className={`p-2 rounded-full transition-colors ${
                  desktopMenuOpen ? 'bg-gray-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
                }`}
                title="Menú de usuario"
              >
                <MoreVertical size={24} />
              </button>

              {/* Dropdown del Menú Desktop */}
              {desktopMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 ring-1 ring-black ring-opacity-5 transform origin-top-right animate-fade-in-up">
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Idioma / Language
                    </div>
                    
                    <button
                      onClick={() => changeLanguage('es')}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                        i18n.language === 'es' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>🇪🇸</span> Español
                      </div>
                      {i18n.language === 'es' && <Check size={16} />}
                    </button>

                    <button
                      onClick={() => changeLanguage('en')}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                        i18n.language === 'en' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>🇺🇸</span> English
                      </div>
                      {i18n.language === 'en' && <Check size={16} />}
                    </button>

                    <div className="h-px bg-gray-100 my-2"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut size={18} />
                      {t('nav.logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu toggle button */}
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
            </div>

            {/* Footer del Menú Móvil */}
            <div className="border-t border-gray-100 pt-4 pb-2 px-4">
              <div className="flex items-center justify-between">
                {/* Usamos el componente LanguageSelector existente para móvil que ya funcionaba bien */}
                <LanguageSelector />
                
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