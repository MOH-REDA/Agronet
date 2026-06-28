import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, BadgeCheck, Calendar, CheckCircle2, Fuel, Gauge, Heart, MapPin, Navigation, ShieldCheck, Star, Truck, Wrench } from 'lucide-react';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import api, { addEquipmentFavorite, getFavoriteEquipmentIds, removeEquipmentFavorite } from '../../services/api';
import { getPublicMediaUrl, getStorageUrl } from '../../config/api';
import './Equipment.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const formatOwnerName = user => [user?.prenom, user?.name].filter(Boolean).join(' ') || 'AgroNet owner';
const money = value => `${Number(value || 0).toLocaleString('fr-MA')} MAD`;

const EquipmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    Promise.all([api.get(`/equipment/${id}`), getFavoriteEquipmentIds().catch(() => ({ data: [] }))])
      .then(([response, favorites]) => {
        setEquipment(response.data.equipment || response.data);
        const values = favorites?.data?.data || favorites?.data || [];
        setFavorite(values.map(Number).includes(Number(id)));
      })
      .catch(() => setEquipment(null))
      .finally(() => setLoading(false));
  }, [id]);

  const images = useMemo(() => (equipment?.images || []).map(getStorageUrl), [equipment]);
  const rate = Number(equipment?.minPrice || equipment?.price || equipment?.daily_rate || 0);
  const owner = equipment?.user;
  const ownerAvatarUrl = owner?.avatar_url
    ? getPublicMediaUrl(owner.avatar_url)
    : owner?.avatar_path
      ? getPublicMediaUrl(`/storage/${owner.avatar_path.replace(/^\/+/, '')}`)
      : '';
  const rating = Number(equipment?.reviews_avg_rating || owner?.reviews_received_avg_rating || 0);
  const reviewCount = Number(equipment?.reviews_count || owner?.reviews_received_count || 0);
  const location = [equipment?.city, equipment?.state, equipment?.country].filter(Boolean).join(', ');
  const specs = equipment ? [
    equipment.hp && { icon: Gauge, label: 'Power', value: `${equipment.hp} HP` },
    equipment.year && { icon: Calendar, label: 'Year', value: equipment.year },
    equipment.fuel_type && { icon: Fuel, label: 'Fuel', value: equipment.fuel_type },
    equipment.transmission && { icon: Wrench, label: 'Transmission', value: equipment.transmission },
    equipment.gps_ready && { icon: Navigation, label: 'Navigation', value: 'GPS ready' },
    equipment.machine_condition && { icon: CheckCircle2, label: 'Condition', value: equipment.machine_condition },
  ].filter(Boolean) : [];

  const toggleFavorite = async () => {
    const next = !favorite;
    setFavorite(next);
    try {
      if (next) await addEquipmentFavorite(id); else await removeEquipmentFavorite(id);
      window.dispatchEvent(new Event('agronet:favorites-updated'));
    } catch { setFavorite(!next); }
  };

  if (loading) return <div className="equipment-detail-page"><div className="detail-loading"><span className="spinner" /> Loading equipment…</div></div>;
  if (!equipment) return <div className="equipment-detail-page"><div className="detail-loading">This equipment could not be loaded. <button onClick={() => navigate('/equipment')}>Back to marketplace</button></div></div>;

  return (
    <main className="equipment-detail-page">
      <div className="equipment-detail-shell">
        <button className="detail-back" onClick={() => navigate('/equipment')}><ArrowLeft size={17} /> Back to marketplace</button>

        <section className="detail-heading">
          <div>
            <div className="detail-title-line"><span className="detail-type">{equipment.type}</span>{equipment.instant_booking && <span className="detail-trust-badge"><CheckCircle2 size={14} /> Instant booking</span>}</div>
            <h1>{equipment.name}</h1>
            <div className="detail-meta">
              {rating > 0 && <span><Star size={16} fill="currentColor" /> {rating.toFixed(1)} · {reviewCount} review{reviewCount === 1 ? '' : 's'}</span>}
              {location && <span><MapPin size={16} /> {location}</span>}
              {equipment.completed_hires_count > 0 && <span>{equipment.completed_hires_count} completed hire{equipment.completed_hires_count === 1 ? '' : 's'}</span>}
            </div>
          </div>
          <button className={`detail-favorite ${favorite ? 'active' : ''}`} onClick={toggleFavorite} aria-label={favorite ? 'Remove from saved equipment' : 'Save equipment'}><Heart size={19} fill={favorite ? 'currentColor' : 'none'} /> {favorite ? 'Saved' : 'Save'}</button>
        </section>

        <section className="detail-gallery">
          <div className="detail-main-image">
            {images.length ? <img src={images[activeImage]} alt={`${equipment.name} view ${activeImage + 1}`} /> : <div className="detail-image-empty">No equipment photo available</div>}
          </div>
          {images.length > 1 && <div className="detail-thumbnails">{images.slice(0, 5).map((src, index) => <button key={src} className={activeImage === index ? 'active' : ''} onClick={() => setActiveImage(index)}><img src={src} alt={`View ${index + 1}`} /></button>)}</div>}
        </section>

        <div className="detail-layout">
          <div className="detail-main-column">
            <section className="detail-section detail-owner">
              <div className="detail-owner-avatar">{ownerAvatarUrl && !avatarFailed ? <img src={ownerAvatarUrl} alt={formatOwnerName(owner)} onError={() => setAvatarFailed(true)} /> : formatOwnerName(owner).charAt(0)}</div>
              <div><small>Listed by</small><h2>{formatOwnerName(owner)} {owner?.is_verified_owner && <BadgeCheck size={19} aria-label="Verified owner" />}</h2><p>{owner?.is_verified_owner ? 'Identity verified by AgroNet' : 'Member of the AgroNet community'}</p></div>
            </section>

            {specs.length > 0 && <section className="detail-section"><h2>Machine specifications</h2><div className="detail-spec-grid">{specs.map(({ icon: Icon, label, value }) => <div key={label}>{React.createElement(Icon, { size: 20 })}<span><small>{label}</small><strong>{value}</strong></span></div>)}</div></section>}

            <section className="detail-section"><h2>About this equipment</h2><p className="detail-description">{equipment.description || 'The owner has not added a detailed description yet. Ask any specific questions in your booking notes.'}</p></section>

            <section className="detail-section"><h2>What this booking offers</h2><div className="detail-benefits">
              {equipment.delivery_available && <div><Truck size={20} /><span><strong>Delivery available</strong><small>Confirm distance and delivery details with the owner.</small></span></div>}
              <div><ShieldCheck size={20} /><span><strong>{equipment.insurance_included ? 'Insurance included' : 'AgroNet payment protection'}</strong><small>Your booking and payment status are tracked on the platform.</small></span></div>
              {equipment.recently_serviced_at && <div><Wrench size={20} /><span><strong>Recently serviced</strong><small>Maintenance information was recently updated by the owner.</small></span></div>}
            </div></section>

            {equipment.lat && equipment.lng && <section className="detail-section"><h2>Approximate location</h2><p className="detail-section-note">The exact pickup address is shared as part of the confirmed booking.</p><div className="detail-map"><MapContainer center={[Number(equipment.lat), Number(equipment.lng)]} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Marker position={[Number(equipment.lat), Number(equipment.lng)]}><Popup>{equipment.name}</Popup></Marker></MapContainer></div></section>}
          </div>

          <aside className="detail-booking-card">
            <div className="detail-price"><strong>{money(rate)}</strong><span>/ day</span></div>
            <p className="detail-availability"><CheckCircle2 size={17} /> Available to request</p>
            <div className="detail-booking-facts">
              <div><span>Minimum rental</span><strong>{equipment.minRentalDays || 1} day{Number(equipment.minRentalDays || 1) === 1 ? '' : 's'}</strong></div>
              <div><span>Refundable deposit</span><strong>{money(equipment.deposit)}</strong></div>
              <div><span>Booking type</span><strong>{equipment.instant_booking ? 'Instant' : 'Owner approval'}</strong></div>
            </div>
            <button className="detail-reserve-btn" onClick={() => navigate(`/equipment/${equipment.id}/reserve`)}>Check dates & reserve</button>
            <p className="detail-no-charge">You won’t be charged at this step.</p>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default EquipmentDetails;
