import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Importar hook

const EconomicIndicators = () => {
  const { t } = useTranslation(); // Inicializar hook
  const [indicators, setIndicators] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/indicators`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Error fetch');
        
        const data = await response.json();
        setIndicators(data);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchIndicators();
  }, []);

  if (loading) return <div className="animate-pulse h-20 bg-gray-100 rounded-xl mb-6"></div>;
  if (error || !indicators) return null;

  const formatMoney = (value) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Dólar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md hover:border-green-200 transition-all duration-300 flex items-center justify-between group">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            {t('dashboard.indicators.dollar')}
          </p>
          <p className="text-lg font-bold text-gray-900">{formatMoney(indicators.dolar.valor)}</p>
        </div>
        <div className="w-10 h-10 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <DollarSign className="text-green-600 w-5 h-5" />
        </div>
      </div>

      {/* UF */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-300 flex items-center justify-between group">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            {t('dashboard.indicators.uf')}
          </p>
          <p className="text-lg font-bold text-gray-900">{formatMoney(indicators.uf.valor)}</p>
        </div>
        <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <TrendingUp className="text-blue-600 w-5 h-5" />
        </div>
      </div>

      {/* Euro */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all duration-300 flex items-center justify-between group">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            {t('dashboard.indicators.euro')}
          </p>
          <p className="text-lg font-bold text-gray-900">{formatMoney(indicators.euro.valor)}</p>
        </div>
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Coins className="text-indigo-600 w-5 h-5" />
        </div>
      </div>

      {/* UTM */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all duration-300 flex items-center justify-between group">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            {t('dashboard.indicators.utm')}
          </p>
          <p className="text-lg font-bold text-gray-900">{formatMoney(indicators.utm.valor)}</p>
        </div>
        <div className="w-10 h-10 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Calendar className="text-purple-600 w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default EconomicIndicators;