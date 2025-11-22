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

  if (loading) return <div className="animate-pulse h-24 bg-gray-100 rounded-lg mb-6"></div>;
  if (error || !indicators) return null;

  const formatMoney = (value) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Dólar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          {/* USAMOS t() AQUÍ */}
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            {t('dashboard.indicators.dollar')}
          </p>
          <p className="text-xl font-bold text-green-600">{formatMoney(indicators.dolar.valor)}</p>
        </div>
        <div className="bg-green-50 p-2 rounded-full">
          <DollarSign className="text-green-600 w-5 h-5" />
        </div>
      </div>

      {/* UF */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          {/* USAMOS t() AQUÍ */}
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            {t('dashboard.indicators.uf')}
          </p>
          <p className="text-xl font-bold text-blue-600">{formatMoney(indicators.uf.valor)}</p>
        </div>
        <div className="bg-blue-50 p-2 rounded-full">
          <TrendingUp className="text-blue-600 w-5 h-5" />
        </div>
      </div>

      {/* Euro */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          {/* USAMOS t() AQUÍ */}
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            {t('dashboard.indicators.euro')}
          </p>
          <p className="text-xl font-bold text-indigo-600">{formatMoney(indicators.euro.valor)}</p>
        </div>
        <div className="bg-indigo-50 p-2 rounded-full">
          <Coins className="text-indigo-600 w-5 h-5" />
        </div>
      </div>

      {/* UTM */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          {/* USAMOS t() AQUÍ */}
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            {t('dashboard.indicators.utm')}
          </p>
          <p className="text-xl font-bold text-purple-600">{formatMoney(indicators.utm.valor)}</p>
        </div>
        <div className="bg-purple-50 p-2 rounded-full">
          <Calendar className="text-purple-600 w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default EconomicIndicators;