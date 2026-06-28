import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Check, Info, MapPin, ShieldCheck } from 'lucide-react';
import { getStorageUrl } from '../../config/api';
import BookingProgress from '../../components/Marketplace/BookingProgress';
import { loadBookingDraft, saveBookingDraft } from '../../utils/bookingDraft';
import './Equipment.css';

const modeLabels = { equipment_only: 'Machine only', owner_operator: 'Owner operates', owner_worker: 'Worker included' };

const EquipmentReservationDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const draft = useMemo(() => location.state || loadBookingDraft(id) || {}, [id, location.state]);
  const { startDate, endDate, serviceMode = 'equipment_only', workType = '', workLocation = '', fieldSize = '', equipment = {} } = draft;
  const duration = startDate && endDate ? Math.max(1, (new Date(endDate) - new Date(startDate)) / 86400000) : 0;
  const dailyRate = Number(equipment.minPrice || equipment.price || equipment.daily_rate || 0);
  const rentalAmount = duration * dailyRate;
  const serviceFee = 0;
  const deposit = Number(equipment.deposit || 0);
  const total = rentalAmount + serviceFee + deposit;
  const [notes, setNotes] = useState(draft.notes || '');
  const [depositChecked, setDepositChecked] = useState(Boolean(draft.depositChecked));
  const imageUrl = equipment.images?.[0] ? getStorageUrl(equipment.images[0]) : '/tractor-placeholder.png';

  if (!startDate || !endDate || !equipment.id) return <div className="reservation-page"><div className="detail-loading">Your booking needs dates first. <button onClick={() => navigate(`/equipment/${id}/reserve`)}>Choose dates</button></div></div>;

  const continueBooking = () => {
    const next = { ...draft, notes, depositChecked, insurance: 'basic', deposit, rentalAmount, serviceFee, total };
    saveBookingDraft(id, next);
    navigate(`/equipment/${id}/reserve/confirm`, { state: next });
  };

  return (
    <main className="reservation-page"><div className="booking-shell">
      <button className="detail-back" onClick={() => navigate(`/equipment/${id}/reserve`)}><ArrowLeft size={17} /> Edit dates & service</button>
      <BookingProgress current={2} />
      <header className="booking-page-heading"><div><span>Review your request</span><h1>Make sure every detail is right</h1><p>Add useful instructions for the owner, then confirm the deposit policy.</p></div></header>

      <div className="reservation-content details-step booking-layout">
        <div className="details-left">
          <section className="reservation-card booking-review-card">
            <div className="booking-equipment-mini"><img src={imageUrl} alt={equipment.name} /><div><span className="detail-type">{equipment.type}</span><h2>{equipment.name}</h2><p><MapPin size={14} /> {[equipment.city, equipment.state].filter(Boolean).join(', ')}</p></div></div>
            <div className="booking-review-grid">
              <div><CalendarDays size={19} /><span><small>Rental period</small><strong>{startDate} → {endDate}</strong><em>{duration} {duration === 1 ? 'day' : 'days'}</em></span></div>
              <div><Check size={19} /><span><small>Service</small><strong>{modeLabels[serviceMode]}</strong>{workType && <em>{workType}</em>}</span></div>
              {workLocation && <div><MapPin size={19} /><span><small>Work location</small><strong>{workLocation}</strong>{fieldSize && <em>{fieldSize} hectares</em>}</span></div>}
            </div>
            <button className="booking-edit-link" onClick={() => navigate(`/equipment/${id}/reserve`)}>Edit booking selections</button>
          </section>

          <section className="reservation-card"><div className="booking-section-heading plain"><div><h2>Platform protection</h2><p>Included automatically with every AgroNet booking.</p></div></div>
            <div className="protection-included"><span><ShieldCheck size={22} /></span><div><strong>AgroNet basic protection</strong><p>Booking records, tracked payment status, and dispute support before owner payout.</p></div><b>Included</b></div>
            <div className="booking-alert info"><Info size={17} /> This is platform transaction protection, not a substitute for machinery insurance unless the listing explicitly says insurance is included.</div>
          </section>

          <section className="reservation-card"><div className="booking-section-heading plain"><div><h2>Notes for the owner</h2><p>Help the owner prepare the right machine and arrival plan.</p></div></div><textarea className="notes-textarea upgraded" maxLength={500} placeholder="Field access, preferred arrival time, terrain, attachments needed…" value={notes} onChange={e => setNotes(e.target.value)} /><div className="textarea-count">{notes.length}/500</div></section>
        </div>

        <aside className="details-right"><section className="reservation-card deposit-card booking-sticky-card">
          <h2>Price details</h2><div className="booking-price-breakdown"><div><span>{dailyRate.toLocaleString('fr-MA')} MAD × {duration} days</span><strong>{rentalAmount.toLocaleString('fr-MA')} MAD</strong></div><div><span>AgroNet fee</span><strong>{serviceFee ? `${serviceFee} MAD` : 'Included'}</strong></div><div><span>Refundable deposit</span><strong>{deposit.toLocaleString('fr-MA')} MAD</strong></div><div className="booking-total"><span>Total due</span><strong>{total.toLocaleString('fr-MA')} MAD</strong></div></div>
          <p className="deposit-desc"><ShieldCheck size={17} /> The security deposit is refundable after the rental, subject to the owner’s equipment condition policy.</p>
          <label className="deposit-checkbox-row upgraded"><input type="checkbox" checked={depositChecked} onChange={e => setDepositChecked(e.target.checked)} /><span>I agree to the booking terms and refundable deposit policy.</span></label>
          <button className="reservation-next-btn" disabled={!depositChecked} onClick={continueBooking}>Continue to payment <span>→</span></button>
          <p className="detail-no-charge">One final review remains before submission.</p>
        </section></aside>
      </div>
    </div></main>
  );
};

export default EquipmentReservationDetails;
