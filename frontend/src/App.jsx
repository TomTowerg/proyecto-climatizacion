import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/react' 
import { GoogleOAuthProvider } from '@react-oauth/google'

// Pages - Admin System
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Equipos from './pages/Equipos'
import OrdenesTrabajo from './pages/OrdenesTrabajo'
import Inventario from './pages/Inventario'
import Cotizaciones from './pages/Cotizaciones'
import CalendarioOT from './pages/CalendarioOT'
import StockPanel from './pages/StockPanel'
import InventarioMateriales from './pages/InventarioMateriales'

// Landing Page - Public
import { LandingPage } from './landing/pages'

// Components
import ChatAsistente from './components/ChatAsistente'

import { isAuthenticated } from './services/authService'
import './index.css'

// Componente para rutas protegidas
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/admin" replace />
  }
  return children
}

// Componente para manejar el chatbot condicionalmente
function ConditionalChatbot() {
  const location = useLocation()
  // Rutas donde NO mostrar el chatbot
  const excludedRoutes = ['/', '/admin', '/register', '/landing']
  
  // No mostrar en landing ni páginas de auth
  if (excludedRoutes.some(route => location.pathname === route || location.pathname.startsWith('/landing'))) {
    return null
  }
  
  if (!isAuthenticated()) return null
  
  return <ChatAsistente />
}

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Router>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { background: '#363636', color: '#fff' },
              success: { duration: 3000, iconTheme: { primary: '#10B981', secondary: '#fff' } },
              error: { duration: 4000, iconTheme: { primary: '#EF4444', secondary: '#fff' } },
            }}
          />

          <Routes>
            {/* ========================================
                LANDING PAGE - PUBLIC (Página principal)
                ======================================== */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />

            {/* ========================================
                ADMIN SYSTEM - Authentication
                ======================================== */}
            <Route path="/admin" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ========================================
                ADMIN SYSTEM - Protected Routes
                ======================================== */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
            <Route path="/equipos" element={<ProtectedRoute><Equipos /></ProtectedRoute>} />
            <Route path="/ordenes-trabajo" element={<ProtectedRoute><OrdenesTrabajo /></ProtectedRoute>} />
            <Route path="/inventario" element={<ProtectedRoute><Inventario /></ProtectedRoute>} />
            <Route path="/inventario-materiales" element={<InventarioMateriales />} />
            <Route path="/cotizaciones" element={<ProtectedRoute><Cotizaciones /></ProtectedRoute>} />
            <Route path="/calendario" element={<ProtectedRoute><CalendarioOT /></ProtectedRoute>} />
            <Route path="/stock-panel" element={<ProtectedRoute><StockPanel /></ProtectedRoute>} />

            {/* Fallback - redirigir a landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <ConditionalChatbot />
          <Analytics />
        </div>
      </Router>
    </GoogleOAuthProvider>
  )
}

export default App
