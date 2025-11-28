import { useTranslation } from 'react-i18next';
import { Star, MessageSquare } from 'lucide-react';

const Testimonials = () => {
  const { t } = useTranslation();

  const testimonials = [
    {
      id: 1,
      text: 'Excelente servicio. Instalaron mi aire acondicionado en tiempo récord y el equipo funciona perfectamente. Muy profesionales.',
      author: 'María González',
      role: 'Ñuñoa, Santiago',
      rating: 5,
      initial: 'MG'
    },
    {
      id: 2,
      text: 'Contraté el mantenimiento preventivo para mi oficina y quedé muy satisfecho. El técnico fue puntual y muy detallista en su trabajo.',
      author: 'Carlos Rodríguez',
      role: 'Las Condes, Santiago',
      rating: 5,
      initial: 'CR'
    },
    {
      id: 3,
      text: 'Mi aire acondicionado dejó de enfriar un viernes a las 8pm. Llamé y en menos de 2 horas tenía un técnico en mi casa. Increíble servicio 24/7.',
      author: 'Patricia Muñoz',
      role: 'Providencia, Santiago',
      rating: 5,
      initial: 'PM'
    }
  ];

  return (
    <section className="testimonials-section">
      <div className="landing-container">
        <div className="section-header animate-on-scroll">
          <span className="section-label">
            <MessageSquare size={16} />
            {t('landing.testimonials.label', 'Testimonios')}
          </span>
          <h2 className="section-title">
            {t('landing.testimonials.title', 'Lo Que Dicen Nuestros Clientes')}
          </h2>
          <p className="section-description">
            {t('landing.testimonials.description', 'La satisfacción de nuestros clientes es nuestra mejor carta de presentación.')}
          </p>
        </div>

        <div className="testimonials-grid stagger-children">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card">
              <span className="testimonial-quote">"</span>
              <p className="testimonial-text">{testimonial.text}</p>
              
              <div className="testimonial-author">
                <div className="testimonial-avatar">
                  {testimonial.initial}
                </div>
                <div className="testimonial-author-info">
                  <h4>{testimonial.author}</h4>
                  <p>{testimonial.role}</p>
                  <div className="testimonial-rating">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} size={16} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
