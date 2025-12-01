import { useTranslation } from 'react-i18next';
import { Users, Award, Clock, Shield, Target, Heart } from 'lucide-react';

const AboutUs = () => {
  const { t } = useTranslation();

  const values = [
    {
      icon: Award,
      title: 'Excelencia',
      description: 'Nos comprometemos con la calidad en cada instalación y servicio que realizamos.'
    },
    {
      icon: Clock,
      title: 'Puntualidad',
      description: 'Respetamos tu tiempo. Llegamos cuando lo prometemos y cumplimos los plazos.'
    },
    {
      icon: Shield,
      title: 'Confianza',
      description: 'Trabajamos con transparencia y honestidad en cada presupuesto y diagnóstico.'
    },
    {
      icon: Heart,
      title: 'Compromiso',
      description: 'Tu satisfacción es nuestra prioridad. No descansamos hasta que estés conforme.'
    }
  ];

  return (
    <section id="nosotros" className="about-section">
      <div className="landing-container">
        <div className="section-header animate-on-scroll">
          <span className="section-label">
            <Users size={16} />
            {t('landing.about.label', 'Sobre Nosotros')}
          </span>
          <h2 className="section-title">
            {t('landing.about.title', 'Conócenos')}
          </h2>
          <p className="section-description">
            {t('landing.about.description', 'Somos un equipo apasionado por la climatización, comprometidos con tu confort.')}
          </p>
        </div>

        <div className="about-content">
          <div className="about-story">
            <div className="about-story-card">
              <div className="about-icon-wrapper">
                <Target size={32} />
              </div>
              <h3>Nuestra Historia</h3>
              <p>
                KMTS Powertech nació con una misión clara: llevar soluciones de climatización 
                de calidad a hogares y empresas de Santiago. Con años de experiencia en el rubro, 
                hemos crecido gracias a la confianza de nuestros clientes y la dedicación de 
                nuestro equipo técnico.
              </p>
              <p>
                Hoy somos un referente en instalación, mantenimiento y reparación de aires 
                acondicionados, trabajando con las mejores marcas del mercado y ofreciendo 
                un servicio personalizado que nos distingue.
              </p>
            </div>

            <div className="about-stats-grid">
              <div className="about-stat">
                <span className="about-stat-number">500+</span>
                <span className="about-stat-label">Instalaciones realizadas</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-number">5+</span>
                <span className="about-stat-label">Años de experiencia</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-number">98%</span>
                <span className="about-stat-label">Clientes satisfechos</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-number">24/7</span>
                <span className="about-stat-label">Soporte disponible</span>
              </div>
            </div>
          </div>

          <div className="about-values">
            <h3 className="values-title">Nuestros Valores</h3>
            <div className="values-grid">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div key={index} className="value-card">
                    <div className="value-icon">
                      <Icon size={24} />
                    </div>
                    <h4>{value.title}</h4>
                    <p>{value.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;