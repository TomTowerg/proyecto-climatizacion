import { useTranslation } from 'react-i18next';
import { Snowflake, Sun, Phone, ChevronRight } from 'lucide-react';

const HeroSection = () => {
  const { t } = useTranslation();

  const scrollToContact = () => {
    const element = document.getElementById('contacto');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToEquipment = () => {
    const element = document.getElementById('equipos');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Generar partículas
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 15}s`,
    duration: `${15 + Math.random() * 10}s`
  }));

  return (
    <section id="hero" className="hero-section">
      {/* Background Effects */}
      <div className="hero-bg-effects">
        <div className="hero-glow hero-glow-1"></div>
        <div className="hero-glow hero-glow-2"></div>
        <div className="hero-grid"></div>
        <div className="hero-particles">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="particle"
              style={{
                left: particle.left,
                animationDelay: particle.delay,
                animationDuration: particle.duration
              }}
            />
          ))}
        </div>
      </div>

      <div className="landing-container hero-content">
        <div className="hero-text">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            {t('landing.hero.badge', 'Expertos en Climatización')}
          </div>

          <h1 className="hero-title">
            {t('landing.hero.titlePart1', 'Climatización')}{' '}
            <span className="hero-title-gradient">
              {t('landing.hero.titleHighlight', 'Inteligente')}
            </span>{' '}
            {t('landing.hero.titlePart2', 'para tu Comodidad')}
          </h1>

          <p className="hero-description">
            {t('landing.hero.description', 'Soluciones profesionales en aire acondicionado para hogares y empresas. Instalación, mantenimiento y reparación con tecnología de última generación y atención personalizada 24/7.')}
          </p>

          <div className="hero-cta-group">
            <button className="hero-cta-primary" onClick={scrollToContact}>
              <Phone size={20} />
              {t('landing.hero.ctaPrimary', 'Solicitar Cotización')}
            </button>
            <button className="hero-cta-secondary" onClick={scrollToEquipment}>
              {t('landing.hero.ctaSecondary', 'Ver Equipos')}
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">500+</div>
              <div className="hero-stat-label">{t('landing.hero.stat1', 'Instalaciones')}</div>
            </div>
            
            <div className="hero-stat" style={{ textAlign: 'center' }}>
              <div className="hero-stat-value" style={{ fontSize: '1.5rem', lineHeight: '1.1' }}>
                Lunes a<br/>Domingo
              </div>
              <div className="hero-stat-label" style={{ marginTop: '0.5rem' }}>
                Soporte
              </div>
            </div>
            
            <div className="hero-stat">
              <div className="hero-stat-value">100%</div>
              <div className="hero-stat-label">{t('landing.hero.stat3', 'Garantizado')}</div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-ac-container">
            <div className="hero-ac-glow"></div>
            
            {/* SVG de un aire acondicionado moderno */}
            <svg 
              className="hero-ac-image" 
              viewBox="0 0 400 280" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Cuerpo principal del AC */}
              <rect x="20" y="40" width="360" height="120" rx="12" fill="url(#acGradient)" />
              <rect x="20" y="40" width="360" height="120" rx="12" stroke="url(#acStroke)" strokeWidth="2" />
              
              {/* Panel frontal */}
              <rect x="30" y="50" width="340" height="100" rx="8" fill="url(#panelGradient)" />
              
              {/* Rejillas de ventilación */}
              <g opacity="0.6">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <rect key={i} x="50" y={60 + i * 10} width="300" height="6" rx="3" fill="url(#ventGradient)" />
                ))}
              </g>
              
              {/* Panel de control LED */}
              <rect x="320" y="60" width="40" height="20" rx="4" fill="#0a1628" />
              <circle cx="330" cy="70" r="4" fill="#34d399">
                <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
              </circle>
              <text x="340" y="74" fill="#7dd3fc" fontSize="10" fontFamily="monospace">22°</text>
              
              {/* Flujo de aire frío */}
              <g className="air-flow">
                <path d="M60 165 Q100 180, 60 200 Q100 220, 60 235" stroke="url(#coldAirGradient)" strokeWidth="3" fill="none" opacity="0.6">
                  <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                </path>
                <path d="M120 165 Q160 185, 120 210 Q160 230, 120 250" stroke="url(#coldAirGradient)" strokeWidth="3" fill="none" opacity="0.5">
                  <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2.5s" repeatCount="indefinite" />
                </path>
                <path d="M180 165 Q220 180, 180 200 Q220 225, 180 245" stroke="url(#coldAirGradient)" strokeWidth="3" fill="none" opacity="0.6">
                  <animate attributeName="opacity" values="0.6;0.3;0.6" dur="2.2s" repeatCount="indefinite" />
                </path>
                <path d="M240 165 Q280 185, 240 210 Q280 230, 240 250" stroke="url(#coldAirGradient)" strokeWidth="3" fill="none" opacity="0.5">
                  <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2.8s" repeatCount="indefinite" />
                </path>
                <path d="M300 165 Q340 180, 300 205 Q340 225, 300 240" stroke="url(#coldAirGradient)" strokeWidth="3" fill="none" opacity="0.6">
                  <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2.3s" repeatCount="indefinite" />
                </path>
              </g>
              
              {/* Soporte de pared */}
              <rect x="60" y="20" width="80" height="25" rx="4" fill="#1e3a5f" />
              <rect x="260" y="20" width="80" height="25" rx="4" fill="#1e3a5f" />
              
              {/* Definiciones de gradientes */}
              <defs>
                <linearGradient id="acGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>
                <linearGradient id="acStroke" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
                <linearGradient id="panelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f1f5f9" />
                  <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>
                <linearGradient id="ventGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#64748b" />
                  <stop offset="50%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
                <linearGradient id="coldAirGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#7dd3fc" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Temperature Indicators */}
            <div className="temp-indicator temp-cold">
              <Snowflake size={20} />
              <span>16°C</span>
            </div>
            <div className="temp-indicator temp-hot">
              <Sun size={20} />
              <span>30°C</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
