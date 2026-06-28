import React, { memo } from 'react';
import { BadgeCheck, Grid3X3, Tractor } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { getMarketplaceCopy } from './marketplaceCopy';

const MarketplaceStats = memo(({ stats }) => {
  const { language } = useLanguage(); const c = getMarketplaceCopy(language);
  if (!stats) return null;
  return <div className="marketplace-stats"><span><Tractor size={14}/><strong>{stats.machines}</strong> {c.machines}</span><span><Grid3X3 size={14}/><strong>{stats.categories}</strong> {c.categories}</span><span><BadgeCheck size={14}/><strong>{stats.verified_owners}</strong> {c.verifiedOwners}</span>{Number(stats.average_rating)>0&&<span><strong>★ {stats.average_rating}</strong> {c.average}</span>}</div>;
});

MarketplaceStats.displayName = 'MarketplaceStats';
export default MarketplaceStats;
