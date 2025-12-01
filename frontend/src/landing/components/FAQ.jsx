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
      answerDefault: `Ofrecemos 3 tipos de mantenimiento:

**Mantenimiento Premium:** Limpieza unidad interior (desmontaje de carcasa), limpieza y lavado de filtros de la unidad interior, limpieza y lavado de la unidad exterior, limpieza de bomba de condensado (cuando corresponda), lubricar piezas (cuando corresponda), medición presiones y consumos eléctricos, reapriete de conexiones eléctricas, pruebas de desagüe, y cambio de filtros antibacteriales.

**Mantenimiento Full:** Limpieza unidad interior (desmontaje de carcasa), limpieza y lavado de filtros de la unidad interior, limpieza y lavado de la unidad exterior, limpieza de bomba de condensado (cuando corresponda), lubricar piezas (cuando corresponda), medición presiones y consumos eléctricos, reapriete de conexiones eléctricas, y pruebas de desagüe.

**Mantenimiento Básico:** Limpieza y lavado de filtros de la unidad interior, y limpieza y lavado de la unidad exterior.`
    },
    {
      questionKey: 'landing.faq.q3.question',
      questionDefault: '¿Cuál es la garantía?',
      answerKey: 'landing.faq.q3.answer',
      answerDefault: 'Todos nuestros servicios cuentan con garantía. Para nuestros equipos le extendemos la misma proteccion que ofrece el fabricante. Adicionalmente, ofrecemos garantía de instalación por 1 año.'
    },
    {
      questionKey: 'landing.faq.q4.question',
      questionDefault: '¿Trabajan con todas las marcas?',
      answerKey: 'landing.faq.q4.answer',
      answerDefault: 'Sí, nuestros técnicos están certificados para trabajar con todas las marcas principales: Samsung, LG, Daikin, Hisense, Midea, Gree, Shoot, Anwo, Kendal, entre otras. También trabajamos con equipos industriales y sistemas VRF.'
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
      answerDefault: 'Aceptamos diferentes metodos de pago: Efectivo, transferencia bancaria, tarjetas de crédito y débito.'
    },
    {
      questionKey: 'landing.faq.q7.question',
      questionDefault: '¿Cubren toda la Región Metropolitana?',
      answerKey: 'landing.faq.q7.answer',
      answerDefault: 'Sí, cubrimos toda la Región Metropolitana sin costo adicional de traslado. Para regiones cercanas, también ofrecemos servicio con un cargo por distancia.'
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