import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Minimize2, Bot } from 'lucide-react'
import { chat } from '../services/iaService'
import toast from 'react-hot-toast'

function ChatAsistente() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [historial])

  useEffect(() => {
    // Cargar historial del localStorage
    const historialGuardado = localStorage.getItem('chat-historial')
    if (historialGuardado) {
      try {
        setHistorial(JSON.parse(historialGuardado))
      } catch (e) {
        console.error('Error al cargar historial:', e)
      }
    }
  }, [])

  useEffect(() => {
    // Guardar historial en localStorage
    if (historial.length > 0) {
      localStorage.setItem('chat-historial', JSON.stringify(historial))
    }
  }, [historial])

  const handleEnviar = async (e) => {
    e.preventDefault()
    
    if (!mensaje.trim()) return

    const mensajeUsuario = mensaje.trim()
    setMensaje('')

    // Agregar mensaje del usuario al historial
    const nuevoHistorial = [
      ...historial,
      { role: 'user', content: mensajeUsuario, timestamp: new Date().toISOString() }
    ]
    setHistorial(nuevoHistorial)

    setCargando(true)
    try {
      const response = await chat(mensajeUsuario, nuevoHistorial)
      
      // Agregar respuesta de la IA al historial
      setHistorial([
        ...nuevoHistorial,
        { role: 'assistant', content: response.respuesta, timestamp: new Date().toISOString() }
      ])
    } catch (error) {
      console.error('Error en chat:', error)
      toast.error('Error al comunicarse con CLIMB-BOT')
      
      // Agregar mensaje de error
      setHistorial([
        ...nuevoHistorial,
        { 
          role: 'assistant', 
          content: 'Lo siento, tuve un problema al procesar tu mensaje. Por favor, intenta de nuevo.', 
          timestamp: new Date().toISOString() 
        }
      ])
    } finally {
      setCargando(false)
    }
  }

  const handleLimpiarChat = () => {
    if (window.confirm('¿Limpiar todo el historial de chat?')) {
      setHistorial([])
      localStorage.removeItem('chat-historial')
      toast.success('Historial limpiado')
    }
  }

  const handleToggle = () => {
    if (isOpen && !isMinimized) {
      setIsOpen(false)
    } else if (isOpen && isMinimized) {
      setIsMinimized(false)
    } else {
      setIsOpen(true)
      setIsMinimized(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 hover:scale-110"
        title="Abrir CLIMB-BOT"
      >
        <MessageCircle size={28} />
      </button>
    )
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
        >
          <Bot size={20} />
          <span className="font-semibold">CLIMB-BOT</span>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <Bot className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">CLIMB-BOT</h3>
            <p className="text-xs text-blue-100">Asistente de Climatización</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="hover:bg-white/20 p-2 rounded-lg transition-colors"
            title="Minimizar"
          >
            <Minimize2 size={18} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 p-2 rounded-lg transition-colors"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {historial.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mb-4">
              <Bot className="text-blue-600" size={40} />
            </div>
            <h4 className="font-bold text-gray-800 mb-2">¡Hola! Soy CLIMB-BOT</h4>
            <p className="text-sm text-gray-600 mb-4">
              Tu asistente experto en climatización. ¿En qué puedo ayudarte?
            </p>
            <div className="mt-4 space-y-2 w-full">
              <button
                onClick={() => setMensaje('Mi aire acondicionado no enfría')}
                className="w-full text-left text-sm bg-white hover:bg-gray-50 p-3 rounded-lg border border-gray-200 transition-colors"
              >
                ❄️ Mi aire acondicionado no enfría
              </button>
              <button
                onClick={() => setMensaje('¿Cada cuánto debo hacer mantenimiento?')}
                className="w-full text-left text-sm bg-white hover:bg-gray-50 p-3 rounded-lg border border-gray-200 transition-colors"
              >
                🔧 ¿Cada cuánto debo hacer mantenimiento?
              </button>
              <button
                onClick={() => setMensaje('¿Qué tipo de gas usa mi equipo?')}
                className="w-full text-left text-sm bg-white hover:bg-gray-50 p-3 rounded-lg border border-gray-200 transition-colors"
              >
                🌡️ ¿Qué tipo de gas usa mi equipo?
              </button>
            </div>
          </div>
        ) : (
          <>
            {historial.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1 ${
                    msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString('es-CL', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            {cargando && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
        {historial.length > 0 && (
          <button
            onClick={handleLimpiarChat}
            className="text-xs text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
          >
            <X size={12} />
            Limpiar chat
          </button>
        )}
        <form onSubmit={handleEnviar} className="flex gap-2">
          <input
            type="text"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Escribe tu pregunta..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={cargando}
          />
          <button
            type="submit"
            disabled={cargando || !mensaje.trim()}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-2 rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatAsistente