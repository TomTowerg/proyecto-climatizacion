import { useTranslation } from 'react-i18next';
import { Lightbulb } from 'lucide-react';

const HowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    {
      number: 1,
      titleKey: 'landing.howItWorks.step1.title',
      titleDefault: 'Contacto Inicial',
      descriptionKey: 'landing.howItWorks.step1.description',
      descriptionDefault: 'Contáctanos por teléfono, email o formulario web. Te responderemos en menos de 2 horas.'
    },
    {
      number: 2,
      titleKey: 'landing.howItWorks.step2.title',
      titleDefault: 'Evaluación Técnica',
      descriptionKey: 'landing.howItWorks.step2.description',
      descriptionDefault: 'Un técnico visitará tu ubicación para evaluar las necesidades y recomendar la mejor solución.'
    },
    {
      number: 3,
      titleKey: 'landing.howItWorks.step3.title',
      titleDefault: 'Cotización Detallada',
      descriptionKey: 'landing.howItWorks.step3.description',
      descriptionDefault: 'Recibirás una cotización transparente con todos los costos incluidos, sin sorpresas.'
    },
    {
      number: 4,
      titleKey: 'landing.howItWorks.step4.title',
      titleDefault: 'Instalación Profesional',
      descriptionKey: 'landing.howItWorks.step4.description',
      descriptionDefault: 'Nuestro equipo certificado realizará la instalación siguiendo los más altos estándares.'
    }
  ];

  return (
    <section id="como-funciona" className="how-it-works-section">
      <div className="landing-container">
        <div className="section-header animate-on-scroll">
          <span className="section-label">
            <Lightbulb size={16} />
            {t('landing.howItWorks.label', 'Proceso Simple')}
          </span>
          <h2 className="section-title">
            {t('landing.howItWorks.title', '¿Cómo Funciona?')}
          </h2>
          <p className="section-description">
            {t('landing.howItWorks.description', 'Un proceso sencillo y transparente para que tengas tu aire acondicionado funcionando lo antes posible.')}
          </p>
        </div>

        <div className="how-steps stagger-children">
          {steps.map((step) => (
            <div key={step.number} className="how-step">
              <div className="how-step-number">{step.number}</div>
              <h3 className="how-step-title">
                {t(step.titleKey, step.titleDefault)}
              </h3>
              <p className="how-step-description">
                {t(step.descriptionKey, step.descriptionDefault)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
