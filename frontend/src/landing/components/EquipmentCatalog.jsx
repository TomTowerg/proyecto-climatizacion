import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Wind, 
  Gauge, 
  Leaf, 
  Ruler,
  Package,
  Loader2,
  AlertCircle,
  Eye,
  X,
  ChevronLeft,
  ChevronRight
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

// Mapeo de imágenes de equipos disponibles (arrays para múltiples imágenes)
const equipmentImages = {
  // ANWO
  'anwo-ventana-9000': ['/equipos/anwo-ventana-9000.png'],
  'anwo-split-9000': ['/equipos/anwo-split-9000.png'],
  'anwo-split-12000': ['/equipos/anwo-split-12000.png'],
  'anwo-split-18000': ['/equipos/anwo-split-18000.png'],
  'anwo-split-24000': ['/equipos/anwo-split-24000.png'],
  // Clark
  'clark-split-9000': ['/equipos/clark-split-9000.png'],
  'clark-split-12000': ['/equipos/clark-split-12000.png'],
  'clark-split-18000': ['/equipos/clark-split-18000.png'],
  'clark-split-24000': ['/equipos/clark-split-24000.png'],
  'clark-split-36000': ['/equipos/clark-split-36000.png'],
  // Hisense
  'hisense-split-9000': ['/equipos/hisense-split-9000.png'],
  'hisense-split-12000': ['/equipos/hisense-split-12000.png'],
  'hisense-split-18000': ['/equipos/hisense-split-18000.png'],
  'hisense-split-22000': ['/equipos/hisense-split-22000.png'],
  // Kendal
  'kendal-split-9000': ['/equipos/kendal-split-9000.png'],
  'kendal-split-12000': ['/equipos/kendal-split-12000.png'],
  'kendal-split-18000': ['/equipos/kendal-split-18000.png'],
  'kendal-split-24000': ['/equipos/kendal-split-24000.png'],
  // Samsung
  'samsung-split-9000': ['/equipos/samsung-split-9000.png'],
  'samsung-split-12000': ['/equipos/samsung-split-12000.png'],
  'samsung-split-18000': ['/equipos/samsung-split-18000.png'],
  'samsung-split-24000': ['/equipos/samsung-split-24000.png'],
  // Vesta
  'vesta-split-9000': ['/equipos/vesta-split-9000.png'],
  'vesta-split-12000': ['/equipos/vesta-split-12000.png'],
  'vesta-split-18000': ['/equipos/vesta-split-18000.png'],
  'vesta-split-24000': ['/equipos/vesta-split-24000.png'],
};

// Función para obtener las imágenes del equipo (retorna array)
const getEquipmentImages = (item) => {
  const marca = (item.marca || '').toLowerCase().trim();
  const tipo = (item.tipo || 'split').toLowerCase();
  const btu = parseInt(item.capacidadBTU) || parseInt(item.capacidad) || 0;
  
  let tipoKey = 'split';
  if (tipo.includes('ventana')) {
    tipoKey = 'ventana';
  } else if (tipo.includes('cassette')) {
    tipoKey = 'cassette';
  }
  
  const imageKey = `${marca}-${tipoKey}-${btu}`;
  return equipmentImages[imageKey] || [];
};

// Función legacy para compatibilidad (retorna primera imagen o null)
const getEquipmentImage = (item) => {
  const images = getEquipmentImages(item);
  return images.length > 0 ? images[0] : null;
};

