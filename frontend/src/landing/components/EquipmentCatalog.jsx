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
  ChevronRight,
  ZoomIn
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  'anwo-split-9000': ['/equipos/anwo-split-9000.png', '/equipos/anwo-split-9000-2.png'],
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
      capacidadBTU: 12000,
      tipoGas: 'R-410A',
      metrosCuadrados: '20-25 m²',
      precioCliente: 599990,
      stock: 5,
      estado: 'disponible'
    },
    {
      id: 2,
      tipo: 'Split',
      marca: 'ANWO',
      modelo: 'Infinity 9000',
      capacidad: '9000 BTU',
      capacidadBTU: 9000,
      tipoGas: 'R-32',
      metrosCuadrados: '15-20 m²',
      precioCliente: 449990,
      stock: 8,
      estado: 'disponible'
    }
  ];

  // Obtener tipos únicos para filtros
  const types = ['todos', ...new Set(equipment.map(e => e.tipo))];

  // Filtrar equipos
  const filteredEquipment = activeFilter === 'todos'
    ? equipment
    : equipment.filter(e => e.tipo === activeFilter);

  // Ordenar equipos: primero por marca (A-Z), luego por BTU (menor a mayor)
  const sortedEquipment = [...filteredEquipment].sort((a, b) => {
    const marcaComparison = (a.marca || '').localeCompare(b.marca || '');
    if (marcaComparison !== 0) return marcaComparison;

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

  const scrollToContact = (item) => {
    // Disparar evento con datos del equipo para pre-llenar el formulario
    if (item) {
      window.dispatchEvent(new CustomEvent('equipment-quote-request', {
        detail: {
          marca: item.marca,
          modelo: item.modelo,
          capacidad: item.capacidad || item.capacidadBTU,
          precio: item.precioCliente || item.precioClienteIVA
        }
      }));
    }

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
            {visibleEquipment.map((item, index) => {
              const hasImage = getEquipmentImage(item);

              return (
                <div key={item.id} className="equipment-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className={`equipment-image ${item.stock <= 0 ? 'out-of-stock' : ''}`}>
                    {/* Badge de Stock */}
                    {item.stock > 0 ? (
                      <span className="equipment-badge in-stock">
                        {t('landing.catalog.inStock', 'En Stock')}
                      </span>
                    ) : (
                      <span className="equipment-badge out-of-stock-badge">
                        {t('landing.catalog.outOfStock', 'Agotado')}
                      </span>
                    )}

                    {/* IMAGEN REAL del equipo con click para zoom */}
                    {hasImage ? (
                      <div
                        className="equipment-real-image-container"
                        onClick={() => setImageModal({ open: true, item, currentIndex: 0 })}
                      >
                        <img
                          src={hasImage}
                          alt={`${item.marca} ${item.modelo}`}
                          className="equipment-real-image"
                        />
                        {/* Overlay con icono de zoom al hacer hover */}
                        <div className="equipment-image-overlay">
                          <ZoomIn size={32} />
                          <span>Click para ampliar</span>
                        </div>
                      </div>
                    ) : (
                      /* Placeholder si no hay imagen */
                      <div className="equipment-placeholder">
                        <Package size={64} />
                        <span>Sin imagen</span>
                      </div>
                    )}
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
                      <button className="equipment-cta" onClick={() => scrollToContact(item)}>
                        {t('landing.catalog.cta', 'Cotizar')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* Modal para ver imagen del equipo con zoom */}
      {imageModal.open && imageModal.item && getEquipmentImages(imageModal.item).length > 0 && (
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
                className="modal-equipment-image"
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
                  const selectedItem = imageModal.item;
                  setImageModal({ open: false, item: null, currentIndex: 0 });
                  scrollToContact(selectedItem);
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