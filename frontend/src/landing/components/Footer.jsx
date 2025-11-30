import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Instagram } from 'lucide-react';

// Logo
import logoImg from '/logo-kmts.png';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="landing-footer">
      <div className="landing-container">
        <div className="footer-content">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={logoImg} alt="KMTS Powertech" />
            </div>
            <p>
              {t('landing.footer.description', 'Expertos en climatización con más de años de experiencia. Soluciones profesionales para hogares y empresas en toda la Región Metropolitana.')}
            </p>
            <div className="social-links">
              <a 
                href="https://instagram.com/kmts_powertech"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link-with-text"
                aria-label="Instagram"
              >
                <Instagram />
                <span>@kmts_powertech</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-column">
            <h4>{t('landing.footer.quickLinks', 'Enlaces Rápidos')}</h4>
            <ul className="footer-links">
              <li>
                <button onClick={() => scrollToSection('servicios')}>
                  {t('landing.nav.services', 'Servicios')}
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('equipos')}>
                  {t('landing.nav.equipment', 'Equipos')}
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('como-funciona')}>
                  {t('landing.nav.howItWorks', 'Cómo Funciona')}
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('faq')}>
                  {t('landing.nav.faq', 'FAQ')}
                </button>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="footer-column">
            <h4>{t('landing.footer.services', 'Servicios')}</h4>
            <ul className="footer-links">
              <li><a href="#servicios">{t('landing.services.installation.title', 'Instalación')}</a></li>
              <li><a href="#servicios">{t('landing.services.maintenance.title', 'Mantenimiento')}</a></li>
              <li><a href="#servicios">{t('landing.services.repair.title', 'Reparación')}</a></li>
              <li><a href="#servicios">{t('landing.services.emergency.title', 'Emergencias 24/7')}</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-column">
            <h4>{t('landing.footer.contact', 'Contacto')}</h4>
            <ul className="footer-links">
              <li>
                <a href="tel:+56954610454">+56 9 5461 0454</a>
              </li>
              <li>
                <a href="mailto:kmtspowertech@gmail.com">kmtspowertech@gmail.com</a>
              </li>
              <li>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Av. Irarrázaval 5185, Of. 503
                  <br />
                  Ñuñoa, Santiago
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} KMTS Powertech SPA. {t('landing.footer.rights', 'Todos los derechos reservados.')}
          </p>
          <p className="footer-price-disclaimer">
            {t('landing.footer.priceDisclaimer', '* Los precios publicados corresponden al valor del equipo con IVA incluido. El servicio de instalación no está incluido y se cotiza de forma independiente.')}
          </p>
          <div className="footer-legal">
            <Link to="/admin">
              {t('landing.footer.adminAccess', 'Acceso Administrador')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
