import React, { useEffect, useState } from 'react';
import { API_URL } from '../../config/api';
import { getSocialProviders } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { getAuthCopy } from './authCopy';

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.4a4.7 4.7 0 0 1-2 3v2.8h3.3c1.9-1.8 2.9-4.4 2.9-7.9Z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.8c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4H3.1v2.9A10.1 10.1 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.5 13.8a6 6 0 0 1 0-3.7V7.2H3.1a10.1 10.1 0 0 0 0 9.5l3.4-2.9Z" />
    <path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.8 9.8 0 0 0 3.1 7.2l3.4 2.9A5.9 5.9 0 0 1 12 6.1Z" />
  </svg>
);

const FacebookMark = () => <span className="auth-facebook-mark" aria-hidden="true">f</span>;

const SocialLoginButtons = ({ mode = 'login' }) => {
  const { language } = useLanguage();
  const c = getAuthCopy(language);
  const label = mode === 'register' ? c.signUp : c.continue;
  const [providers, setProviders] = useState({ google: false, facebook: false });

  useEffect(() => {
    let active = true;
    getSocialProviders()
      .then((data) => active && setProviders(data))
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const openProvider = (provider) => {
    window.location.assign(`${API_URL}/auth/${provider}/redirect`);
  };

  return (
    <div className="auth-social-area">
      <div className="auth-social-grid">
        <button
          type="button"
          className="auth-social-button"
          onClick={() => openProvider('google')}
          disabled={!providers.google}
          title={providers.google ? `${label} ${c.with} Google` : c.socialSetup}
        >
          <GoogleMark />
          <span>{label} {c.with} Google</span>
        </button>
        <button
          type="button"
          className="auth-social-button"
          onClick={() => openProvider('facebook')}
          disabled={!providers.facebook}
          title={providers.facebook ? `${label} ${c.with} Facebook` : c.socialSetup}
        >
          <FacebookMark />
          <span>{label} {c.with} Facebook</span>
        </button>
      </div>
      {!providers.google && !providers.facebook && (
        <p className="auth-provider-note">{c.socialDisabled}</p>
      )}
      <div className="auth-divider"><span>{c.orEmail}</span></div>
    </div>
  );
};

export default SocialLoginButtons;
