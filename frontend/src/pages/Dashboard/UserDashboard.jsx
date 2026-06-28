import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import { Link } from 'react-router-dom';
import {
  getCurrentUser,
  getUserEquipment,
  getUserReservations,
  deleteEquipment,
  ownerMarkReservationComplete,
  renterConfirmReservationCompletion,
  disputeReservation,
  respondToReservation,
  submitReservationReview
} from '../../services/api';
import { toast } from 'react-toastify';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Tractor,
} from 'lucide-react';
import { getStorageUrl } from '../../config/api';
import './UserDashboard.css';

const UserDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeRentals: 0,
    completedBookings: 0,
    totalEquipment: 0,
    pendingBookings: 0
  });

  const [myEquipment, setMyEquipment] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [busy, setBusy] = useState({});

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [userData, equipmentData, reservationsData] = await Promise.all([
        getCurrentUser(),
        getUserEquipment(),
        getUserReservations()
      ]);

      const reservations = reservationsData.data || [];
      setUserData(userData);
      setMyEquipment(equipmentData.data || []);
      setMyReservations(reservations);
      
      setStats({
        totalEarnings: 0,
        activeRentals: reservations.filter(r => ['scheduled', 'in_progress', 'active'].includes(r.status)).length,
        completedBookings: reservations.filter(r => r.status === 'completed').length,
        totalEquipment: equipmentData.data?.length || 0,
        pendingBookings: reservations.filter(r => ['requested', 'payment_submitted', 'awaiting_payment'].includes(r.status)).length
      });
      
      setError(null);
    } catch (err) {
      setError('Failed to load user data. Please try again later.');
      toast.error(err.message || 'Failed to load user data');
      console.error('User data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEquipment = async (equipmentId) => {
    if (!window.confirm('Are you sure you want to delete this equipment? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteEquipment(equipmentId);
      await loadUserData(); // Reload all data
      toast.success('Equipment deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete equipment');
      console.error('Error deleting equipment:', err);
    }
  };

  const handleOwnerComplete = async (reservationId) => {
    setBusy(prev => ({ ...prev, [`owner-${reservationId}`]: true }));
    try {
      await ownerMarkReservationComplete(reservationId);
      toast.success('Marked completed. Waiting for renter confirmation.');
      await loadUserData();
    } catch (err) {
      toast.error(err.message || 'Failed to mark completed');
    } finally {
      setBusy(prev => ({ ...prev, [`owner-${reservationId}`]: false }));
    }
  };

  const handleOwnerDecision = async (reservationId, decision) => {
    setBusy(prev => ({ ...prev, [`decision-${reservationId}`]: true }));
    try {
      await respondToReservation(reservationId, decision);
      toast.success(decision === 'accept' ? 'Booking request accepted.' : 'Booking request rejected.');
      await loadUserData();
    } catch (err) {
      toast.error(err.message || 'Failed to answer booking request');
    } finally {
      setBusy(prev => ({ ...prev, [`decision-${reservationId}`]: false }));
    }
  };

  const handleRenterConfirm = async (reservationId) => {
    setBusy(prev => ({ ...prev, [`confirm-${reservationId}`]: true }));
    try {
      await renterConfirmReservationCompletion(reservationId);
      toast.success('Completion confirmed.');
      await loadUserData();
    } catch (err) {
      toast.error(err.message || 'Failed to confirm completion');
    } finally {
      setBusy(prev => ({ ...prev, [`confirm-${reservationId}`]: false }));
    }
  };

  const handleDispute = async (reservationId) => {
    const reason = window.prompt('What went wrong?');
    if (reason === null) return;

    setBusy(prev => ({ ...prev, [`dispute-${reservationId}`]: true }));
    try {
      await disputeReservation(reservationId, reason);
      toast.success('Dispute opened for admin review.');
      await loadUserData();
    } catch (err) {
      toast.error(err.message || 'Failed to open dispute');
    } finally {
      setBusy(prev => ({ ...prev, [`dispute-${reservationId}`]: false }));
    }
  };

  const handleReview = async (reservationId) => {
    const rawRating = window.prompt('Rate this owner from 1 to 5:');
    if (rawRating === null) return;
    const rating = Number(rawRating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return toast.error('Choose a rating from 1 to 5.');
    const comment = window.prompt('Share a short review (optional):') || '';
    setBusy(prev => ({ ...prev, [`review-${reservationId}`]: true }));
    try {
      await submitReservationReview(reservationId, { rating, comment });
      toast.success('Review submitted.');
      await loadUserData();
    } catch (err) {
      toast.error(err.message || 'Failed to submit review.');
    } finally {
      setBusy(prev => ({ ...prev, [`review-${reservationId}`]: false }));
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  const actionCount = myReservations.filter(reservation => {
    const owner = Number(reservation.equipment?.user_id || reservation.equipment?.user?.id) === Number(userData?.id);
    const renter = Number(reservation.user_id || reservation.user?.id) === Number(userData?.id);
    return (owner && ['requested', 'payment_submitted', 'scheduled', 'in_progress'].includes(reservation.status)) ||
      (renter && ['owner_completed', 'completed'].includes(reservation.status) && (!reservation.review || reservation.status === 'owner_completed'));
  }).length;

  return (
    <DashboardLayout>
      <main className="user-hub">
        <header className="user-hub-hero">
          <div><span className="user-hub-eyebrow">Your AgroNet workspace</span><h1>Good {getGreeting()}, {userData?.prenom || userData?.name}</h1><p>Track bookings, answer equipment requests, and keep your listings ready for the next job.</p></div>
          <div className="user-hub-actions"><Link to="/equipment" className="secondary"><Search size={17} /> Find equipment</Link><Link to="/equipment/list" className="primary"><Plus size={17} /> List equipment</Link></div>
        </header>

        {actionCount > 0 && <section className="user-action-banner"><span><AlertCircle size={20} /></span><div><strong>{actionCount} item{actionCount === 1 ? '' : 's'} need your attention</strong><p>Review highlighted booking actions below to keep work moving.</p></div><a href="#booking-activity">Review now <ArrowRight size={16} /></a></section>}

        <section className="user-kpi-grid" aria-label="Account overview">
          <UserKpi icon={Clock3} label="Pending requests" value={stats.pendingBookings} note="Waiting for a response" tone="amber" />
          <UserKpi icon={CalendarDays} label="Active rentals" value={stats.activeRentals} note="Scheduled or underway" tone="green" />
          <UserKpi icon={CheckCircle2} label="Completed" value={stats.completedBookings} note="Finished bookings" tone="blue" />
          <UserKpi icon={Tractor} label="Your machines" value={stats.totalEquipment} note="Equipment listed" tone="neutral" />
        </section>

        <section className="user-hub-panel" id="booking-activity">
          <header><div><span>Booking activity</span><h2>Requests and rentals</h2><p>Bookings where you are the renter or equipment owner.</p></div><Link to="/equipment">Browse marketplace <ArrowRight size={15} /></Link></header>
          {myReservations.length === 0 ? <DashboardEmpty icon={CalendarDays} title="No bookings yet" copy="When you reserve equipment or receive an owner request, it will appear here." action="Find equipment" to="/equipment" /> :
            <div className="user-booking-list">{myReservations.slice(0, 8).map(reservation => <article className="user-booking-card" key={reservation.id}>
              <div className="user-booking-date"><strong>{formatDay(reservation.start_date)}</strong><span>{formatMonth(reservation.start_date)}</span></div>
              <div className="user-booking-main"><div className="user-booking-title"><span>Booking #{reservation.id}</span><StatusPill status={reservation.status} /></div><h3>{reservation.equipment?.name || 'Equipment unavailable'}</h3><div className="user-booking-meta"><span><CalendarDays size={14} /> {formatDate(reservation.start_date)} – {formatDate(reservation.end_date)}</span><span><Tractor size={14} /> {formatLabel(reservation.service_mode || 'equipment_only')}</span>{reservation.work_location && <span><MapPin size={14} /> {reservation.work_location}</span>}</div></div>
              <div className="user-booking-side"><span className="user-payment-state">Payment · {formatLabel(reservation.payment_status || 'unpaid')}</span><ReservationActions reservation={reservation} userId={userData?.id} busy={busy} onOwnerDecision={handleOwnerDecision} onOwnerComplete={handleOwnerComplete} onRenterConfirm={handleRenterConfirm} onDispute={handleDispute} onReview={handleReview} /></div>
            </article>)}</div>}
        </section>

        <section className="user-hub-panel equipment-panel">
          <header><div><span>Owner workspace</span><h2>Your equipment</h2><p>Manage pricing, listing status, and equipment details.</p></div><Link to="/equipment/list" className="panel-primary"><Plus size={15} /> Add machine</Link></header>
          {myEquipment.length === 0 ? <DashboardEmpty icon={Tractor} title="Put your first machine to work" copy="Create a detailed listing and start receiving requests from nearby farmers." action="List equipment" to="/equipment/list" /> :
            <div className="user-equipment-grid">{myEquipment.map(equipment => {
              const image = equipment.images?.[0] ? getStorageUrl(equipment.images[0]) : '/agronet-hero-v2.webp';
              return <article className="user-equipment-card" key={equipment.id}><Link to={`/my-equipment/${equipment.id}`} className="user-equipment-image"><img src={image} alt={equipment.name} /><StatusPill status={equipment.status || 'active'} /></Link><div className="user-equipment-copy"><span>{equipment.type || 'Equipment'}</span><h3><Link to={`/my-equipment/${equipment.id}`}>{equipment.name}</Link></h3><div><strong>{Number(equipment.minPrice || equipment.price || 0).toLocaleString('fr-MA')} MAD</strong><small>/ day</small></div><p>{equipment.total_bookings || 0} total booking{Number(equipment.total_bookings || 0) === 1 ? '' : 's'}</p></div><div className="user-equipment-actions"><Link to="/equipment/list" state={{ edit: true, equipment }}><Pencil size={15} /> Edit</Link><button onClick={() => handleDeleteEquipment(equipment.id)}><Trash2 size={15} /> Delete</button></div></article>;
            })}</div>}
        </section>
      </main>
    </DashboardLayout>
  );
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDay = value => value ? new Date(value).getDate() : '—';
const formatMonth = value => value ? new Date(value).toLocaleDateString(undefined, { month: 'short' }) : '';
const formatLabel = value => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
const getGreeting = () => { const hour = new Date().getHours(); return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'; };
const statusTone = status => ['completed', 'active'].includes(status) ? 'success' : ['requested', 'pending', 'payment_submitted', 'owner_completed'].includes(status) ? 'attention' : ['rejected', 'cancelled', 'disputed'].includes(status) ? 'danger' : 'progress';

const StatusPill = ({ status }) => <span className={`user-status-pill ${statusTone(status)}`}>{formatLabel(status)}</span>;
const UserKpi = ({ icon, label, value, note, tone }) => <article className={`user-kpi-card tone-${tone}`}><span>{React.createElement(icon, { size: 20 })}</span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div></article>;
const DashboardEmpty = ({ icon, title, copy, action, to }) => <div className="user-empty-state"><span>{React.createElement(icon, { size: 24 })}</span><h3>{title}</h3><p>{copy}</p><Link to={to}>{action} <ArrowRight size={15} /></Link></div>;

const ReservationActions = ({ reservation, userId, busy, onOwnerDecision, onOwnerComplete, onRenterConfirm, onDispute, onReview }) => {
  const isOwner = reservation.equipment?.user_id === userId || reservation.equipment?.user?.id === userId;
  const isRenter = reservation.user_id === userId || reservation.user?.id === userId;

  if (isOwner && ['requested', 'payment_submitted'].includes(reservation.status)) {
    return (
      <div className="user-reservation-actions">
        <button
          className="positive"
          disabled={busy[`decision-${reservation.id}`]}
          onClick={() => onOwnerDecision(reservation.id, 'accept')}
        >
          Accept
        </button>
        <button
          className="negative"
          disabled={busy[`decision-${reservation.id}`]}
          onClick={() => onOwnerDecision(reservation.id, 'reject')}
        >
          Reject
        </button>
      </div>
    );
  }

  if (isOwner && ['scheduled', 'in_progress'].includes(reservation.status)) {
    return (
      <button
        className="positive outline"
        disabled={busy[`owner-${reservation.id}`]}
        onClick={() => onOwnerComplete(reservation.id)}
      >
        Mark Completed
      </button>
    );
  }

  if (isRenter && reservation.status === 'owner_completed') {
    return (
      <div className="user-reservation-actions">
        <button
          className="positive"
          disabled={busy[`confirm-${reservation.id}`]}
          onClick={() => onRenterConfirm(reservation.id)}
        >
          Confirm
        </button>
        <button
          className="negative"
          disabled={busy[`dispute-${reservation.id}`]}
          onClick={() => onDispute(reservation.id)}
        >
          Dispute
        </button>
      </div>
    );
  }

  if (isRenter && ['scheduled', 'in_progress'].includes(reservation.status)) {
    return (
      <button
        className="negative"
        disabled={busy[`dispute-${reservation.id}`]}
        onClick={() => onDispute(reservation.id)}
      >
        Report Problem
      </button>
    );
  }

  if (isRenter && reservation.status === 'completed' && !reservation.review) {
    return <button className="positive outline" disabled={busy[`review-${reservation.id}`]} onClick={() => onReview(reservation.id)}>Leave review</button>;
  }

  if (isRenter && reservation.review) return <span className="user-review-score">★ {reservation.review.rating}/5</span>;

  return <span className="user-no-action">No action needed</span>;
};

export default UserDashboard;
