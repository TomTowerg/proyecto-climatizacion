import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Wind, 
  Gauge, 
  Leaf, 
  Ruler,
  Package,
  Loader2,
  AlertCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Remover /api del final si existe para evitar duplicación
const getBaseUrl = () => {
  let url = API_URL;
  if (url.endsWith('/api')) {
    url = url.slice(0, -4);
  }
  return url;
};

const EquipmentCatalog = () => {
  const { t } = useTranslation();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('todos');
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/inventario/public`);
      
      if (!response.ok) {
        throw new Error('Error al cargar equipos');
      }
      
      const data = await response.json();
      setEquipment(data);
    } catch (err) {
      console.error('Error fetching equipment:', err);
      setError(err.message);
      // Cargar datos de ejemplo si falla la API
      setEquipment(sampleEquipment);
    } finally {
      setLoading(false);
    }
  };

  // Datos de ejemplo por si la API no está disponible
  const sampleEquipment = [
    {
      id: 1,
      tipo: 'Split',
      marca: 'Samsung',
      modelo: 'Wind-Free AR12',
      capacidad: '12000 BTU',
      tipoGas: 'R-410A',
      metrosCuadrados: '20-25 m²',
      precioCliente: 599990,
      stock: 5,
      estado: 'disponible'
    },
    {
      id: 2,
      tipo: 'Split',
      marca: 'LG',
      modelo: 'Dual Inverter S4-Q18',
      capacidad: '18000 BTU',
      tipoGas: 'R-32',
      metrosCuadrados: '25-35 m²',
      precioCliente: 749990,
      stock: 3,
      estado: 'disponible'
    },
    {
      id: 3,
      tipo: 'Split',
      marca: 'Midea',
      modelo: 'Xtreme Save',
      capacidad: '9000 BTU',
      tipoGas: 'R-410A',
      metrosCuadrados: '15-20 m²',
      precioCliente: 449990,
      stock: 8,
      estado: 'disponible'
    },
    {
      id: 4,
      tipo: 'Cassette',
      marca: 'Daikin',
      modelo: 'Ceiling FFQ35',
      capacidad: '24000 BTU',
      tipoGas: 'R-32',
      metrosCuadrados: '35-45 m²',
      precioCliente: 1299990,
      stock: 2,
      estado: 'disponible'
    },
    {
      id: 5,
      tipo: 'Split',
      marca: 'Carrier',
      modelo: 'XPower Inverter',
      capacidad: '12000 BTU',
      tipoGas: 'R-32',
      metrosCuadrados: '20-25 m²',
      precioCliente: 579990,
      stock: 4,
      estado: 'disponible'
    },
    {
      id: 6,
      tipo: 'Portátil',
      marca: 'Electrolux',
      modelo: 'PO12F',
      capacidad: '12000 BTU',
      tipoGas: 'R-410A',
      metrosCuadrados: '15-25 m²',
      precioCliente: 399990,
      stock: 6,
      estado: 'disponible'
    },
  ];

  // Obtener tipos únicos para filtros
  const types = ['todos', ...new Set(equipment.map(e => e.tipo))];

  // Filtrar equipos
  const filteredEquipment = activeFilter === 'todos' 
    ? equipment 
    : equipment.filter(e => e.tipo === activeFilter);

  // Equipos visibles
  const visibleEquipment = filteredEquipment.slice(0, visibleCount);

  // Debug - remover después
  console.log('Equipment loaded:', equipment.length, 'items');
  console.log('Filtered:', filteredEquipment.length, 'Visible:', visibleEquipment.length);

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const scrollToContact = () => {
    const element = document.getElementById('contacto');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="equipos" className="catalog-section">
      <div className="landing-container">
        <div className="section-header animate-on-scroll">
          <span className="section-label">
            <Package size={16} />
            {t('landing.catalog.label', 'Catálogo de Equipos')}
          </span>
          <h2 className="section-title">
            {t('landing.catalog.title', 'Equipos de Alta Eficiencia')}
          </h2>
          <p className="section-description">
            {t('landing.catalog.description', 'Descubre nuestra selección de aires acondicionados de las mejores marcas, con tecnología inverter y máxima eficiencia energética.')}
          </p>
        </div>

        {/* Filters */}
        <div className="catalog-filters animate-on-scroll">
          {types.map((type) => (
            <button
              key={type}
              className={`filter-btn ${activeFilter === type ? 'active' : ''}`}
              onClick={() => {
                setActiveFilter(type);
                setVisibleCount(6);
              }}
            >
              {type === 'todos' ? t('landing.catalog.filterAll', 'Todos') : type}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-sky-500" size={48} />
          </div>
        )}

        {/* Error state */}
        {error && !loading && equipment.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="text-amber-500 mb-4" size={48} />
            <p className="text-gray-400">{t('landing.catalog.error', 'Mostrando catálogo de ejemplo')}</p>
          </div>
        )}

        {/* Equipment Grid */}
        {!loading && (
          <div className="equipment-grid">
            {visibleEquipment.map((item, index) => (
              <div key={item.id} className="equipment-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="equipment-image">
                  {item.stock > 0 && (
                    <span className="equipment-badge">
                      {t('landing.catalog.inStock', 'En Stock')}
                    </span>
                  )}
                  {/* Placeholder SVG para imagen del equipo */}
                  <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '70%', height: 'auto' }}>
                    <rect x="10" y="30" width="180" height="70" rx="8" fill="#e2e8f0" />
                    <rect x="15" y="35" width="170" height="55" rx="5" fill="#f1f5f9" />
                    {[0, 1, 2, 3, 4].map(i => (
                      <rect key={i} x="25" y={42 + i * 9} width="150" height="5" rx="2" fill="#94a3b8" opacity="0.5" />
                    ))}
                    <circle cx="165" cy="45" r="6" fill="#0ea5e9" opacity="0.8" />
                    <path d="M30 105 Q50 115 30 125 M60 105 Q80 118 60 130 M90 105 Q110 115 90 125" 
                          stroke="#7dd3fc" strokeWidth="2" fill="none" opacity="0.6" />
                  </svg>
                </div>
                
                <div className="equipment-content">
                  <div className="equipment-brand">{item.marca}</div>
                  <h3 className="equipment-model">{item.modelo}</h3>
                  
                  <div className="equipment-specs">
                    <div className="equipment-spec">
                      <Gauge size={16} />
                      <span>{item.capacidad || item.capacidadBTU}</span>
                    </div>
                    <div className="equipment-spec">
                      <Leaf size={16} />
                      <span>{item.tipoGas}</span>
                    </div>
                    <div className="equipment-spec">
                      <Wind size={16} />
                      <span>{item.tipo}</span>
                    </div>
                    <div className="equipment-spec">
                      <Ruler size={16} />
                      <span>{item.metrosCuadrados || 'Consultar'}</span>
                    </div>
                  </div>

                  <div className="equipment-price">
                    <div>
                      <div className="equipment-price-value">
                        {formatPrice(item.precioCliente || item.precioClienteIVA)}
                      </div>
                      <div className="equipment-price-label">{t('landing.catalog.priceLabel', 'IVA incluido')}</div>
                    </div>
                    <button className="equipment-cta" onClick={scrollToContact}>
                      {t('landing.catalog.cta', 'Cotizar')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {visibleCount < filteredEquipment.length && (
          <div className="catalog-load-more">
            <button 
              className="hero-cta-secondary"
              onClick={() => setVisibleCount(prev => prev + 6)}
            >
              {t('landing.catalog.loadMore', 'Ver más equipos')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default EquipmentCatalog;
