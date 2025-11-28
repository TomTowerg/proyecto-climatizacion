import { useTranslation } from 'react-i18next';
import { 
  Wrench, 
  Settings, 
  ShieldCheck, 
  Zap, 
  ThermometerSun,
  Clock,
  Check
} from 'lucide-react';

const ServicesSection = () => {
  const { t } = useTranslation();

  const services = [
    {
      icon: Wrench,
      titleKey: 'landing.services.installation.title',
      titleDefault: 'Instalación Profesional',
      descriptionKey: 'landing.services.installation.description',
      descriptionDefault: 'Instalación certificada de equipos de aire acondicionado con los más altos estándares de calidad y seguridad.',
      features: [
        { key: 'landing.services.installation.feature1', default: 'Evaluación técnica gratuita' },
        { key: 'landing.services.installation.feature2', default: 'Instalación en 24-48 horas' },
        { key: 'landing.services.installation.feature3', default: 'Garantía de instalación' },
      ]
    },
    {
      icon: Settings,
      titleKey: 'landing.services.maintenance.title',
      titleDefault: 'Mantenimiento Preventivo',
      descriptionKey: 'landing.services.maintenance.description',
      descriptionDefault: 'Programas de mantenimiento que extienden la vida útil de tu equipo y optimizan su rendimiento energético.',
      features: [
        { key: 'landing.services.maintenance.feature1', default: 'Limpieza profunda de filtros' },
        { key: 'landing.services.maintenance.feature2', default: 'Revisión de gas refrigerante' },
        { key: 'landing.services.maintenance.feature3', default: 'Diagnóstico completo' },
      ]
    },
    {
      icon: Zap,
      titleKey: 'landing.services.repair.title',
      titleDefault: 'Reparación Express',
      descriptionKey: 'landing.services.repair.description',
      descriptionDefault: 'Servicio técnico rápido para resolver cualquier falla. Diagnóstico preciso y reparación eficiente.',
      features: [
        { key: 'landing.services.repair.feature1', default: 'Atención en el mismo día' },
        { key: 'landing.services.repair.feature2', default: 'Repuestos originales' },
        { key: 'landing.services.repair.feature3', default: 'Garantía en reparaciones' },
      ]
    },
    {
      icon: ThermometerSun,
      titleKey: 'landing.services.climate.title',
      titleDefault: 'Climatización Industrial',
      descriptionKey: 'landing.services.climate.description',
      descriptionDefault: 'Soluciones de climatización para oficinas, locales comerciales e industrias con alta demanda.',
      features: [
        { key: 'landing.services.climate.feature1', default: 'Proyectos a medida' },
        { key: 'landing.services.climate.feature2', default: 'Sistemas centralizados' },
        { key: 'landing.services.climate.feature3', default: 'Eficiencia energética' },
      ]
    },
    {
      icon: ShieldCheck,
      titleKey: 'landing.services.warranty.title',
      titleDefault: 'Garantía Extendida',
      descriptionKey: 'landing.services.warranty.description',
      descriptionDefault: 'Planes de protección adicional para tu inversión con cobertura completa y atención prioritaria.',
      features: [
        { key: 'landing.services.warranty.feature1', default: 'Cobertura total de piezas' },
        { key: 'landing.services.warranty.feature2', default: 'Servicio técnico prioritario' },
        { key: 'landing.services.warranty.feature3', default: 'Sin costos adicionales' },
      ]
    },
    {
      icon: Clock,
      titleKey: 'landing.services.emergency.title',
      titleDefault: 'Emergencias 24/7',
      descriptionKey: 'landing.services.emergency.description',
      descriptionDefault: 'Servicio de emergencia disponible las 24 horas para cuando más lo necesitas.',
      features: [
        { key: 'landing.services.emergency.feature1', default: 'Respuesta inmediata' },
        { key: 'landing.services.emergency.feature2', default: 'Técnicos certificados' },
        { key: 'landing.services.emergency.feature3', default: 'Cobertura toda la RM' },
      ]
    },
  ];

  return (
    <section id="servicios" className="services-section">
      <div className="landing-container">
        <div className="section-header animate-on-scroll">
          <span className="section-label">
            <Settings size={16} />
            {t('landing.services.label', 'Nuestros Servicios')}
          </span>
          <h2 className="section-title">
            {t('landing.services.title', 'Soluciones Completas en Climatización')}
          </h2>
          <p className="section-description">
            {t('landing.services.description', 'Ofrecemos un servicio integral para todas tus necesidades de aire acondicionado, desde la instalación hasta el mantenimiento continuo.')}
          </p>
        </div>

        <div className="services-grid stagger-children">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div key={index} className="service-card">
                <div className="service-icon">
                  <Icon />
                </div>
                <h3 className="service-title">
                  {t(service.titleKey, service.titleDefault)}
                </h3>
                <p className="service-description">
                  {t(service.descriptionKey, service.descriptionDefault)}
                </p>
                <ul className="service-features">
                  {service.features.map((feature, fIndex) => (
                    <li key={fIndex}>
                      <Check size={16} />
                      {t(feature.key, feature.default)}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
