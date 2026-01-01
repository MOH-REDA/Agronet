import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Equipment.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const BASE_URL = 'http://localhost:8000/api'; // Updated to match API URL

// Fix default marker icon for leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const EquipmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);

  useEffect(() => {
    api.get(`/equipment/${id}`)
      .then(res => setEquipment(res.data.equipment || res.data))
      .catch(() => setEquipment(null));
  }, [id]);

  if (!equipment) return <div className="equipment-listing-page"><div className="listing-container">Loading...</div></div>;

  // Always use the backend path as local storage
  let imageUrl = '';
  if (equipment.images && equipment.images.length > 0) {
    let imgPath = equipment.images[0].replace(/\\/g, '/').trim();
    imgPath = imgPath.replace(/^\/+/, '');
    // Remove any leading 'storage/' if present
    if (imgPath.startsWith('storage/')) {
      imgPath = imgPath.substring('storage/'.length);
    }
    // Prepend 'equipment/' if not present
    if (!imgPath.startsWith('equipment/')) {
      imgPath = 'equipment/' + imgPath;
    }
    imageUrl = 'http://localhost:8000/storage/' + imgPath;
  }

  // Helper to mask contact phone
  const maskPhone = (phone) => {
    if (!phone) return 'N/A';
    return phone.replace(/.(?=.{4})/g, '*');
  };
  // Helper to shorten location
  const getShortLocation = (eq) => {
    let loc = eq.address || '';
    if (eq.city) loc = loc ? `${loc}, ${eq.city}` : eq.city;
    if (eq.state) loc = loc ? `${loc}, ${eq.state}` : eq.state;
    return loc;
  };
  // Helper for license
  const getLicenseStatus = (license) => license && license.length > 3 ? 'Yes' : 'No';
  // Helper for description
  const getDescription = (desc) => {
    if (!desc || desc.length < 5 || /[a-zA-Z]/.test(desc) === false) return <span style={{ color: '#aaa' }}>No description</span>;
    return desc;
  };

  return (
    <div className="equipment-listing-page" style={{ minHeight: '100vh', background: '#fafcf9' }}>
      <div className="listing-container" style={{ maxWidth: 900, margin: '40px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(44,62,80,0.08)', padding: 32 }}>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 340px', maxWidth: 340 }}>
            {imageUrl ? (
              <img src={imageUrl} alt={equipment.name} style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 10 }} />
            ) : (
              <div style={{ width: '100%', height: 220, background: '#eaf6ea', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 32, borderRadius: 10 }}>No Image</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h2 style={{ marginBottom: 8 }}>{equipment.name}</h2>
            <div className="demand-label" style={{ background: '#2B5727', color: '#fff', marginBottom: 12, display: 'inline-block' }}>{equipment.type}</div>
            <div className="form-group"><b>Year:</b> {equipment.year || 'N/A'} &nbsp; <b>Country:</b> {equipment.country || 'N/A'}</div>
            <div className="form-group"><b>Location:</b> {getShortLocation(equipment)}</div>
            <div className="form-group"><b>Description:</b> {getDescription(equipment.description)}</div>
            <div className="form-group"><b>License/Registration:</b> {getLicenseStatus(equipment.license)}</div>
            {equipment.availableSeasons && equipment.availableSeasons.length > 0 && (
              <div className="form-group"><b>Available Seasons:</b> {equipment.availableSeasons.join(', ')}</div>
            )}
            <div className="form-group"><b>Pricing Type:</b> {equipment.pricingType ? equipment.pricingType.charAt(0).toUpperCase() + equipment.pricingType.slice(1) : 'N/A'}</div>
            {equipment.pricingType === 'manual' ? (
              <div className="form-group">
                <b>Manual Prices:</b>
                <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                  <li>Low: {equipment.price_low || '-'} MAD</li>
                  <li>Medium: {equipment.price_medium || '-'} MAD</li>
                  <li>High: {equipment.price_high || '-'} MAD</li>
                  <li>Very High: {equipment.price_very_high || '-'} MAD</li>
                </ul>
              </div>
            ) : (
              <div className="form-group"><b>Minimum Price:</b> {equipment.minPrice ? `${equipment.minPrice} MAD/day` : 'N/A'}</div>
            )}
            <div className="form-group"><b>Minimum Rental Days:</b> {equipment.minRentalDays || 'N/A'}</div>
            <div className="form-group"><b>Deposit:</b> {equipment.deposit ? `${equipment.deposit} MAD` : 'N/A'}</div>
            <div className="form-group"><b>Contact Info:</b> {maskPhone(equipment.contactPhone)} <button className="btn btn-sm btn-outline-primary" style={{ marginLeft: 8 }}>Request Full Contact</button></div>
            {equipment.lat && equipment.lng && (
              <div className="form-group" style={{ marginTop: 24 }}>
                <b>Map Location:</b>
                <div style={{ height: 220, width: '100%', borderRadius: 10, overflow: 'hidden', marginTop: 8, boxShadow: '0 2px 8px rgba(44,62,80,0.10)' }}>
                  <MapContainer center={[equipment.lat, equipment.lng]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} dragging={false} doubleClickZoom={false} zoomControl={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[equipment.lat, equipment.lng]}>
                      <Popup>{equipment.name}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button className="btn btn-success" onClick={() => navigate(`/equipment/${equipment.id}/reserve`)}>Reserve Now</button>
              <button className="btn btn-outline-secondary" onClick={() => navigate('/equipment')}>Back to Equipment</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDetails; 