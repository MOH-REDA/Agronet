import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { getMarketplaceCopy } from './marketplaceCopy';

const AvailabilityBadge = ({ availability }) => {
  const { language } = useLanguage(); const c = getMarketplaceCopy(language);
  if (!availability) return null;
  const label = availability.status === 'available_today' ? c.today : availability.status === 'available_tomorrow' ? c.tomorrow : `${c.bookedUntil} ${new Date(`${availability.date}T00:00:00`).toLocaleDateString(language,{month:'short',day:'numeric'})}`;
  return <span className={`availability-badge ${availability.status}`}>{label}</span>;
};

export default AvailabilityBadge;
