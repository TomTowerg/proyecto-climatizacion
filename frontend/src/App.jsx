import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/react' 
import { GoogleOAuthProvider } from '@react-oauth/google'  // ⭐ AGREGADO
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
  
  // Lista de rutas donde NO debe aparecer el chatbot
  const publicRoutes = ['/', '/register']
  
  // No mostrar chatbot en rutas públicas
  if (publicRoutes.includes(location.pathname)) {
    return null
  }
  
  // Solo mostrar si está autenticado Y no está en ruta pública
  if (!isAuthenticated()) {
    return null
  }
  
  return <ChatAsistente />
}

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>  {/* ⭐ AGREGADO */}
      <Router>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />

          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Rutas Protegidas */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes"
              element={
                <ProtectedRoute>
                  <Clientes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/equipos"
              element={
                <ProtectedRoute>
                  <Equipos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ordenes-trabajo"
              element={
                <ProtectedRoute>
                  <OrdenesTrabajo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventario"
              element={
                <ProtectedRoute>
                  <Inventario />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cotizaciones"
              element={
                <ProtectedRoute>
                  <Cotizaciones />
                </ProtectedRoute>
              }
            />
            
            {/*  NUEVAS RUTAS - FASE 2 */}
            <Route
              path="/calendario"
              element={
                <ProtectedRoute>
                  <CalendarioOT />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock-panel"
              element={
                <ProtectedRoute>
                  <StockPanel />
                </ProtectedRoute>
              }
            />

            {/* Ruta por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* CHATBOT ASISTENTE - Solo en rutas autenticadas, excluye login/register */}
          <ConditionalChatbot />

          {/* ANALYTICS - AGREGADO */}
          <Analytics />
        </div>
      </Router>
    </GoogleOAuthProvider>
  )
}

export default App
