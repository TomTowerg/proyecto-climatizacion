import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/react' 
import { GoogleOAuthProvider } from '@react-oauth/google'
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
import ChatAsistente from './components/ChatAsistente'
// YA NO IMPORTAMOS EL SELECTOR AQUÍ
import { isAuthenticated } from './services/authService'
import './index.css'

// Componente para rutas protegidas
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />
  }
  return children
}

// Componente para manejar el chatbot condicionalmente
function ConditionalChatbot() {
  const location = useLocation()
  const publicRoutes = ['/', '/register']
  
  if (publicRoutes.includes(location.pathname)) return null
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

          {/* ELIMINADO: <LanguageSelector /> ya no es global */}

          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
            <Route path="/equipos" element={<ProtectedRoute><Equipos /></ProtectedRoute>} />
            <Route path="/ordenes-trabajo" element={<ProtectedRoute><OrdenesTrabajo /></ProtectedRoute>} />
            <Route path="/inventario" element={<ProtectedRoute><Inventario /></ProtectedRoute>} />
            <Route path="/cotizaciones" element={<ProtectedRoute><Cotizaciones /></ProtectedRoute>} />
            <Route path="/calendario" element={<ProtectedRoute><CalendarioOT /></ProtectedRoute>} />
            <Route path="/stock-panel" element={<ProtectedRoute><StockPanel /></ProtectedRoute>} />

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