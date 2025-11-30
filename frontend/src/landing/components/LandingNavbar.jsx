import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';

// Logo importado como asset
import logoImg from '/logo-kmts.png';

const LandingNavbar = () => {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      // Detectar sección actual
      const sections = [
        'hero',
        'servicios', 
        'equipos', 
        'como-funciona', 
        'testimonios',
        'faq', 
        'contacto'
      ];
      
      const navbarHeight = 100;
      
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= navbarHeight && rect.bottom > navbarHeight) {
            setCurrentSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileOpen(false);
  };

  return (
    <nav className={`landing-navbar ${scrolled ? 'scrolled' : ''} section-${currentSection}`}>
      <div className="landing-container navbar-content">
        <Link to="/landing" className="navbar-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src={logoImg} alt="KMTS Powertech" />
        </Link>

        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`navbar-links ${mobileOpen ? 'mobile-open' : ''}`}>
          <button className="nav-link" onClick={() => scrollToSection('servicios')}>
            {t('landing.nav.services', 'Servicios')}
          </button>
          <button className="nav-link" onClick={() => scrollToSection('equipos')}>
            {t('landing.nav.equipment', 'Equipos')}
          </button>
          <button className="nav-link" onClick={() => scrollToSection('como-funciona')}>
            {t('landing.nav.howItWorks', 'Cómo Funciona')}
          </button>
          <button className="nav-link" onClick={() => scrollToSection('faq')}>
            {t('landing.nav.faq', 'FAQ')}
          </button>
          <button className="nav-link" onClick={() => scrollToSection('contacto')}>
            {t('landing.nav.contact', 'Contacto')}
          </button>
          <Link to="/admin" className="nav-cta">
            {t('landing.nav.adminAccess', 'Acceso Admin')}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;