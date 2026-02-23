import { useState, useEffect } from 'react';
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

// Grilla de precios de mantenimiento
const MAINTENANCE_PRICING = {
  '9000-12000': {
    label: '9.000 - 12.000 BTU',
    premium: 55000,
    full: 48500,
    basico: 28500
  },
  '18000-36000': {
    label: '18.000 - 36.000 BTU',
    premium: 70000,
    full: 55000,
    basico: 30000
  }
};

const MAINTENANCE_TYPES = {
  premium: 'Premium',
  full: 'Full',
  basico: 'Básico'
};

const formatCLP = (amount) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);

const ContactSection = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    servicio: '',
    rangoCapacidad: '',
    tipoMantenimiento: '',
    mensaje: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Escuchar evento de cotización desde el catálogo de equipos
  useEffect(() => {
    const handleQuoteRequest = (e) => {
      const { marca, modelo, capacidad, precio } = e.detail;
      const precioFormateado = precio
        ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(precio)
        : '';

      const capacidadNorm = String(capacidad).replace(/\s*BTU\s*/i, '').trim();

      setFormData(prev => ({
        ...prev,
        servicio: 'cotizacion-equipo',
        mensaje: `Equipo de interés: ${marca} ${modelo} (${capacidadNorm} BTU)${precioFormateado ? ` - Precio ref: ${precioFormateado}` : ''}.`
      }));
    };

    window.addEventListener('equipment-quote-request', handleQuoteRequest);
    return () => window.removeEventListener('equipment-quote-request', handleQuoteRequest);
  }, []);

  // Número de WhatsApp (sin + ni espacios)
  const whatsappNumber = '56954610454';
  const businessEmail = 'kmtspowertech@gmail.com';

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Resetear sub-campos de mantenimiento al cambiar de servicio
    if (name === 'servicio' && value !== 'mantenimiento') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        rangoCapacidad: '',
        tipoMantenimiento: ''
      }));
      return;
    }

    // Resetear tipo al cambiar rango de capacidad
    if (name === 'rangoCapacidad') {
      setFormData(prev => ({
        ...prev,
        rangoCapacidad: value,
        tipoMantenimiento: ''
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getServiceLabel = (value) => {
    const services = {
      'cotizacion-equipo': 'Cotización de equipo + instalación',
      'instalacion': 'Solo instalación (ya tengo equipo)',
      'mantenimiento': 'Mantenimiento preventivo',
      'reparacion': 'Reparación / Diagnóstico',
      'otro': 'Otra consulta'
    };
    return services[value] || value;
  };

  const getServiceDescription = (value) => {
    // Mensaje especial para mantenimiento con sub-opciones seleccionadas
    if (value === 'mantenimiento' && formData.rangoCapacidad && formData.tipoMantenimiento) {
      const rangoLabel = MAINTENANCE_PRICING[formData.rangoCapacidad]?.label || formData.rangoCapacidad;
      const tipoLabel = MAINTENANCE_TYPES[formData.tipoMantenimiento] || formData.tipoMantenimiento;
      const precio = MAINTENANCE_PRICING[formData.rangoCapacidad]?.[formData.tipoMantenimiento];
      const precioStr = precio ? ` Precio desde: ${formatCLP(precio)}.` : '';

      return `Necesito agendar un mantenimiento ${tipoLabel} para mi equipo Split de muro de ${rangoLabel}.${precioStr}`;
    }

    const descriptions = {
      'cotizacion-equipo': 'Quiero cotizar un equipo de aire acondicionado. Me gustaría coordinar una visita técnica para evaluar el espacio y recibir una cotización detallada del equipo y el costo de instalación según el tipo de proyecto.',
      'instalacion': 'Ya cuento con un equipo de aire acondicionado y necesito el servicio de instalación. Me gustaría coordinar una visita técnica para evaluar el espacio y recibir una cotización del servicio.',
      'mantenimiento': 'Necesito agendar un servicio de mantenimiento preventivo para mi equipo de aire acondicionado. Quisiera conocer disponibilidad y costos del servicio.',
      'reparacion': 'Mi equipo de aire acondicionado presenta fallas y requiere revisión técnica. Solicito agendar una visita para diagnóstico y reparación.',
      'otro': 'Tengo una consulta sobre sus servicios de climatización y me gustaría recibir más información.'
    };
    return descriptions[value] || '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Obtener descripción del servicio
      const serviceDescription = getServiceDescription(formData.servicio);

      // Construir mensaje para WhatsApp
      const whatsappMessage = `¡Hola! Me contacto desde la web de KMTS Powertech.

*Datos de contacto:*
• Nombre: ${formData.nombre}
• Teléfono: ${formData.telefono}
• Email: ${formData.email}
${formData.servicio ? `• Servicio: ${getServiceLabel(formData.servicio)}` : ''}

${serviceDescription ? `*Motivo de contacto:*\n${serviceDescription}` : ''}

${formData.mensaje ? `*Mensaje adicional:*\n${formData.mensaje}` : ''}

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

Motivo de contacto:
${serviceDescription || 'No especificado'}

Mensaje adicional:
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
          rangoCapacidad: '',
          tipoMantenimiento: '',
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
    hours: 'Siempre disponibles',
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
                className="social-link-with-text"
                aria-label="Instagram"
              >
                <Instagram />
                <span>@{contactInfo.instagram}</span>
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-form-container animate-on-scroll">
            <div className="contact-form-notice">
              <span className="notice-icon">💡</span>
              <span>{t('landing.contact.priceNotice', 'Los precios de equipos incluyen IVA. El costo de instalación se cotiza según los requerimientos específicos de cada proyecto.')}</span>
            </div>
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
                  <option value="cotizacion-equipo">{t('landing.contact.form.serviceQuote', 'Cotización de equipo + instalación')}</option>
                  <option value="instalacion">{t('landing.contact.form.serviceInstall', 'Solo instalación (ya tengo equipo)')}</option>
                  <option value="mantenimiento">{t('landing.contact.form.serviceMaintenance', 'Mantenimiento preventivo')}</option>
                  <option value="reparacion">{t('landing.contact.form.serviceRepair', 'Reparación / Diagnóstico')}</option>
                  <option value="otro">{t('landing.contact.form.serviceOther', 'Otra consulta')}</option>
                </select>
              </div>

              {/* Sub-selectores de mantenimiento */}
              {formData.servicio === 'mantenimiento' && (
                <div className="maintenance-sub-options">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="rangoCapacidad">Rango del equipo *</label>
                      <select
                        id="rangoCapacidad"
                        name="rangoCapacidad"
                        value={formData.rangoCapacidad}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Selecciona el rango BTU</option>
                        {Object.entries(MAINTENANCE_PRICING).map(([key, { label }]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>

                    {formData.rangoCapacidad && (
                      <div className="form-group">
                        <label htmlFor="tipoMantenimiento">Tipo de mantenimiento *</label>
                        <select
                          id="tipoMantenimiento"
                          name="tipoMantenimiento"
                          value={formData.tipoMantenimiento}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Selecciona el tipo</option>
                          {Object.entries(MAINTENANCE_TYPES).map(([key, label]) => {
                            const precio = MAINTENANCE_PRICING[formData.rangoCapacidad]?.[key];
                            return (
                              <option key={key} value={key}>
                                {label} - desde {precio ? formatCLP(precio) : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}
                  </div>
                  <p className="maintenance-price-note">
                    ⚠️ Los precios pueden variar si se requiere recarga de refrigerante u otros materiales adicionales.
                  </p>
                </div>
              )}

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
