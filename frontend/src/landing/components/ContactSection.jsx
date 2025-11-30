import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send,
  Instagram,
  Loader2,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const ContactSection = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    servicio: '',
    mensaje: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Número de WhatsApp (sin + ni espacios)
  const whatsappNumber = '56954610454';
  const businessEmail = 'kmtspowertech@gmail.com';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getServiceLabel = (value) => {
    const services = {
      'instalacion': 'Instalación',
      'mantenimiento': 'Mantenimiento',
      'reparacion': 'Reparación',
      'cotizacion': 'Cotización de equipo',
      'otro': 'Otro'
    };
    return services[value] || value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Construir mensaje para WhatsApp
      const whatsappMessage = `¡Hola! Me contacto desde la web de KMTS Powertech.

*Datos de contacto:*
• Nombre: ${formData.nombre}
• Teléfono: ${formData.telefono}
• Email: ${formData.email}
${formData.servicio ? `• Servicio: ${getServiceLabel(formData.servicio)}` : ''}

${formData.mensaje ? `*Mensaje:*\n${formData.mensaje}` : ''}

Quedo atento a su respuesta. ¡Gracias!`;

      // Construir URL de WhatsApp
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

      // Construir mailto como respaldo
      const emailSubject = `Contacto Web - ${getServiceLabel(formData.servicio) || 'Consulta General'}`;
      const emailBody = `Datos de contacto:
- Nombre: ${formData.nombre}
- Teléfono: ${formData.telefono}
- Email: ${formData.email}
- Servicio: ${getServiceLabel(formData.servicio) || 'No especificado'}

Mensaje:
${formData.mensaje || 'Sin mensaje adicional'}`;

      const mailtoUrl = `mailto:${businessEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

      // Abrir WhatsApp en nueva pestaña
      window.open(whatsappUrl, '_blank');

      // Abrir email en paralelo (el usuario puede elegir enviar o no)
      // Pequeño delay para que no se bloqueen entre sí
      setTimeout(() => {
        window.location.href = mailtoUrl;
      }, 1000);

      setSubmitted(true);
      toast.success(t('landing.contact.successMessage', '¡Redirigiendo a WhatsApp y Email!'));
      
      // Reset form después de un momento
      setTimeout(() => {
        setFormData({
          nombre: '',
          email: '',
          telefono: '',
          servicio: '',
          mensaje: ''
        });
        setSubmitted(false);
      }, 3000);

    } catch (error) {
      toast.error(t('landing.contact.errorMessage', 'Error al enviar. Intenta de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = {
    phone: '+56 9 5461 0454',
    email: 'kmtspowertech@gmail.com',
    address: 'Av. Irarrázaval 5185, Of. 503, Ñuñoa, Santiago',
    hours: '24/7 - Siempre disponibles',
    instagram: 'kmts_powertech'
  };

  return (
    <section id="contacto" className="contact-section">
      <div className="landing-container">
        <div className="contact-grid">
          {/* Contact Info */}
          <div className="contact-info animate-on-scroll">
            <h2>{t('landing.contact.title', 'Contáctanos')}</h2>
            <p>
              {t('landing.contact.description', 'Estamos listos para ayudarte con todas tus necesidades de climatización. Contáctanos y recibe una cotización sin compromiso.')}
            </p>

            <div className="contact-methods">
              <div className="contact-method">
                <div className="contact-method-icon">
                  <Phone />
                </div>
                <div className="contact-method-content">
                  <h4>{t('landing.contact.phoneLabel', 'Teléfono')}</h4>
                  <p>
                    <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}>
                      {contactInfo.phone}
                    </a>
                  </p>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-method-icon">
                  <Mail />
                </div>
                <div className="contact-method-content">
                  <h4>{t('landing.contact.emailLabel', 'Email')}</h4>
                  <p>
                    <a href={`mailto:${contactInfo.email}`}>
                      {contactInfo.email}
                    </a>
                  </p>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-method-icon">
                  <MapPin />
                </div>
                <div className="contact-method-content">
                  <h4>{t('landing.contact.addressLabel', 'Dirección')}</h4>
                  <p>{contactInfo.address}</p>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-method-icon">
                  <Clock />
                </div>
                <div className="contact-method-content">
                  <h4>{t('landing.contact.hoursLabel', 'Horario')}</h4>
                  <p>{contactInfo.hours}</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="social-links">
              <a 
                href={`https://instagram.com/${contactInfo.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Instagram"
              >
                <Instagram />
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-form-container animate-on-scroll">
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nombre">
                    {t('landing.contact.form.name', 'Nombre')} *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder={t('landing.contact.form.namePlaceholder', 'Tu nombre')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="telefono">
                    {t('landing.contact.form.phone', 'Teléfono')} *
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="+56 9 XXXX XXXX"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  {t('landing.contact.form.email', 'Email')} *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('landing.contact.form.emailPlaceholder', 'tu@email.com')}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="servicio">
                  {t('landing.contact.form.service', 'Servicio de interés')}
                </label>
                <select
                  id="servicio"
                  name="servicio"
                  value={formData.servicio}
                  onChange={handleChange}
                >
                  <option value="">{t('landing.contact.form.serviceSelect', 'Selecciona un servicio')}</option>
                  <option value="instalacion">{t('landing.contact.form.serviceInstall', 'Instalación')}</option>
                  <option value="mantenimiento">{t('landing.contact.form.serviceMaintenance', 'Mantenimiento')}</option>
                  <option value="reparacion">{t('landing.contact.form.serviceRepair', 'Reparación')}</option>
                  <option value="cotizacion">{t('landing.contact.form.serviceQuote', 'Cotización de equipo')}</option>
                  <option value="otro">{t('landing.contact.form.serviceOther', 'Otro')}</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="mensaje">
                  {t('landing.contact.form.message', 'Mensaje')}
                </label>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleChange}
                  placeholder={t('landing.contact.form.messagePlaceholder', 'Cuéntanos sobre tu proyecto o necesidad...')}
                  rows={4}
                />
              </div>

              <button 
                type="submit" 
                className="form-submit"
                disabled={loading || submitted}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    {t('landing.contact.form.sending', 'Enviando...')}
                  </>
                ) : submitted ? (
                  <>
                    <CheckCircle size={20} />
                    {t('landing.contact.form.sent', '¡Enviado!')}
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    {t('landing.contact.form.submit', 'Enviar Mensaje')}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;