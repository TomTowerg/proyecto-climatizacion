import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, ChevronDown } from 'lucide-react';

const FAQ = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      questionKey: 'landing.faq.q1.question',
      questionDefault: '¿Cuánto tiempo toma instalar un aire acondicionado?',
      answerKey: 'landing.faq.q1.answer',
      answerDefault: 'La instalación estándar de un equipo split toma entre 2 a 4 horas. Para instalaciones más complejas como sistemas centralizados o cassette, puede tomar un día completo. Siempre coordinamos previamente para minimizar las molestias.'
    },
    {
      questionKey: 'landing.faq.q2.question',
      questionDefault: '¿Qué incluye el servicio de mantenimiento?',
      answerKey: 'landing.faq.q2.answer',
      answerDefault: 'Nuestro mantenimiento preventivo incluye: limpieza profunda de filtros y serpentines, verificación de niveles de gas refrigerante, revisión del sistema eléctrico, lubricación de partes móviles, medición de temperaturas y presiones, y un informe detallado del estado del equipo.'
    },
    {
      questionKey: 'landing.faq.q3.question',
      questionDefault: '¿Cuál es la garantía de los equipos?',
      answerKey: 'landing.faq.q3.answer',
      answerDefault: 'Todos nuestros equipos cuentan con garantía de fábrica que va desde 1 a 5 años dependiendo de la marca. Adicionalmente, ofrecemos garantía de instalación por 1 año y planes de garantía extendida opcionales.'
    },
    {
      questionKey: 'landing.faq.q4.question',
      questionDefault: '¿Trabajan con todas las marcas?',
      answerKey: 'landing.faq.q4.answer',
      answerDefault: 'Sí, nuestros técnicos están certificados para trabajar con todas las marcas principales: Samsung, LG, Daikin, Carrier, Midea, Gree, Electrolux, entre otras. También trabajamos con equipos industriales y sistemas VRF.'
    },
    {
      questionKey: 'landing.faq.q5.question',
      questionDefault: '¿Cómo sé qué capacidad de equipo necesito?',
      answerKey: 'landing.faq.q5.answer',
      answerDefault: 'La capacidad depende del tamaño del espacio, orientación, cantidad de ventanas y ocupantes. Como referencia: 9.000 BTU para 15-20m², 12.000 BTU para 24-30m², 18.000 BTU para 32-40m², 24.000 BTU para 45-50m². Contáctanos y te ayudamos a elegir la mejor opción para tu espacio.'
    },
    {
      questionKey: 'landing.faq.q6.question',
      questionDefault: '¿Cuáles son las formas de pago?',
      answerKey: 'landing.faq.q6.answer',
      answerDefault: 'Aceptamos transferencia bancaria, tarjetas de crédito y débito. Para empresas ofrecemos facturación a 30 días. También tenemos convenios de financiamiento en cuotas sin interés con algunas tarjetas.'
    },
    {
      questionKey: 'landing.faq.q7.question',
      questionDefault: '¿Cubren toda la Región Metropolitana?',
      answerKey: 'landing.faq.q7.answer',
      answerDefault: 'Sí, cubrimos toda la Región Metropolitana sin costo adicional de traslado. Para regiones cercanas (V y VI región), también ofrecemos servicio con un pequeño cargo por distancia.'
    }
  ];

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="faq-section">
      <div className="landing-container">
        <div className="section-header animate-on-scroll">
          <span className="section-label">
            <HelpCircle size={16} />
            {t('landing.faq.label', 'Preguntas Frecuentes')}
          </span>
          <h2 className="section-title">
            {t('landing.faq.title', '¿Tienes Dudas?')}
          </h2>
          <p className="section-description">
            {t('landing.faq.description', 'Encuentra respuestas a las preguntas más comunes sobre nuestros servicios.')}
          </p>
        </div>

        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-item ${openIndex === index ? 'open' : ''}`}
            >
              <button 
                className="faq-question"
                onClick={() => toggleFaq(index)}
                aria-expanded={openIndex === index}
              >
                <span>{t(faq.questionKey, faq.questionDefault)}</span>
                <ChevronDown className="faq-icon" />
              </button>
              <div className="faq-answer">
                <div className="faq-answer-content">
                  {t(faq.answerKey, faq.answerDefault)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
