import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import './LanguageSwitcher.css';

const LanguageSwitcher = ({ compact = false }) => {
  const { language, setLanguage, t } = useLanguage();
  return (
    <label className={`language-switcher${compact ? ' compact' : ''}`} title={t('nav.language')}>
      <Languages size={16} aria-hidden="true" />
      <span className="visually-hidden">{t('nav.language')}</span>
      <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label={t('nav.language')}>
        <option value="fr">FR</option><option value="en">EN</option><option value="ar">AR</option>
      </select>
    </label>
  );
};

export default LanguageSwitcher;
