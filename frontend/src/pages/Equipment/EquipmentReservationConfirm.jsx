import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Banknote, Building2, CheckCircle2, Clock3, Copy, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { getStorageUrl } from '../../config/api';
import BookingProgress from '../../components/Marketplace/BookingProgress';
import { clearBookingDraft, loadBookingDraft } from '../../utils/bookingDraft';
import './Equipment.css';

const modeLabels = { equipment_only: 'Machine only', owner_operator: 'Owner operates', owner_worker: 'Worker included' };

const EquipmentReservationConfirm = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const draft = useMemo(() => location.state || loadBookingDraft(id) || {}, [id, location.state]);
  const { startDate, endDate, serviceMode = 'equipment_only', workType = '', workLocation = '', fieldSize = '', notes = '', deposit = 0, equipment = {} } = draft;
  const duration = startDate && endDate ? Math.max(1, (new Date(endDate) - new Date(startDate)) / 86400000) : 0;
  const dailyRate = Number(equipment.minPrice || equipment.price || equipment.daily_rate || 0);
  const rentalAmount = Number(draft.rentalAmount ?? duration * dailyRate);
  const serviceFee = Number(draft.serviceFee ?? 0);
  const total = Number(draft.total ?? rentalAmount + serviceFee + Number(deposit));
  const imageUrl = equipment.images?.[0] ? getStorageUrl(equipment.images[0]) : '/tractor-placeholder.png';
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transferReference, setTransferReference] = useState('');
  const [bankInstructions, setBankInstructions] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [createdReservationId, setCreatedReservationId] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!startDate || !endDate || !equipment.id) return <div className="reservation-page"><div className="detail-loading">Your booking details are missing. <button onClick={() => navigate(`/equipment/${id}/reserve`)}>Start booking</button></div></div>;

  const handlePayment = async event => {
    event.preventDefault(); setProcessing(true); setError(''); setBankInstructions(null);
    try {
      const token = localStorage.getItem('token');
      let reservationId = createdReservationId;
      if (!reservationId) {
        const response = await api.post('/reservations', { equipment_id: id, start_date: startDate, end_date: endDate, service_mode: serviceMode, work_type: workType, work_location: workLocation, field_size: fieldSize, notes }, { headers: { Authorization: `Bearer ${token}` } });
        reservationId = response.data?.reservation_id || response.data?.reservation?.id;
        if (!reservationId) throw new Error('The booking was created without a reference number.');
        setCreatedReservationId(reservationId);
      }
      const payment = await api.post(`/reservations/${reservationId}/pay`, { method: paymentMethod, amount: rentalAmount, service_fee: serviceFee, deposit_amount: deposit, transfer_reference: transferReference || undefined }, { headers: { Authorization: `Bearer ${token}` } });
      setBankInstructions(payment.data?.bank_transfer || null); setSuccess(true); clearBookingDraft(id);
    } catch (err) { setError(err?.response?.data?.message || err.message || 'We could not submit the booking. Please try again.'); }
    finally { setProcessing(false); }
  };

  const copyReference = async () => {
    if (!bankInstructions?.reference) return;
    await navigator.clipboard.writeText(bankInstructions.reference); setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  if (success) return <main className="reservation-page"><div className="booking-shell"><section className="booking-success-card"><span className="booking-success-icon"><CheckCircle2 size={42} /></span><span className="detail-type">Booking #{createdReservationId}</span><h1>{paymentMethod === 'cash' ? 'Your request is on its way' : 'Complete your bank transfer'}</h1><p>{paymentMethod === 'cash' ? 'The owner will review your request. You’ll pay at pickup after it is accepted.' : 'Use the details below. AgroNet will verify the transfer after the owner accepts your booking.'}</p>
    {bankInstructions && <div className="bank-instructions"><div><span>Account holder</span><strong>{bankInstructions.account_holder}</strong></div><div><span>Bank</span><strong>{bankInstructions.bank_name}</strong></div><div><span>RIB</span><strong>{bankInstructions.rib}</strong></div><div><span>Transfer reference</span><strong>{bankInstructions.reference}</strong><button onClick={copyReference}><Copy size={15} /> {copied ? 'Copied' : 'Copy'}</button></div><div className="booking-total"><span>Amount to transfer</span><strong>{bankInstructions.amount_due} MAD</strong></div></div>}
    <div className="booking-next-steps"><h2>What happens next?</h2><div><span>1</span><p><strong>Owner response</strong>The equipment owner confirms availability.</p></div>{paymentMethod === 'bank_transfer' && <div><span>2</span><p><strong>Payment verification</strong>AgroNet verifies and safely tracks the transfer.</p></div>}<div><span>{paymentMethod === 'bank_transfer' ? 3 : 2}</span><p><strong>Pickup or service</strong>Final logistics appear in your bookings.</p></div></div>
    <button className="reservation-next-btn" onClick={() => navigate(`/my-bookings?reservation=${createdReservationId}`)}>View my booking</button><button className="booking-secondary-btn" onClick={() => navigate('/equipment')}>Return to marketplace</button></section></div></main>;

  return (
    <main className="reservation-page"><div className="booking-shell">
      <button className="detail-back" onClick={() => navigate(`/equipment/${id}/reserve/details`)}><ArrowLeft size={17} /> Review booking details</button>
      <BookingProgress current={3} />
      <header className="booking-page-heading"><div><span>Final step</span><h1>Choose how you want to pay</h1><p>Your request is only submitted after you confirm below.</p></div></header>
      <div className="reservation-content payment-step booking-layout">
        <div className="payment-left"><form className="reservation-card payment-form-card" onSubmit={handlePayment}>
          <div className="booking-section-heading plain"><div><h2>Payment method</h2><p>Select the option that works best for this booking.</p></div></div>
          <div className="payment-choice-grid">
            <button type="button" className={`payment-choice ${paymentMethod === 'cash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cash')}><span><Banknote size={23} /></span><div><strong>Cash on pickup</strong><small>Pay after the owner accepts and you inspect the machine.</small></div>{paymentMethod === 'cash' && <CheckCircle2 size={19} />}</button>
            <button type="button" className={`payment-choice ${paymentMethod === 'bank_transfer' ? 'selected' : ''}`} onClick={() => setPaymentMethod('bank_transfer')}><span><Building2 size={23} /></span><div><strong>Bank transfer</strong><small>Transfer to AgroNet using a unique booking reference.</small></div>{paymentMethod === 'bank_transfer' && <CheckCircle2 size={19} />}</button>
          </div>
          {paymentMethod === 'bank_transfer' && <label className="transfer-reference-field"><span>Your transfer reference <small>(optional)</small></span><input type="text" placeholder="Add it now if you already made the transfer" value={transferReference} onChange={e => setTransferReference(e.target.value)} /><small>You can also use the AgroNet reference shown after submission.</small></label>}
          <div className="booking-payment-explainer"><ShieldCheck size={20} /><div><strong>Your transaction stays traceable</strong><p>AgroNet records the booking and payment workflow. Owner payout is handled only after the job lifecycle is completed.</p></div></div>
          {error && <div className="booking-alert error">{error}</div>}
          <button className="reservation-next-btn" type="submit" disabled={processing}>{processing ? <><span className="spinner" /> Submitting…</> : `Submit booking request · ${total.toLocaleString('fr-MA')} MAD`}</button>
          <p className="detail-no-charge">{paymentMethod === 'cash' ? 'Nothing is charged online. Payment is due at pickup.' : 'Bank instructions appear immediately after submission.'}</p>
        </form></div>

        <aside className="payment-right"><section className="reservation-card order-summary-card booking-sticky-card"><div className="booking-equipment-mini compact"><img src={imageUrl} alt={equipment.name} /><div><span className="detail-type">{equipment.type}</span><h2>{equipment.name}</h2><p>{duration} days · {modeLabels[serviceMode]}</p></div></div><div className="booking-dates-pill"><Clock3 size={17} /> {startDate} → {endDate}</div><div className="booking-price-breakdown"><div><span>Rental fee</span><strong>{rentalAmount.toLocaleString('fr-MA')} MAD</strong></div><div><span>AgroNet fee</span><strong>{serviceFee ? `${serviceFee} MAD` : 'Included'}</strong></div><div><span>Refundable deposit</span><strong>{Number(deposit).toLocaleString('fr-MA')} MAD</strong></div><div className="booking-total"><span>{paymentMethod === 'cash' ? 'Total at pickup' : 'Transfer total'}</span><strong>{total.toLocaleString('fr-MA')} MAD</strong></div></div></section></aside>
      </div>
    </div></main>
  );
};

export default EquipmentReservationConfirm;
