import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import './Equipment.css';

const EquipmentReservationDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { startDate, endDate, equipment: navEquipment } = location.state || {};

  // Use real equipment data from navigation state, fallback to empty object
  const equipment = navEquipment || {};
  const duration = startDate && endDate ? Math.max(0, (new Date(endDate) - new Date(startDate)) / (1000*60*60*24)) : 0;
  const dailyRate = equipment.minPrice || equipment.price || 0;
  const serviceFee = equipment.serviceFee || 0; // fallback if not present
  const total = duration * dailyRate + serviceFee;

  const [insurance, setInsurance] = useState('basic');
  const [notes, setNotes] = useState('');
  const [depositChecked, setDepositChecked] = useState(false);

  // Helper to get image URL like in Equipment.jsx and EquipmentDetails.jsx
  const getImageUrl = (item) => {
    if (item.images && item.images.length > 0) {
      let imgPath = item.images[0];
      if (typeof imgPath === 'string') {
        imgPath = imgPath.replace(/\\/g, '/').trim();
        imgPath = imgPath.replace(/^\/+/, '');
        if (imgPath.startsWith('storage/')) {
          imgPath = imgPath.substring('storage/'.length);
        }
        if (!imgPath.startsWith('equipment/')) {
          imgPath = 'equipment/' + imgPath;
        }
        return 'http://localhost:8000/storage/' + imgPath;
      }
    }
    return '/tractor-placeholder.png';
  };

  return (
    <div className="reservation-page">
      <div className="reservation-content details-step">
        {/* Left: Rental Details */}
        <div className="details-left">
          <div className="reservation-card rental-summary-card">
            <div className="equipment-summary-row">
              <img src={getImageUrl(equipment)} alt={equipment.name || ''} className="equipment-image-sm" />
              <div>
                <div className="equipment-title">{equipment.name}</div>
                <div className="equipment-subtitle">{equipment.subtitle || ''}</div>
                <div className="equipment-features-list">
                  {(equipment.features || []).map(f => <span key={f} className="equipment-feature-badge">{f}</span>)}
                </div>
              </div>
            </div>
            <div className="rental-summary-info">
              <div>Rental Period: <b>{startDate}</b> - <b>{endDate}</b> ({duration} days)</div>
              <div>Pickup Location: {equipment.city || equipment.location || ''}</div>
              <div>Daily Rate: ${dailyRate} × {duration} days</div>
              <div>Service Fee: ${serviceFee}</div>
              <div className="rental-summary-total">Total: <b>${total.toFixed(2)}</b></div>
            </div>
          </div>
          <div className="reservation-card insurance-card">
            <div className="insurance-title">Insurance Options</div>
            <div className={`insurance-option ${insurance === 'basic' ? 'selected' : ''}`} onClick={() => setInsurance('basic')}>
              <input type="radio" checked={insurance === 'basic'} readOnly />
              <div>
                <div className="insurance-label">Basic Coverage</div>
                <div className="insurance-desc">Covers basic damage and liability</div>
                <div className="insurance-price">$25/day included</div>
              </div>
            </div>
            <div className={`insurance-option ${insurance === 'premium' ? 'selected' : ''}`} onClick={() => setInsurance('premium')}>
              <input type="radio" checked={insurance === 'premium'} readOnly />
              <div>
                <div className="insurance-label">Premium Coverage</div>
                <div className="insurance-desc">Full coverage including weather damage</div>
                <div className="insurance-price">+$45/day</div>
              </div>
            </div>
          </div>
          <div className="reservation-card notes-card">
            <div className="notes-title">Additional Notes</div>
            <textarea className="notes-textarea" placeholder="Any special requirements?" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        {/* Right: Security Deposit */}
        <div className="details-right">
          <div className="reservation-card deposit-card">
            <div className="deposit-title">Security Deposit</div>
            <div className="deposit-desc">
              A refundable security deposit of <b>$1,000</b> will be held during the rental period.<br />
              The deposit will be returned within 3 business days after the equipment is returned in its original condition.
            </div>
            <div className="deposit-checkbox-row">
              <input type="checkbox" checked={depositChecked} onChange={e => setDepositChecked(e.target.checked)} />
              <span>I agree to the Terms & Conditions and deposit policy.</span>
            </div>
            <button
              className="reservation-next-btn"
              disabled={!depositChecked}
              onClick={() => navigate(`/equipment/${id}/reserve/confirm`, { state: { startDate, endDate, insurance, notes, deposit: 1000, equipment } })}
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentReservationDetails; 