import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  Tractor,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import {
  getAdminDashboardData,
  getAdminReservations,
  getAdminPayouts,
  verifyAdminReservationPayment,
  markAdminPayoutPaid,
  getAdminOwnerVerifications,
  reviewOwnerVerification,
  downloadVerificationDocument,
} from '../../services/api';
import './AdminDashboard.css';

const statusLabels = {
  pending: 'Pending request',
  requested: 'Requested',
  owner_accepted: 'Owner accepted',
  awaiting_payment: 'Awaiting payment',
  payment_submitted: 'Payment submitted',
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  owner_completed: 'Awaiting renter confirmation',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
  rejected: 'Rejected',
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [reservations, setReservations] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [payoutModal, setPayoutModal] = useState(null);
  const [payoutReference, setPayoutReference] = useState('');
  const [verifications, setVerifications] = useState([]);

  const loadAdminOps = async ({ quiet = false } = {}) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      const [dashboardData, reservationsData, payoutsData, verificationsData] = await Promise.all([
        getAdminDashboardData(),
        getAdminReservations(),
        getAdminPayouts(),
        getAdminOwnerVerifications(),
      ]);

      setStats(dashboardData.stats || {});
      setReservations(reservationsData.data || []);
      setPayouts(payoutsData.data || []);
      setVerifications(verificationsData.data || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load admin operations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminOps();
  }, []);

  const queues = useMemo(() => {
    const ownerResponse = reservations.filter(reservation =>
      ['pending', 'requested', 'payment_submitted'].includes(reservation.status)
    );
    const paymentVerification = reservations.filter(reservation =>
      reservation.payment?.status === 'pending_verification'
    );
    const active = reservations.filter(reservation =>
      ['scheduled', 'in_progress', 'owner_completed'].includes(reservation.status)
    );
    const disputes = reservations.filter(reservation => reservation.status === 'disputed');
    const pendingPayouts = payouts.filter(payout => payout.status === 'pending');
    const readyPayments = paymentVerification.filter(reservation => reservation.status === 'owner_accepted');

    return { ownerResponse, paymentVerification, readyPayments, active, disputes, pendingPayouts };
  }, [reservations, payouts]);

  const verifyPayment = async reservationId => {
    setBusy(previous => ({ ...previous, [`payment-${reservationId}`]: true }));
    try {
      await verifyAdminReservationPayment(reservationId, 'Verified by admin against the bank statement.');
      toast.success(`Payment for booking #${reservationId} verified and held.`);
      await loadAdminOps({ quiet: true });
    } catch (err) {
      toast.error(err.message || 'Failed to verify payment.');
    } finally {
      setBusy(previous => ({ ...previous, [`payment-${reservationId}`]: false }));
    }
  };

  const submitPayout = async event => {
    event.preventDefault();
    if (!payoutModal || !payoutReference.trim()) return;

    setBusy(previous => ({ ...previous, [`payout-${payoutModal.id}`]: true }));
    try {
      await markAdminPayoutPaid(payoutModal.id, {
        transfer_reference: payoutReference.trim(),
        notes: 'Manual bank transfer from AgroNet account.',
      });
      toast.success(`Payout #${payoutModal.id} marked as paid.`);
      setPayoutModal(null);
      setPayoutReference('');
      await loadAdminOps({ quiet: true });
    } catch (err) {
      toast.error(err.message || 'Failed to mark payout as paid.');
    } finally {
      setBusy(previous => ({ ...previous, [`payout-${payoutModal.id}`]: false }));
    }
  };

  const reviewVerification = async (verification, status) => {
    const needsReason = ['rejected', 'revoked'].includes(status);
    const rejectionReason = needsReason
      ? window.prompt(status === 'revoked' ? 'Why is this owner being unverified?' : 'Why is this verification being rejected?')
      : null;
    if (needsReason && !rejectionReason) return;
    setBusy(previous => ({ ...previous, [`verification-${verification.id}`]: true }));
    try {
      const response = await reviewOwnerVerification(verification.id, { status, rejection_reason: rejectionReason });
      toast.success(response.message);
      await loadAdminOps({ quiet: true });
    } catch (err) {
      toast.error(err.message || 'Could not review verification.');
    } finally {
      setBusy(previous => ({ ...previous, [`verification-${verification.id}`]: false }));
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="admin-loading-state">
          <span className="admin-spinner" />
          <p>Loading marketplace operations…</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="admin-ops-page">
        <header className="admin-ops-hero">
          <div>
            <span className="admin-ops-eyebrow">Marketplace operations</span>
            <h1>Admin command center</h1>
            <p>Review money movement, booking blockers, and owner payouts from one place.</p>
          </div>
          <div className="admin-ops-refresh-wrap">
            {lastUpdated && <small>Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>}
            <button onClick={() => loadAdminOps({ quiet: true })} disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
              {refreshing ? 'Refreshing' : 'Refresh'}
            </button>
          </div>
        </header>

        {error && (
          <div className="admin-alert admin-alert-error" role="alert">
            <AlertTriangle size={18} />
            <span>{error}</span>
            <button onClick={() => loadAdminOps()} aria-label="Retry loading">Retry</button>
          </div>
        )}

        <section className="admin-kpi-grid" aria-label="Operations summary">
          <KpiCard icon={Users} label="Users" value={stats.totalUsers || 0} tone="neutral" />
          <KpiCard icon={Tractor} label="Equipment" value={stats.totalEquipment || 0} tone="neutral" />
          <KpiCard
            icon={CreditCard}
            label="Transfers submitted"
            value={queues.paymentVerification.length}
            note={`${queues.readyPayments.length} ready to verify`}
            tone={queues.readyPayments.length ? 'urgent' : 'positive'}
          />
          <KpiCard
            icon={Banknote}
            label="Pending payouts"
            value={queues.pendingPayouts.length}
            tone={queues.pendingPayouts.length ? 'warning' : 'positive'}
          />
        </section>

        <OpsSection
          icon={ShieldCheck}
          title="Owner verification"
          description="Review private identity documents before granting a public verified-owner badge."
          count={verifications.filter(item => item.status === 'pending').length}
          priority={verifications.some(item => item.status === 'pending')}
        >
          <VerificationTable
            verifications={verifications.filter(item => ['pending', 'approved'].includes(item.status))}
            busy={busy}
            onReview={reviewVerification}
          />
        </OpsSection>

        <OpsSection
          icon={CreditCard}
          title="Payment workflow"
          description="Every submitted bank transfer appears here, including payments still waiting for owner approval."
          count={queues.paymentVerification.length}
          priority
        >
          <PaymentTable
            reservations={queues.paymentVerification}
            busy={busy}
            onVerify={verifyPayment}
          />
        </OpsSection>

        {queues.disputes.length > 0 && (
          <OpsSection
            icon={AlertTriangle}
            title="Disputes requiring attention"
            description="Review these bookings before any funds are released."
            count={queues.disputes.length}
            danger
          >
            <ReservationTable reservations={queues.disputes} emptyText="No open disputes." actionLabel="Review required" />
          </OpsSection>
        )}

        <div className="admin-ops-two-column">
          <OpsSection
            icon={Clock3}
            title="Owner response"
            description="Requests waiting for the equipment owner to accept or reject."
            count={queues.ownerResponse.length}
          >
            <ReservationCards reservations={queues.ownerResponse} emptyText="No requests are waiting for an owner." />
          </OpsSection>

          <OpsSection
            icon={ShieldCheck}
            title="Active work"
            description="Accepted bookings currently scheduled or being completed."
            count={queues.active.length}
          >
            <ReservationCards reservations={queues.active} emptyText="No scheduled or active bookings." />
          </OpsSection>
        </div>

        <OpsSection
          icon={Banknote}
          title="Owner payouts"
          description="Release held funds only after completion is confirmed."
          count={queues.pendingPayouts.length}
        >
          <PayoutTable payouts={queues.pendingPayouts} onStartPayout={payout => {
            setPayoutModal(payout);
            setPayoutReference('');
          }} />
        </OpsSection>
      </div>

      {payoutModal && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => setPayoutModal(null)}>
          <form className="admin-payout-modal" onSubmit={submitPayout} onMouseDown={event => event.stopPropagation()}>
            <button type="button" className="admin-modal-close" onClick={() => setPayoutModal(null)} aria-label="Close payout form">
              <X size={19} />
            </button>
            <span className="admin-modal-icon"><Banknote size={22} /></span>
            <h2>Confirm owner payout</h2>
            <p>
              Record the bank transfer for <strong>{formatMoney(payoutModal.amount, payoutModal.currency)}</strong> to{' '}
              <strong>{fullName(payoutModal.owner)}</strong>.
            </p>
            <label>
              Bank transfer reference
              <input
                autoFocus
                value={payoutReference}
                onChange={event => setPayoutReference(event.target.value)}
                placeholder="e.g. PAY-2026-0042"
                maxLength={120}
                required
              />
            </label>
            <div className="admin-modal-actions">
              <button type="button" className="secondary" onClick={() => setPayoutModal(null)}>Cancel</button>
              <button type="submit" className="primary" disabled={busy[`payout-${payoutModal.id}`] || !payoutReference.trim()}>
                {busy[`payout-${payoutModal.id}`] ? 'Saving…' : 'Confirm paid'}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};

const KpiCard = ({ icon, label, value, note, tone }) => (
  <article className={`admin-kpi-card tone-${tone}`}>
    <span className="admin-kpi-icon">{React.createElement(icon, { size: 20 })}</span>
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  </article>
);

const OpsSection = ({ icon, title, description, count, priority = false, danger = false, children }) => (
  <section className={`admin-ops-section${priority ? ' priority' : ''}${danger ? ' danger' : ''}`}>
    <header>
      <span className="admin-section-icon">{React.createElement(icon, { size: 19 })}</span>
      <div>
        <div className="admin-section-title-row">
          <h2>{title}</h2>
          <span className="admin-section-count">{count}</span>
        </div>
        <p>{description}</p>
      </div>
    </header>
    <div className="admin-section-body">{children}</div>
  </section>
);

const PaymentTable = ({ reservations, busy, onVerify }) => {
  if (!reservations.length) return <EmptyState text="No bank transfers are waiting for review." />;

  return (
    <div className="admin-table-scroll">
      <table className="admin-ops-table">
        <thead><tr><th>Booking</th><th>Renter & equipment</th><th>Transfer</th><th>Total received</th><th>Workflow stage</th><th>Action</th></tr></thead>
        <tbody>
          {reservations.map(reservation => {
            const canVerify = reservation.status === 'owner_accepted';
            const payment = reservation.payment || {};
            const total = Number(payment.amount || 0) + Number(payment.service_fee || 0) + Number(payment.deposit_amount || 0);

            return (
              <tr key={reservation.id}>
                <td><strong>#{reservation.id}</strong><small>{formatDate(reservation.created_at)}</small></td>
                <td><strong>{fullName(reservation.user)}</strong><small>{reservation.equipment?.name || 'Equipment unavailable'}</small></td>
                <td><strong>{payment.transfer_reference || payment.transaction_id || 'No reference'}</strong><small>Bank transfer</small></td>
                <td><strong>{formatMoney(total, payment.currency)}</strong><small>Includes fees and deposit</small></td>
                <td>
                  <StatusBadge status={reservation.status} />
                  {!canVerify && <small className="admin-stage-help">Owner approval required before verification</small>}
                </td>
                <td>
                  <button
                    className="admin-primary-action"
                    disabled={!canVerify || busy[`payment-${reservation.id}`]}
                    onClick={() => onVerify(reservation.id)}
                    title={!canVerify ? 'The equipment owner must accept this booking first' : 'Verify this transfer'}
                  >
                    <CheckCircle2 size={16} />
                    {busy[`payment-${reservation.id}`] ? 'Verifying…' : canVerify ? 'Verify payment' : 'Waiting for owner'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const VerificationTable = ({ verifications, busy, onReview }) => {
  if (!verifications.length) return <EmptyState text="No pending or verified owners yet." />;
  return (
    <div className="admin-table-scroll">
      <table className="admin-ops-table">
        <thead><tr><th>Owner</th><th>Submitted</th><th>Documents</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{verifications.map(verification => (
          <tr key={verification.id}>
            <td><strong>{fullName(verification.user)}</strong><small>{verification.user?.email}</small></td>
            <td>{formatDate(verification.submitted_at)}</td>
            <td>
              <div className="admin-document-actions">
                <button onClick={() => downloadVerificationDocument(verification.id, 'identity')}>Identity</button>
                {verification.has_ownership_document && <button onClick={() => downloadVerificationDocument(verification.id, 'ownership')}>Ownership</button>}
              </div>
            </td>
            <td><span className={`admin-status-badge ${verification.status === 'approved' ? 'status-owner_accepted' : 'status-payment_submitted'}`}>{verification.status === 'approved' ? 'Verified owner' : 'Pending review'}</span></td>
            <td>
              <div className="admin-verification-actions">
                {verification.status === 'approved' ? (
                  <button className="reject" disabled={busy[`verification-${verification.id}`]} onClick={() => onReview(verification, 'revoked')}>Unverify</button>
                ) : (
                  <>
                    <button className="reject" disabled={busy[`verification-${verification.id}`]} onClick={() => onReview(verification, 'rejected')}>Reject</button>
                    <button className="approve" disabled={busy[`verification-${verification.id}`]} onClick={() => onReview(verification, 'approved')}>Approve owner</button>
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
};

const ReservationCards = ({ reservations, emptyText }) => {
  if (!reservations.length) return <EmptyState text={emptyText} />;
  return (
    <div className="admin-booking-list">
      {reservations.slice(0, 6).map(reservation => (
        <article key={reservation.id} className="admin-booking-item">
          <div className="admin-booking-id">#{reservation.id}</div>
          <div className="admin-booking-copy">
            <strong>{reservation.equipment?.name || 'Equipment unavailable'}</strong>
            <span>{fullName(reservation.user)} · {formatDate(reservation.start_date)}–{formatDate(reservation.end_date)}</span>
          </div>
          <StatusBadge status={reservation.status} />
        </article>
      ))}
    </div>
  );
};

const ReservationTable = ({ reservations, emptyText, actionLabel }) => {
  if (!reservations.length) return <EmptyState text={emptyText} />;
  return (
    <div className="admin-table-scroll">
      <table className="admin-ops-table">
        <thead><tr><th>Booking</th><th>Renter</th><th>Equipment</th><th>Dates</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>{reservations.map(reservation => (
          <tr key={reservation.id}>
            <td><strong>#{reservation.id}</strong></td>
            <td>{fullName(reservation.user)}</td>
            <td>{reservation.equipment?.name || '-'}</td>
            <td>{formatDate(reservation.start_date)}–{formatDate(reservation.end_date)}</td>
            <td><StatusBadge status={reservation.status} /></td>
            <td><span className="admin-review-label">{actionLabel}</span></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
};

const PayoutTable = ({ payouts, onStartPayout }) => {
  if (!payouts.length) return <EmptyState text="No owner payouts are pending." />;
  return (
    <div className="admin-table-scroll">
      <table className="admin-ops-table">
        <thead><tr><th>Owner</th><th>Equipment</th><th>Amount</th><th>Bank details</th><th>Action</th></tr></thead>
        <tbody>{payouts.map(payout => (
          <tr key={payout.id}>
            <td><strong>{fullName(payout.owner)}</strong><small>Payout #{payout.id}</small></td>
            <td>{payout.reservation?.equipment?.name || '-'}</td>
            <td><strong>{formatMoney(payout.amount, payout.currency)}</strong></td>
            <td><strong>{payout.bank_name || 'Bank missing'}</strong><small>RIB {payout.rib || 'not configured'}</small></td>
            <td><button className="admin-primary-action" disabled={!payout.rib} onClick={() => onStartPayout(payout)}><Banknote size={16} /> Record payout</button></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
};

const StatusBadge = ({ status }) => (
  <span className={`admin-status-badge status-${status}`}>{statusLabels[status] || status || 'Unknown'}</span>
);

const EmptyState = ({ text }) => (
  <div className="admin-empty-state"><CheckCircle2 size={20} /><span>{text}</span></div>
);

const fullName = user => [user?.prenom, user?.name].filter(Boolean).join(' ') || 'Unknown user';
const formatDate = value => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-';
const formatMoney = (amount, currency = 'MAD') => `${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || 'MAD'}`;

export default AdminDashboard;