const EquipmentCatalog = () => {
  const { t } = useTranslation();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('todos');
  const [visibleCount, setVisibleCount] = useState(6);
  const [imageModal, setImageModal] = useState({ open: false, item: null, currentIndex: 0 });
  const [poweredOn, setPoweredOn] = useState({}); // Estado encendido/apagado por equipo

  // Toggle encendido/apagado de un equipo
  const togglePower = (id) => {
    setPoweredOn(prev => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id] // Por defecto encendido
    }));
  };

  // Verificar si un equipo está encendido (por defecto sí, excepto si no hay stock)
  const isOn = (item) => {
    const id = item.id;
    if (poweredOn[id] !== undefined) return poweredOn[id];
    // Por defecto apagado si no hay stock
    return item.stock > 0;
  };

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

  // Ordenar equipos: primero por marca (A-Z), luego por BTU (menor a mayor)
  const sortedEquipment = [...filteredEquipment].sort((a, b) => {
    // Primero ordenar por marca alfabéticamente
    const marcaComparison = (a.marca || '').localeCompare(b.marca || '');
    if (marcaComparison !== 0) return marcaComparison;
    
    // Si la marca es igual, ordenar por BTU de menor a mayor
    const btuA = parseInt(a.capacidadBTU) || parseInt(a.capacidad) || 0;
    const btuB = parseInt(b.capacidadBTU) || parseInt(b.capacidad) || 0;
    return btuA - btuB;
  });

  // Equipos visibles
  const visibleEquipment = sortedEquipment.slice(0, visibleCount);

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
                <div className={`equipment-image ${item.stock <= 0 ? 'out-of-stock' : ''}`}>
                  {item.stock > 0 ? (
                    <span className="equipment-badge in-stock">
                      {t('landing.catalog.inStock', 'En Stock')}
                    </span>
                  ) : (
                    <span className="equipment-badge out-of-stock-badge">
                      {t('landing.catalog.outOfStock', 'Agotado')}
                    </span>
                  )}
                  {/* Botón para ver imagen real */}
                  {getEquipmentImage(item) && (
                    <button 
                      className="view-image-btn"
                      onClick={() => setImageModal({ open: true, item, currentIndex: 0 })}
                      title={t('landing.catalog.viewImage', 'Ver imagen')}
                    >
                      <Eye size={18} />
                    </button>
                  )}
                  {/* SVG animado del equipo con partículas - Click para encender/apagar */}
                  <svg 
                    viewBox="0 0 200 150" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg" 
                    style={{ width: '70%', height: 'auto', cursor: 'pointer' }}
                    onClick={() => togglePower(item.id)}
                    className={`equipment-svg ${isOn(item) ? 'powered-on' : 'powered-off'}`}
                  >
                    {/* Cuerpo del split */}
                    <rect x="10" y="25" width="180" height="70" rx="10" fill="#e2e8f0"/>
                    <rect x="15" y="30" width="170" height="55" rx="7" fill="#f8fafc"/>
                    
                    {/* Rejillas de ventilación */}
                    <rect x="25" y="37" width="140" height="4" rx="2" fill="#94a3b8" opacity="0.5"/>
                    <rect x="25" y="45" width="140" height="4" rx="2" fill="#94a3b8" opacity="0.5"/>
                    <rect x="25" y="53" width="140" height="4" rx="2" fill="#94a3b8" opacity="0.5"/>
                    <rect x="25" y="61" width="140" height="4" rx="2" fill="#94a3b8" opacity="0.5"/>
                    <rect x="25" y="69" width="140" height="4" rx="2" fill="#94a3b8" opacity="0.5"/>
                    
                    {/* LED indicador - cambia según estado */}
                    <circle 
                      cx="172" cy="42" r="5" 
                      fill={isOn(item) ? "#0ea5e9" : "#475569"} 
                      className={isOn(item) ? "equipment-led" : ""}
                    />
                    
                    {/* Display de temperatura o símbolo apagado */}
                    <rect x="140" y="58" width="32" height="16" rx="3" fill="#0f172a" opacity="0.15"/>
                    <text 
                      x="156" y="70" 
                      fontFamily="monospace" 
                      fontSize="10" 
                      fill={isOn(item) ? "#0ea5e9" : "#475569"} 
                      textAnchor="middle" 
                      className={isOn(item) ? "equipment-temp" : ""}
                    >
                      {isOn(item) ? "24°" : "- -"}
                    </text>
                    
                    {/* Partículas de aire frío - solo si está encendido */}
                    {isOn(item) && (
                      <>
                        <circle className="air-particle p1" cx="30" cy="98" r="3" fill="#7dd3fc"/>
                        <circle className="air-particle p2" cx="50" cy="98" r="2.5" fill="#7dd3fc"/>
                        <circle className="air-particle p3" cx="70" cy="98" r="3" fill="#7dd3fc"/>
                        <circle className="air-particle p4" cx="90" cy="98" r="2" fill="#7dd3fc"/>
                        <circle className="air-particle p5" cx="110" cy="98" r="3" fill="#7dd3fc"/>
                        <circle className="air-particle p6" cx="130" cy="98" r="2.5" fill="#7dd3fc"/>
                        <circle className="air-particle p7" cx="150" cy="98" r="3" fill="#7dd3fc"/>
                        <circle className="air-particle p8" cx="170" cy="98" r="2" fill="#7dd3fc"/>
                        <circle className="air-particle p9" cx="40" cy="98" r="2" fill="#7dd3fc"/>
                        <circle className="air-particle p10" cx="80" cy="98" r="2.5" fill="#7dd3fc"/>
                        <circle className="air-particle p11" cx="120" cy="98" r="2" fill="#7dd3fc"/>
                        <circle className="air-particle p12" cx="160" cy="98" r="2.5" fill="#7dd3fc"/>
                      </>
                    )}
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

      {/* Modal para ver imagen del equipo */}
      {imageModal.open && imageModal.item && (
        <div 
          className="image-modal-overlay"
          onClick={() => setImageModal({ open: false, item: null, currentIndex: 0 })}
        >
          <div 
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="image-modal-close"
              onClick={() => setImageModal({ open: false, item: null, currentIndex: 0 })}
            >
              <X size={24} />
            </button>
            <div className="image-modal-header">
              <span className="image-modal-brand">{imageModal.item.marca}</span>
              <h3 className="image-modal-title">{imageModal.item.modelo}</h3>
              <span className="image-modal-capacity">
                {imageModal.item.capacidad || imageModal.item.capacidadBTU}
              </span>
            </div>
            <div className="image-modal-body">
              {/* Flecha izquierda */}
              {getEquipmentImages(imageModal.item).length > 1 && (
                <button 
                  className="gallery-arrow gallery-arrow-left"
                  onClick={() => setImageModal(prev => ({
                    ...prev,
                    currentIndex: prev.currentIndex === 0 
                      ? getEquipmentImages(prev.item).length - 1 
                      : prev.currentIndex - 1
                  }))}
                >
                  <ChevronLeft size={28} />
                </button>
              )}
              
              <img 
                src={getEquipmentImages(imageModal.item)[imageModal.currentIndex]} 
                alt={`${imageModal.item.marca} ${imageModal.item.modelo}`}
              />
              
              {/* Flecha derecha */}
              {getEquipmentImages(imageModal.item).length > 1 && (
                <button 
                  className="gallery-arrow gallery-arrow-right"
                  onClick={() => setImageModal(prev => ({
                    ...prev,
                    currentIndex: prev.currentIndex === getEquipmentImages(prev.item).length - 1 
                      ? 0 
                      : prev.currentIndex + 1
                  }))}
                >
                  <ChevronRight size={28} />
                </button>
              )}
            </div>
            
            {/* Indicadores de imagen */}
            {getEquipmentImages(imageModal.item).length > 1 && (
              <div className="gallery-indicators">
                {getEquipmentImages(imageModal.item).map((_, idx) => (
                  <button
                    key={idx}
                    className={`gallery-dot ${idx === imageModal.currentIndex ? 'active' : ''}`}
                    onClick={() => setImageModal(prev => ({ ...prev, currentIndex: idx }))}
                  />
                ))}
              </div>
            )}
            
            <div className="image-modal-footer">
              <button 
                className="equipment-cta"
                onClick={() => {
                  setImageModal({ open: false, item: null, currentIndex: 0 });
                  scrollToContact();
                }}
              >
                {t('landing.catalog.cta', 'Cotizar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default EquipmentCatalog;
