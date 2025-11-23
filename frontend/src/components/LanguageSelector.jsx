import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, GripVertical } from 'lucide-react';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Posición inicial: Intentamos leer de localStorage, si no, esquina inferior derecha (para no tapar el menú)
  const [position, setPosition] = useState(() => {
    const savedPos = localStorage.getItem('langSelectorPos');
    return savedPos 
      ? JSON.parse(savedPos) 
      : { x: window.innerWidth - 140, y: window.innerHeight - 100 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false); // Para distinguir click de arrastre

  // Guardar posición al soltar
  useEffect(() => {
    localStorage.setItem('langSelectorPos', JSON.stringify(position));
  }, [position]);

  // Manejadores de eventos para Mouse (PC)
  const handleMouseDown = (e) => {
    setIsDragging(true);
    hasMoved.current = false;
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  // Manejadores de eventos para Touch (Móvil)
  const handleTouchStart = (e) => {
    setIsDragging(true);
    hasMoved.current = false;
    const touch = e.touches[0];
    offset.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    };
  };

  // Efecto global para mover el elemento (funciona mejor que onMouseMove en el div)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault(); // Evitar selección de texto
      hasMoved.current = true;
      
      let newX = e.clientX - offset.current.x;
      let newY = e.clientY - offset.current.y;

      // Límites de la pantalla para que no se salga
      const maxX = window.innerWidth - 100; // Ancho aprox del botón
      const maxY = window.innerHeight - 50;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      // e.preventDefault(); // Comentado para permitir scroll si no se agarra bien, pero idealmente activado.
      hasMoved.current = true;
      const touch = e.touches[0];
      
      let newX = touch.clientX - offset.current.x;
      let newY = touch.clientY - offset.current.y;

      setPosition({
        x: newX,
        y: newY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    setIsOpen(false);
  };

  const toggleMenu = () => {
    // Solo abrir si NO se movió (es un click puro)
    if (!hasMoved.current) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div 
      ref={dragRef}
      style={{ 
        position: 'fixed', 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        zIndex: 9999,
        touchAction: 'none' // Crucial para móviles: evita que el navegador haga scroll al arrastrar esto
      }}
      className="transition-shadow duration-200"
    >
      <div className="relative">
        {/* Botón Principal */}
        <button 
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={toggleMenu}
          className={`flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-2 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-all text-gray-700 cursor-move active:scale-95 active:shadow-xl ${isDragging ? 'ring-2 ring-blue-400' : ''}`}
          title="Arrastra para mover / Click para abrir"
        >
          {/* Icono de 'grip' para indicar que se puede mover */}
          <GripVertical size={14} className="text-gray-400" />
          
          <Globe size={20} className="text-blue-600" />
          <span className="text-sm font-bold uppercase tracking-wide select-none">
            {i18n.language}
          </span>
        </button>

        {/* Menú desplegable */}
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-36 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in-up">
            <div className="py-1">
              <button
                type="button"
                onClick={() => changeLanguage('es')}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 flex items-center gap-3 transition-colors ${
                  i18n.language === 'es' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-gray-600'
                }`}
              >
                <span className="text-lg">🇪🇸</span> Español
              </button>
              <button
                type="button"
                onClick={() => changeLanguage('en')}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 flex items-center gap-3 transition-colors ${
                  i18n.language === 'en' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-gray-600'
                }`}
              >
                <span className="text-lg">🇺🇸</span> English
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageSelector;