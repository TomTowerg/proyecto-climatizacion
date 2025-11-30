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

// Componente SVG para Split Muro
const SplitSVG = ({ isOn }) => (
  <>
    {/* Cuerpo del split */}
    <rect x="10" y="25" width="180" height="70" rx="10" fill="#e2e8f0"/>
    <rect x="15" y="30" width="170" height="55" rx="7" fill="#f8fafc"/>
    
    {/* Rejillas de ventilación */}
    <rect x="25" y="37" width="140" height="4" rx="2" fill="#94a3b8" opacity="0.5"/>
    <rect x="25" y="45" width="140" height="4" rx="2" fill="#94a3b8" opacity="0.5"/>
    <rect x="25" y="53" width="140" height="4" rx="2" fill="#94a3b8" opacity="0.5"/>
    <rect x="25" y="61" width="140" height="4" rx="2" fill="#94a3b8" opacity="0.5"/>
    <rect x="25" y="69" width="140" height="4" rx="2" fill="#94a3b8" opacity="0.5"/>
    
    {/* LED indicador */}
    <circle cx="172" cy="42" r="5" fill={isOn ? "#0ea5e9" : "#475569"} className={isOn ? "equipment-led" : ""}/>
    
    {/* Display de temperatura */}
    <rect x="140" y="58" width="32" height="16" rx="3" fill="#0f172a" opacity="0.15"/>
    <text x="156" y="70" fontFamily="monospace" fontSize="10" fill={isOn ? "#0ea5e9" : "#475569"} textAnchor="middle" className={isOn ? "equipment-temp" : ""}>
      {isOn ? "24°" : "- -"}
    </text>
    
    {/* Partículas de aire */}
    {isOn && (
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
  </>
);

// Componente SVG para Ventana
const VentanaSVG = ({ isOn }) => (
  <>
    {/* Cuerpo del equipo de ventana */}
    <rect x="20" y="20" width="160" height="100" rx="8" fill="#e2e8f0"/>
    <rect x="25" y="25" width="150" height="90" rx="5" fill="#f8fafc"/>
    
    {/* Panel izquierdo - rejillas */}
    <rect x="30" y="30" width="70" height="80" rx="4" fill="#f1f5f9"/>
    {[0, 1, 2, 3, 4, 5, 6].map(i => (
      <rect key={`v${i}`} x="35" y={35 + i * 11} width="60" height="6" rx="3" fill="#94a3b8" opacity="0.5"/>
    ))}
    
    {/* Panel derecho - controles */}
    <rect x="105" y="30" width="65" height="80" rx="4" fill="#e2e8f0"/>
    
    {/* Rejillas verticales */}
    <rect x="115" y="35" width="8" height="70" rx="2" fill="#94a3b8" opacity="0.4"/>
    <rect x="130" y="35" width="8" height="70" rx="2" fill="#94a3b8" opacity="0.4"/>
    <rect x="145" y="35" width="8" height="70" rx="2" fill="#94a3b8" opacity="0.4"/>
    
    {/* LED indicador */}
    <circle cx="158" cy="108" r="5" fill={isOn ? "#0ea5e9" : "#475569"} className={isOn ? "equipment-led" : ""}/>
    
    {/* Display */}
    <rect x="110" y="85" width="28" height="14" rx="2" fill="#0f172a" opacity="0.15"/>
    <text x="124" y="95" fontFamily="monospace" fontSize="8" fill={isOn ? "#0ea5e9" : "#475569"} textAnchor="middle" className={isOn ? "equipment-temp" : ""}>
      {isOn ? "24°" : "--"}
    </text>
    
    {/* Partículas saliendo hacia la izquierda */}
    {isOn && (
      <>
        <circle className="air-particle-left p1" cx="25" cy="50" r="2.5" fill="#7dd3fc"/>
        <circle className="air-particle-left p2" cx="25" cy="60" r="2" fill="#7dd3fc"/>
        <circle className="air-particle-left p3" cx="25" cy="70" r="2.5" fill="#7dd3fc"/>
        <circle className="air-particle-left p4" cx="25" cy="80" r="2" fill="#7dd3fc"/>
        <circle className="air-particle-left p5" cx="25" cy="55" r="2" fill="#7dd3fc"/>
        <circle className="air-particle-left p6" cx="25" cy="65" r="2.5" fill="#7dd3fc"/>
        <circle className="air-particle-left p7" cx="25" cy="75" r="2" fill="#7dd3fc"/>
        <circle className="air-particle-left p8" cx="25" cy="85" r="2.5" fill="#7dd3fc"/>
      </>
    )}
  </>
);

// Componente SVG para Cassette (vista inferior)
const CassetteSVG = ({ isOn }) => (
  <>
    {/* Marco exterior */}
    <rect x="25" y="20" width="150" height="110" rx="10" fill="#e2e8f0"/>
    <rect x="30" y="25" width="140" height="100" rx="7" fill="#f8fafc"/>
    
    {/* Panel central */}
    <rect x="40" y="35" width="120" height="80" rx="5" fill="#f1f5f9"/>
    
    {/* Rejillas en 4 direcciones */}
    <rect x="70" y="38" width="60" height="8" rx="2" fill="#94a3b8" opacity="0.5"/>
    <rect x="70" y="104" width="60" height="8" rx="2" fill="#94a3b8" opacity="0.5"/>
    <rect x="43" y="55" width="8" height="40" rx="2" fill="#94a3b8" opacity="0.5"/>
    <rect x="149" y="55" width="8" height="40" rx="2" fill="#94a3b8" opacity="0.5"/>
    
    {/* Centro con ventilador */}
    <circle cx="100" cy="75" r="25" fill="#e2e8f0"/>
    <circle cx="100" cy="75" r="18" fill="#f8fafc"/>
    <circle cx="100" cy="75" r="8" fill={isOn ? "#0ea5e9" : "#475569"} className={isOn ? "equipment-led" : ""} opacity="0.8"/>
    
    {/* Aspas del ventilador */}
    <g className={isOn ? "fan-spin" : ""}>
      <rect x="97" y="60" width="6" height="12" rx="2" fill="#94a3b8" opacity="0.6"/>
      <rect x="97" y="78" width="6" height="12" rx="2" fill="#94a3b8" opacity="0.6"/>
      <rect x="85" y="72" width="12" height="6" rx="2" fill="#94a3b8" opacity="0.6"/>
      <rect x="103" y="72" width="12" height="6" rx="2" fill="#94a3b8" opacity="0.6"/>
    </g>
    
    {/* Display esquina */}
    <rect x="125" y="95" width="28" height="14" rx="2" fill="#0f172a" opacity="0.15"/>
    <text x="139" y="105" fontFamily="monospace" fontSize="8" fill={isOn ? "#0ea5e9" : "#475569"} textAnchor="middle" className={isOn ? "equipment-temp" : ""}>
      {isOn ? "24°" : "--"}
    </text>
    
    {/* Partículas en 4 direcciones */}
    {isOn && (
      <>
        <circle className="air-particle-up p1" cx="85" cy="35" r="2" fill="#7dd3fc"/>
        <circle className="air-particle-up p2" cx="100" cy="35" r="2.5" fill="#7dd3fc"/>
        <circle className="air-particle-up p3" cx="115" cy="35" r="2" fill="#7dd3fc"/>
        <circle className="air-particle-down p4" cx="85" cy="115" r="2" fill="#7dd3fc"/>
        <circle className="air-particle-down p5" cx="100" cy="115" r="2.5" fill="#7dd3fc"/>
        <circle className="air-particle-down p6" cx="115" cy="115" r="2" fill="#7dd3fc"/>
      </>
    )}
  </>
);

// Componente SVG para Portátil
const PortatilSVG = ({ isOn }) => (
  <>
    {/* Cuerpo principal vertical */}
    <rect x="55" y="15" width="90" height="120" rx="12" fill="#e2e8f0"/>
    <rect x="60" y="20" width="80" height="110" rx="8" fill="#f8fafc"/>
    
    {/* Panel superior - salida de aire */}
    <rect x="65" y="25" width="70" height="35" rx="5" fill="#f1f5f9"/>
    {[0, 1, 2, 3].map(i => (
      <rect key={`p${i}`} x="70" y={30 + i * 8} width="60" height="4" rx="2" fill="#94a3b8" opacity="0.5"/>
    ))}
    
    {/* Panel de control central */}
    <rect x="70" y="65" width="60" height="40" rx="5" fill="#e2e8f0"/>
    
    {/* Display */}
    <rect x="80" y="70" width="40" height="18" rx="3" fill="#0f172a" opacity="0.2"/>
    <text x="100" y="83" fontFamily="monospace" fontSize="10" fill={isOn ? "#0ea5e9" : "#475569"} textAnchor="middle" className={isOn ? "equipment-temp" : ""}>
      {isOn ? "24°" : "- -"}
    </text>
    
    {/* Botones */}
    <circle cx="85" cy="95" r="4" fill={isOn ? "#0ea5e9" : "#475569"} className={isOn ? "equipment-led" : ""}/>
    <circle cx="100" cy="95" r="4" fill="#94a3b8" opacity="0.5"/>
    <circle cx="115" cy="95" r="4" fill="#94a3b8" opacity="0.5"/>
    
    {/* Ruedas */}
    <circle cx="75" cy="132" r="6" fill="#64748b"/>
    <circle cx="125" cy="132" r="6" fill="#64748b"/>
    
    {/* Partículas saliendo hacia arriba */}
    {isOn && (
      <>
        <circle className="air-particle-up p1" cx="80" cy="20" r="2.5" fill="#7dd3fc"/>
        <circle className="air-particle-up p2" cx="95" cy="20" r="2" fill="#7dd3fc"/>
        <circle className="air-particle-up p3" cx="110" cy="20" r="2.5" fill="#7dd3fc"/>
        <circle className="air-particle-up p4" cx="87" cy="20" r="2" fill="#7dd3fc"/>
        <circle className="air-particle-up p5" cx="102" cy="20" r="2" fill="#7dd3fc"/>
        <circle className="air-particle-up p6" cx="118" cy="20" r="2.5" fill="#7dd3fc"/>
      </>
    )}
  </>
);

// Componente SVG para Piso Cielo
const PisoCieloSVG = ({ isOn }) => (
  <>
    {/* Cuerpo vertical alto */}
    <rect x="50" y="10" width="100" height="130" rx="8" fill="#e2e8f0"/>
    <rect x="55" y="15" width="90" height="120" rx="5" fill="#f8fafc"/>
    
    {/* Rejilla superior - salida de aire */}
    <rect x="60" y="20" width="80" height="50" rx="4" fill="#f1f5f9"/>
    {[0, 1, 2, 3, 4, 5].map(i => (
      <rect key={`pc${i}`} x="65" y={25 + i * 8} width="70" height="4" rx="2" fill="#94a3b8" opacity="0.5"/>
    ))}
    
    {/* Panel de control */}
    <rect x="60" y="75" width="80" height="55" rx="4" fill="#e2e8f0"/>
    
    {/* Display grande */}
    <rect x="70" y="80" width="60" height="25" rx="3" fill="#0f172a" opacity="0.15"/>
    <text x="100" y="98" fontFamily="monospace" fontSize="14" fill={isOn ? "#0ea5e9" : "#475569"} textAnchor="middle" className={isOn ? "equipment-temp" : ""}>
      {isOn ? "24°" : "- -"}
    </text>
    
    {/* LED y controles */}
    <circle cx="80" cy="118" r="5" fill={isOn ? "#0ea5e9" : "#475569"} className={isOn ? "equipment-led" : ""}/>
    <rect x="95" y="113" width="35" height="10" rx="3" fill="#94a3b8" opacity="0.4"/>
    
    {/* Partículas hacia arriba */}
    {isOn && (
      <>
        <circle className="air-particle-up p1" cx="70" cy="15" r="2.5" fill="#7dd3fc"/>
        <circle className="air-particle-up p2" cx="85" cy="15" r="2" fill="#7dd3fc"/>
        <circle className="air-particle-up p3" cx="100" cy="15" r="2.5" fill="#7dd3fc"/>
        <circle className="air-particle-up p4" cx="115" cy="15" r="2" fill="#7dd3fc"/>
        <circle className="air-particle-up p5" cx="130" cy="15" r="2.5" fill="#7dd3fc"/>
        <circle className="air-particle-up p6" cx="77" cy="15" r="2" fill="#7dd3fc"/>
        <circle className="air-particle-up p7" cx="92" cy="15" r="2" fill="#7dd3fc"/>
        <circle className="air-particle-up p8" cx="107" cy="15" r="2.5" fill="#7dd3fc"/>
      </>
    )}
  </>
);

// Función para renderizar el SVG según el tipo de equipo
const EquipmentSVGByType = ({ tipo, isOn }) => {
  const tipoLower = (tipo || 'split').toLowerCase();
  
  if (tipoLower.includes('ventana')) {
    return <VentanaSVG isOn={isOn} />;
  }
  if (tipoLower.includes('cassette')) {
    return <CassetteSVG isOn={isOn} />;
  }
  if (tipoLower.includes('portátil') || tipoLower.includes('portatil')) {
    return <PortatilSVG isOn={isOn} />;
  }
  if (tipoLower.includes('piso') || tipoLower.includes('cielo')) {
    return <PisoCieloSVG isOn={isOn} />;
  }
  // Por defecto: Split Muro
  return <SplitSVG isOn={isOn} />;
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
          <div className="catalog-price-notice">
            <span className="price-notice-icon">ℹ️</span>
            <span>{t('landing.catalog.priceNotice', 'Precios incluyen IVA. Instalación se cotiza por separado según requerimientos.')}</span>
          </div>
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
                  {/* SVG animado del equipo - Click para encender/apagar */}
                  <svg 
                    viewBox="0 0 200 150" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg" 
                    style={{ width: '70%', height: 'auto', cursor: 'pointer' }}
                    onClick={() => togglePower(item.id)}
                    className={`equipment-svg ${isOn(item) ? 'powered-on' : 'powered-off'}`}
                  >
                    <EquipmentSVGByType tipo={item.tipo} isOn={isOn(item)} />
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
                      <div className="equipment-price-label">{t('landing.catalog.priceLabel', 'Equipo + IVA')}</div>
                      <div className="equipment-price-note">{t('landing.catalog.priceNote', '*Sin instalación')}</div>
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
