import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LandingNavbar,
  HeroSection,
  ServicesSection,
  EquipmentCatalog,
  HowItWorks,
  Testimonials,
  FAQ,
  ContactSection,
  Footer
} from '../components';
import AboutUs from '../components/AboutUs';

// Styles
import '../styles/landing.css';

const LandingPage = () => {
  const { i18n } = useTranslation();

  // Scroll animations observer
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
        }
      });
    }, observerOptions);

    // Observe all animate elements
    const animateElements = document.querySelectorAll('.animate-on-scroll, .stagger-children');
    animateElements.forEach(el => observer.observe(el));

    return () => {
      animateElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="landing-page">
      <LandingNavbar />
      <main>
        <HeroSection />
        <ServicesSection />
        <EquipmentCatalog />
        <HowItWorks />
        <AboutUs />
        <Testimonials />
        <FAQ />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;