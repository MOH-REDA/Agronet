import React, { useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import './Equipment.css';
import api from '../../services/api';

const EquipmentReservationConfirm = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  let { startDate, endDate, insurance, notes, deposit, equipment } = location.state || {};
  console.log('Reservation Confirm: startDate:', startDate, 'endDate:', endDate, 'equipment:', equipment);
  // Fallback for testing
  if (!startDate) startDate = '2024-06-15';
  if (!endDate) endDate = '2024-06-18';

  // Calculate duration and total using real equipment data
  let duration = 0;
  let total = 0;
  let dailyRate = equipment?.minPrice || equipment?.price || 0;
  if (startDate && endDate && dailyRate) {
    duration = Math.max(0, (new Date(endDate) - new Date(startDate)) / (1000*60*60*24));
    total = duration * parseFloat(dailyRate);
  }
  // Get image
  let imageUrl = '';
  if (equipment?.images && equipment.images.length > 0) {
    let imgPath = equipment.images[0];
    if (typeof imgPath === 'string') {
      imgPath = imgPath.replace(/\\/g, '/').trim();
      imgPath = imgPath.replace(/^\/+/, '');
      if (imgPath.startsWith('storage/')) imgPath = imgPath.substring('storage/'.length);
      if (!imgPath.startsWith('equipment/')) imgPath = 'equipment/' + imgPath;
      imageUrl = 'http://localhost:8000/storage/' + imgPath;
    }
  }

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const handlePayment = async (e) => {
    e.preventDefault();
    console.log('handlePayment called', { paymentMethod, id, startDate, endDate });
    setProcessing(true);
    setSuccess(false);
    try {
      const token = localStorage.getItem('token');
      // Make reservation
      const reservationRes = await api.post(
        '/reservations',
        {
          equipment_id: id,
          start_date: startDate,
          end_date: endDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // If payment is required, call payment endpoint
      if (reservationRes.data && reservationRes.data.reservation_id) {
        await api.post(
          `/reservations/${reservationRes.data.reservation_id}/pay`,
          {
            method: paymentMethod,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
      setSuccess(true);
      // Optionally redirect or show a message
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      console.error('Payment error:', err);
      alert(err?.response?.data?.message || err.message || 'Payment failed');
    }
    setProcessing(false);
  };

  return (
    <div className="reservation-page">
      <div className="reservation-content payment-step">
        {/* Left: Payment Form */}
        <div className="payment-left">
          <div className="reservation-card payment-form-card">
            <div className="payment-title">Payment Details</div>
            <div className="payment-method-row">
              <button
                className={`payment-method-btn ${paymentMethod === 'cash' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('cash')}
                disabled={processing || success}
              >
                Pay with Cash
              </button>
              <button
                className={`payment-method-btn ${paymentMethod === 'paypal' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('paypal')}
                disabled={processing || success}
              >
                Pay with PayPal
              </button>
            </div>
            {paymentMethod === 'card' && (
              <div className="payment-fields">
                <input type="text" placeholder="Card Number" value={cardNumber} onChange={e => setCardNumber(e.target.value)} disabled={processing || success} />
                <div className="payment-fields-row">
                  <input type="text" placeholder="MM/YY" value={expiry} onChange={e => setExpiry(e.target.value)} disabled={processing || success} />
                  <input type="text" placeholder="CVV" value={cvv} onChange={e => setCvv(e.target.value)} disabled={processing || success} />
                </div>
                <input type="text" placeholder="Name on Card" value={cardName} onChange={e => setCardName(e.target.value)} disabled={processing || success} />
              </div>
            )}
            {paymentMethod === 'cmi' && (
              <div className="payment-fields">
                <input type="text" placeholder="CMI Mobile Number" disabled={processing || success} />
              </div>
            )}
            <button
              className="reservation-next-btn"
              style={{ marginTop: 24 }}
              onClick={handlePayment}
              disabled={processing || success || !startDate || !endDate}
            >
              {processing ? (
                <span>
                  <span className="spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }}></span>
                  Processing...
                </span>
              ) : success ? 'Payment Successful!' : 'Complete Payment'}
            </button>
            {success && <div style={{ color: '#2B5727', fontWeight: 600, marginTop: 16, textAlign: 'center', fontSize: 16 }}>Payment Successful!</div>}
          </div>
        </div>
        {/* Right: Order Summary */}
        <div className="payment-right">
          <div className="reservation-card order-summary-card">
            <div className="order-summary-title">Order Summary</div>
            <div className="order-summary-row">
              <img src={imageUrl || '/tractor-placeholder.png'} alt={equipment?.name} className="equipment-image-sm" />
              <div>
                <div className="equipment-title">{equipment?.name}</div>
                <div>{duration} days rental</div>
              </div>
            </div>
            <div className="order-summary-info">
              <div className="order-summary-item"><span>Rental Fee</span><span>{dailyRate ? `${dailyRate} MAD` : '-'}</span></div>
              <div className="order-summary-item"><span>Service Fee</span><span>-</span></div>
              <div className="order-summary-item"><span>Insurance ({insurance === 'premium' ? 'Premium' : 'Basic'})</span><span>{insurance === 'premium' ? '+45/day' : 'Included'}</span></div>
              <div className="order-summary-item"><span>Security Deposit</span><span>{deposit ? `${deposit} MAD` : '-'}</span></div>
            </div>
            <div className="order-summary-total-row"><span>Total to Pay Now</span><span>{total ? `${total} MAD` : '0 MAD'}</span></div>
            <div className="order-summary-note">Your payment is secured by CMI Bank</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentReservationConfirm; 