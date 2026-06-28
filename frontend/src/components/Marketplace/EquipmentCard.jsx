import React, { memo, useState } from 'react';
import { BadgeCheck, CalendarCheck, Heart, MapPin, ShieldCheck, Star, Truck } from 'lucide-react';
import { getPublicMediaUrl } from '../../config/api';
import AvailabilityBadge from './AvailabilityBadge';
import EquipmentSpecs from './EquipmentSpecs';
import { useLanguage } from '../../i18n/LanguageContext';
import { getMarketplaceCopy } from './marketplaceCopy';

const EquipmentCard = memo(({
  item, ownListing, owner, imageUrl, typeClass, favorite, onToggleFavorite, onOpen, onReserve,
}) => {
  const { language } = useLanguage();
  const c = getMarketplaceCopy(language);
  const [imageLoaded, setImageLoaded] = useState(false);
  const recentlyServiced = item.recently_serviced_at && (Date.now() - new Date(item.recently_serviced_at).getTime()) <= 180 * 24 * 60 * 60 * 1000;
  return (
    <article className={`equipment-card ${ownListing ? 'own-equipment-card' : ''}`} role="link" tabIndex={0}
      onClick={event => { if (!event.target.closest('button')) onOpen(); }}
      onKeyDown={event => { if (event.target.closest('button')) return; if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(); } }}>
      <div className="equipment-image-wrap">
        {!imageLoaded && <span className="equipment-image-skeleton" />}
        <img src={imageUrl} alt={item.name} className={`equipment-image${imageLoaded ? ' loaded' : ''}`} loading="lazy" decoding="async" onLoad={() => setImageLoaded(true)} onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/farm-field.jpeg'; setImageLoaded(true); }} />
        <div className="image-labels">
          <div className="card-badge-stack">
            {item.type && <span className={`equipment-type equipment-type--${typeClass}`}>{item.type}</span>}
            <AvailabilityBadge availability={item.availability} />
          </div>
          {ownListing && <span className="owner-listing-badge">{c.yourListing}</span>}
        </div>
        {!ownListing && (
          <button className={`favorite-button${favorite ? ' active' : ''}`} onClick={onToggleFavorite} aria-label={`${favorite ? c.removeFavorite : c.addFavorite}: ${item.name}`} aria-pressed={favorite}>
            <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      <div className="card-content">
        <div className="card-title-row"><h3>{item.name}</h3>{item.brand && <span>{item.brand}</span>}</div>
        <div className="price"><strong>{item.minPrice || item.price || 0} MAD</strong><span>/ {c.day}</span></div>
        <p className="subtitle">{item.description || c.noDescription}</p>
        <EquipmentSpecs item={item} />
        <div className="trust-badge-row">
          {item.delivery_available && <span><Truck size={12} /> {c.delivery}</span>}
          {item.instant_booking && <span><CalendarCheck size={12} /> {c.instant}</span>}
          {item.insurance_included && <span><ShieldCheck size={12} /> {c.insured}</span>}
          {recentlyServiced && <span><ShieldCheck size={12} /> {c.serviced}</span>}
        </div>
        <div className="status-row"><span className="location"><MapPin size={15} />{item.city || item.state || item.address || '-'}</span></div>
        <div className="equipment-card-footer">
          <div className="equipment-owner">
            <span className="equipment-owner-avatar" aria-hidden="true">{item.user?.avatar_url ? <img src={getPublicMediaUrl(item.user.avatar_url)} alt="" /> : owner.initials}</span>
            <span className="equipment-owner-copy"><small>{c.listedBy}</small><strong>{ownListing ? c.you : owner.fullName}</strong>
              <span className="equipment-owner-trust">
                {item.user?.is_verified_owner && <><BadgeCheck size={11} fill="currentColor" /> {c.verifiedOwner}</>}
                {Number(item.user?.reviews_received_avg_rating) > 0 && <><Star size={11} fill="currentColor" /> {Number(item.user.reviews_received_avg_rating).toFixed(1)} ({item.user.reviews_received_count})</>}
                {!item.user?.is_verified_owner && !Number(item.user?.reviews_received_avg_rating) && (
                  Number(item.completed_hires_count) > 0 ? <><ShieldCheck size={11} /> {item.completed_hires_count} {c.hires}</> : <><ShieldCheck size={11} /> {c.newOwner}</>
                )}
              </span>
            </span>
          </div>
          <button className={`reserve-btn equipment-action-btn${ownListing ? ' manage-listing-btn' : ''}`} disabled={!ownListing && item.status !== 'active'} onClick={onReserve}>
            <CalendarCheck size={16} />{ownListing ? c.manage : item.status === 'active' ? c.reserve : c.unavailable}
          </button>
        </div>
      </div>
    </article>
  );
});

EquipmentCard.displayName = 'EquipmentCard';
export default EquipmentCard;
