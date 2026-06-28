import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { ArrowLeft, CalendarDays, Check, MapPin, Tractor, UserRound, UsersRound } from 'lucide-react';
import api from '../../services/api';
import { getStorageUrl } from '../../config/api';
import BookingProgress from '../../components/Marketplace/BookingProgress';
import { loadBookingDraft, saveBookingDraft } from '../../utils/bookingDraft';
import './Equipment.css';

const modes = [
  { value: 'equipment_only', icon: Tractor, title: 'Machine only', copy: 'You arrange an operator and transport if needed.' },
  { value: 'owner_operator', icon: UserRound, title: 'Owner operates', copy: 'Request the machine together with its owner.' },
  { value: 'owner_worker', icon: UsersRound, title: 'Worker included', copy: 'Request an experienced worker with the machine.' },
];

const EquipmentReservation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const saved = useMemo(() => loadBookingDraft(id), [id]);
  const [equipment, setEquipment] = useState(saved?.equipment || null);
  const [loading, setLoading] = useState(!saved?.equipment);
  const [startDate, setStartDate] = useState(saved?.startDate ? dayjs(saved.startDate) : null);
  const [endDate, setEndDate] = useState(saved?.endDate ? dayjs(saved.endDate) : null);
  const [serviceMode, setServiceMode] = useState(saved?.serviceMode || 'equipment_only');
  const [workType, setWorkType] = useState(saved?.workType || '');
  const [workLocation, setWorkLocation] = useState(saved?.workLocation || '');
  const [fieldSize, setFieldSize] = useState(saved?.fieldSize || '');

  useEffect(() => {
    api.get(`/equipment/${id}`).then(res => setEquipment(res.data.equipment || res.data)).catch(() => setEquipment(null)).finally(() => setLoading(false));
  }, [id]);

  const duration = startDate && endDate ? Math.max(1, endDate.startOf('day').diff(startDate.startOf('day'), 'day')) : 0;
  const dailyRate = Number(equipment?.minPrice || equipment?.price || equipment?.daily_rate || 0);
  const total = duration * dailyRate;
  const minimumDays = Number(equipment?.minRentalDays || 1);
  const isDateReserved = date => (equipment?.reserved_dates || []).some(range => {
    const value = dayjs(date).startOf('day');
    return !value.isBefore(dayjs(range.start).startOf('day')) && !value.isAfter(dayjs(range.end).startOf('day'));
  });
  const isRangeReserved = (start, end) => (equipment?.reserved_dates || []).some(range => !dayjs(end).isBefore(dayjs(range.start), 'day') && !dayjs(start).isAfter(dayjs(range.end), 'day'));
  const rangeConflict = Boolean(startDate && endDate && isRangeReserved(startDate, endDate));
  const minimumError = Boolean(startDate && endDate && duration < minimumDays);
  const serviceFieldsMissing = serviceMode !== 'equipment_only' && (!workType.trim() || !workLocation.trim());
  const canContinue = startDate && endDate && !rangeConflict && !minimumError && !serviceFieldsMissing;
  const imageUrl = equipment?.images?.[0] ? getStorageUrl(equipment.images[0]) : '';

  const continueBooking = () => {
    const draft = { startDate: startDate.format('YYYY-MM-DD'), endDate: endDate.format('YYYY-MM-DD'), serviceMode, workType, workLocation, fieldSize, equipment };
    saveBookingDraft(id, draft);
    navigate(`/equipment/${id}/reserve/details`, { state: draft });
  };

  if (loading) return <div className="reservation-page"><div className="detail-loading"><span className="spinner" /> Preparing your booking…</div></div>;
  if (!equipment) return <div className="reservation-page"><div className="detail-loading">Equipment unavailable. <button onClick={() => navigate('/equipment')}>Back to marketplace</button></div></div>;

  return (
    <main className="reservation-page">
      <div className="booking-shell">
        <button className="detail-back" onClick={() => navigate(`/equipment/${id}`)}><ArrowLeft size={17} /> Equipment details</button>
        <BookingProgress current={1} />
        <header className="booking-page-heading"><div><span>Build your booking</span><h1>When and how do you need it?</h1><p>Select a service, dates, and job details. You can review everything before submitting.</p></div></header>

        <div className="reservation-content booking-layout">
          <section className="reservation-card booking-details-card">
            <div className="booking-section-heading"><span>1</span><div><h2>Choose a service</h2><p>Pick the option that best fits your job.</p></div></div>
            <div className="service-mode-grid">{modes.map(({ value, icon: Icon, title, copy }) => <button key={value} type="button" className={`service-mode-card ${serviceMode === value ? 'selected' : ''}`} onClick={() => setServiceMode(value)}><span className="service-mode-icon">{React.createElement(Icon, { size: 21 })}</span><span><strong>{title}</strong><small>{copy}</small></span>{serviceMode === value && <Check className="service-check" size={17} />}</button>)}</div>

            {serviceMode !== 'equipment_only' && <div className="booking-job-fields">
              <label><span>Type of work *</span><input type="text" placeholder="e.g. Plowing, harvesting, spraying" value={workType} onChange={e => setWorkType(e.target.value)} /></label>
              <label><span>Farm or work location *</span><div className="input-with-icon"><MapPin size={17} /><input type="text" placeholder="Address or nearby village" value={workLocation} onChange={e => setWorkLocation(e.target.value)} /></div></label>
              <label><span>Field size <small>(optional)</small></span><div className="input-suffix"><input type="number" min="0" step="0.1" placeholder="0.0" value={fieldSize} onChange={e => setFieldSize(e.target.value)} /><b>ha</b></div></label>
            </div>}

            <div className="booking-divider" />
            <div className="booking-section-heading"><span>2</span><div><h2>Select rental dates</h2><p>Unavailable dates are disabled. Minimum booking: {minimumDays} day{minimumDays === 1 ? '' : 's'}.</p></div></div>
            <LocalizationProvider dateAdapter={AdapterDayjs}><div className="reservation-date-fields">
              <label><span>Start date</span><DatePicker value={startDate} onChange={value => { setStartDate(value); if (endDate && value && endDate.isBefore(value, 'day')) setEndDate(null); }} minDate={dayjs()} shouldDisableDate={isDateReserved} slotProps={{ textField: { fullWidth: true }, popper: { sx: { zIndex: 1500 } } }} /></label>
              <label><span>End date</span><DatePicker value={endDate} onChange={setEndDate} minDate={startDate || dayjs()} shouldDisableDate={isDateReserved} slotProps={{ textField: { fullWidth: true }, popper: { sx: { zIndex: 1500 } } }} /></label>
            </div></LocalizationProvider>
            {rangeConflict && <div className="booking-alert error">Those dates overlap an existing booking. Try another range.</div>}
            {minimumError && <div className="booking-alert error">This owner requires a minimum rental of {minimumDays} days.</div>}

            <button className="reservation-next-btn" disabled={!canContinue} onClick={continueBooking}>Review booking details <span>→</span></button>
          </section>

          <aside className="reservation-card equipment-summary-card booking-sticky-card">
            {imageUrl ? <img src={imageUrl} alt={equipment.name} className="booking-summary-image" /> : <div className="equipment-image-placeholder">No image</div>}
            <div className="equipment-summary-content">
              <span className="detail-type">{equipment.type}</span><h2>{equipment.name}</h2>
              <p className="equipment-location"><MapPin size={15} /> {[equipment.city, equipment.state].filter(Boolean).join(', ') || 'Location shared by owner'}</p>
              <div className="booking-price-breakdown">
                <div><span>Daily rate</span><strong>{dailyRate.toLocaleString('fr-MA')} MAD</strong></div>
                <div><span>Duration</span><strong>{duration || '—'} {duration === 1 ? 'day' : 'days'}</strong></div>
                <div className="booking-total"><span>Estimated rental</span><strong>{total.toLocaleString('fr-MA')} MAD</strong></div>
              </div>
              {!startDate && <p className="booking-summary-hint"><CalendarDays size={16} /> Choose dates to see your estimated total.</p>}
              <div className="booking-safe-note"><Check size={16} /> No charge until you review and submit.</div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default EquipmentReservation;
