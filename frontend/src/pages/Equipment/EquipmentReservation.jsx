import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Equipment.css';
import dayjs from 'dayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const BASE_URL = 'http://localhost:8000';

const EquipmentReservation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    api.get(`/equipment/${id}`)
      .then(res => setEquipment(res.data.equipment || res.data))
      .catch(() => setEquipment(null));
  }, [id]);

  if (!equipment) return <div className="equipment-listing-page"><div className="listing-container">Loading...</div></div>;

  let imageUrl = '';
  if (equipment.images && equipment.images.length > 0) {
    if (typeof equipment.images[0] === 'string') {
      let imgPath = equipment.images[0].replace(/\\/g, '/').trim();
      imgPath = imgPath.replace(/^\/+/, '');
      if (imgPath.startsWith('storage/')) {
        imgPath = imgPath.substring('storage/'.length);
      }
      if (!imgPath.startsWith('equipment/')) {
        imgPath = 'equipment/' + imgPath;
      }
      imageUrl = 'http://localhost:8000/storage/' + imgPath;
    }
  }

  // Calculate duration and total
  let duration = 0;
  let total = 0;
  if (startDate && endDate && equipment.minPrice) {
    duration = Math.max(0, (new Date(endDate) - new Date(startDate)) / (1000*60*60*24));
    total = duration * parseFloat(equipment.minPrice);
  }

  const isDateReserved = (date) => {
    if (!equipment || !equipment.reserved_dates) return false;
    return equipment.reserved_dates.some(range => {
      const start = dayjs(range.start);
      const end = dayjs(range.end);
      return dayjs(date).isBetween(start, end, null, '[]');
    });
  };

  const isRangeReserved = (start, end) => {
    if (!equipment || !equipment.reserved_dates) return false;
    return equipment.reserved_dates.some(range => {
      const reservedStart = dayjs(range.start);
      const reservedEnd = dayjs(range.end);
      return (
        (dayjs(start).isBetween(reservedStart, reservedEnd, null, '[]')) ||
        (dayjs(end).isBetween(reservedStart, reservedEnd, null, '[]')) ||
        (reservedStart.isBetween(dayjs(start), dayjs(end), null, '[]'))
      );
    });
  };

  const showRangeError = startDate && endDate && isRangeReserved(startDate, endDate);

  return (
    <div className="reservation-page">
      <div className="reservation-content">
        {/* Left: Booking Details Card */}
        <div className="reservation-card booking-details-card">
          <div className="reservation-title">Booking Details</div>
          <div className="reservation-label">Select Rental Period</div>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div
              className="reservation-date-fields"
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-end',
                marginBottom: 18,
                background: 'transparent',
                border: 'none',
                borderRadius: 0,
                boxShadow: 'none',
                padding: 0,
                width: '100%',
                position: 'relative',
                overflow: 'visible',
                marginLeft: 0,
                marginRight: 0,
              }}
            >
              <div style={{ flex: 1, minWidth: 120 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 4,
                    fontWeight: 600,
                    color: '#2B5727',
                    fontSize: 15,
                  }}
                >
                  Start Date
                </label>
                <DatePicker
                  label=""
                  value={startDate}
                  onChange={setStartDate}
                  minDate={dayjs()}
                  shouldDisableDate={isDateReserved}
                  slotProps={{
                    day: ({ day }) =>
                      isDateReserved(day)
                        ? { sx: { bgcolor: '#ffeaea', color: '#e74c3c' } }
                        : {},
                    popper: {
                      placement: 'bottom-start',
                      sx: {
                        zIndex: 1500,
                        maxWidth: '95vw',
                        width: 'auto',
                        boxSizing: 'border-box',
                      },
                    },
                  }}
                  sx={{
                    width: '100%',
                    background: '#f8fafc',
                    borderRadius: 2,
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 4,
                    fontWeight: 600,
                    color: '#2B5727',
                    fontSize: 15,
                  }}
                >
                  End Date
                </label>
                <DatePicker
                  label=""
                  value={endDate}
                  onChange={setEndDate}
                  minDate={startDate || dayjs()}
                  shouldDisableDate={isDateReserved}
                  slotProps={{
                    day: ({ day }) =>
                      isDateReserved(day)
                        ? { sx: { bgcolor: '#ffeaea', color: '#e74c3c' } }
                        : {},
                    popper: {
                      placement: 'bottom-start',
                      sx: {
                        zIndex: 1500,
                        maxWidth: '95vw',
                        width: 'auto',
                        boxSizing: 'border-box',
                      },
                    },
                  }}
                  sx={{
                    width: '100%',
                    background: '#f8fafc',
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
          </LocalizationProvider>
          {showRangeError && (
            <div style={{ color: '#e74c3c', marginTop: 8 }}>
              The selected dates overlap with an existing reservation. Please choose different dates.
            </div>
          )}
          <div className="reservation-stepper">
            <div className="step-circle active">1</div>
            <span className="step-label">of 3</span>
          </div>
          <button
            className="reservation-next-btn"
            disabled={!startDate || !endDate || showRangeError}
            onClick={() => navigate(`/equipment/${id}/reserve/details`, { state: { startDate: startDate ? startDate.format('YYYY-MM-DD') : '', endDate: endDate ? endDate.format('YYYY-MM-DD') : '', equipment } })}
          >
            Next
          </button>
        </div>
        {/* Right: Equipment Summary Card */}
        <div className="reservation-card equipment-summary-card">
          {imageUrl ? (
            <img src={imageUrl} alt={equipment.name} className="equipment-image" />
          ) : (
            <div className="equipment-image-placeholder">No Image</div>
          )}
          <div className="equipment-summary-content">
            <div className="equipment-title-row">
              <span className="equipment-title">{equipment.name} {equipment.year && <span className="equipment-year">{equipment.year}</span>}</span>
              {equipment.rating && (
                <span className="equipment-rating">{equipment.rating} <span className="equipment-rating-count">({equipment.reviewCount || 0})</span></span>
              )}
            </div>
            <div className="equipment-location">{equipment.city || ''}{equipment.city && equipment.state ? ', ' : ''}{equipment.state || ''}</div>
            <div className="equipment-features-label">Features</div>
            <div className="equipment-features-list">
              <div>GPS Navigation</div>
              <div>Auto-Steering</div>
              <div>Climate Control</div>
              <div>Performance Monitoring</div>
            </div>
            <div className="equipment-summary-label">Rental Summary</div>
            <div className="equipment-summary-row"><span>Daily Rate</span><span>{equipment.minPrice ? `${equipment.minPrice} MAD` : '-'}</span></div>
            <div className="equipment-summary-row"><span>Duration</span><span>{duration} days</span></div>
            <div className="equipment-summary-row total-row"><span>Total</span><span>{total ? `${total} MAD` : '0 MAD'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentReservation; 