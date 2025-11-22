import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  // CAMBIO CLAVE: 'fixed top-4 right-4' asegura que siempre esté en la esquina
  // 'z-[9999]' asegura que flote sobre todo (incluso sobre el Navbar o modales)
  return (
    <div className="fixed top-4 right-4 z-[9999]">
      <div className="relative group">
        <button 
          type="button" 
          className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-2 rounded-full shadow-md border border-gray-200 hover:bg-gray-50 hover:scale-105 transition-all text-gray-700"
        >
          <Globe size={20} className="text-blue-600" />
          <span className="text-sm font-bold uppercase tracking-wide">{i18n.language}</span>
        </button>

        {/* Menú desplegable alineado a la derecha */}
        <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right">
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
      </div>
    </div>
  );
};

export default LanguageSelector;