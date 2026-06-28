import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import './Footer.css';

const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer>
      <div className="cta-section"><div className="container text-center">
        <h2 className="cta-title">{t('footer.ready')}</h2>
        <p className="cta-description">{t('footer.copy')}</p>
        <div className="cta-buttons"><Link to="/register" className="btn btn-light btn-lg me-3">{t('footer.start')}</Link><Link to="/contact" className="btn btn-outline-light btn-lg">{t('footer.sales')}</Link></div>
      </div></div>
      <div className="footer-content"><div className="container"><div className="row">
        <div className="col-lg-3 mb-4"><div className="footer-brand"><h3>AgroNet</h3><p>{t('footer.copy')}</p></div></div>
        <div className="col-lg-3 mb-4"><h4>{t('footer.quick')}</h4><ul className="footer-links"><li><Link to="/about">{t('nav.about')}</Link></li><li><Link to="/equipment">{t('nav.marketplace')}</Link></li><li><Link to="/how-it-works">{t('nav.how')}</Link></li><li><Link to="/contact">{t('nav.contact')}</Link></li></ul></div>
        <div className="col-lg-3 mb-4"><h4>{t('footer.support')}</h4><ul className="footer-links"><li><Link to="/contact">FAQ</Link></li><li><Link to="/contact">Conditions d’utilisation</Link></li><li><Link to="/contact">Confidentialité</Link></li><li><Link to="/contact">Centre d’aide</Link></li></ul></div>
        <div className="col-lg-3 mb-4"><h4>Social</h4><ul className="footer-links"><li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a></li><li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a></li><li><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a></li></ul></div>
      </div></div></div>
      <div className="footer-bottom"><div className="container footer-bottom-inner"><p>© {new Date().getFullYear()} AgroNet. {t('footer.rights')}</p><div className="footer-language"><span>{t('nav.language')}</span><LanguageSwitcher compact /></div></div></div>
    </footer>
  );
};

export default Footer;
