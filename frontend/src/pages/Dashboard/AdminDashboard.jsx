import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import { Link } from 'react-router-dom';
import { getAdminDashboardData, promoteToAdmin, getAdminEquipment, getAdminReservations, updateAdminReservationStatus } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEquipment: 0,
    activeRentals: 0,
    totalRevenue: 0
  });

  const [recentUsers, setRecentUsers] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allReservations, setAllReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [reservationsError, setReservationsError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState({});

  useEffect(() => {
    loadDashboardData();
    loadEquipment();
    loadReservations();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getAdminDashboardData();
      setStats(data.stats);
      setRecentUsers(data.recentUsers || []);
      setRecentBookings(data.recentBookings || []);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again later.');
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEquipment = async () => {
    try {
      const response = await getAdminEquipment();
      setEquipment(response.data || []);
    } catch (err) {
      // Optionally handle error
    }
  };

  const loadReservations = async () => {
    setReservationsLoading(true);
    setReservationsError(null);
    try {
      const data = await getAdminReservations();
      setAllReservations(data.data || data.reservations || data || []);
    } catch (err) {
      setReservationsError('Failed to load reservations.');
    }
    setReservationsLoading(false);
  };

  const handlePromoteToAdmin = async (userId) => {
    try {
      await promoteToAdmin(userId);
      await loadDashboardData();
      alert('User successfully promoted to admin!');
    } catch (err) {
      alert('Failed to promote user. Please try again.');
      console.error('Promotion error:', err);
    }
  };

  const handleStatusChange = async (reservationId, newStatus) => {
    setStatusUpdating(prev => ({ ...prev, [reservationId]: true }));
    try {
      await updateAdminReservationStatus(reservationId, newStatus);
      setAllReservations(prev => prev.map(r => r.id === reservationId ? { ...r, status: newStatus } : r));
    } catch (err) {
      alert('Failed to update status.');
    }
    setStatusUpdating(prev => ({ ...prev, [reservationId]: false }));
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const adminEquipment = equipment.filter(item => item.user && item.user.id === user.id);

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

  return (
    <DashboardLayout>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Users</div>
          <div className="stat-value">{stats.totalUsers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Equipment</div>
          <div className="stat-value">{stats.totalEquipment}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Active Rentals</div>
          <div className="stat-value">{stats.activeRentals}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Revenue</div>
          <div className="stat-value">${stats.totalRevenue}</div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Recent Users</h2>
            <Link to="/admin/users" className="btn btn-outline-success">
              Manage All Users
            </Link>
          </div>
          <div className="section-content">
            {recentUsers.length === 0 ? (
              <p className="text-muted">No recent users to display.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Join Date</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map(user => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${user.is_admin ? 'bg-primary' : 'bg-secondary'}`}>
                            {user.is_admin ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td>
                          <Link to={`/admin/users/${user.id}`} className="btn btn-sm btn-outline-primary me-2">
                            View Details
                          </Link>
                          {!user.is_admin && (
                            <button
                              className="btn btn-sm btn-outline-success me-2"
                              onClick={() => handlePromoteToAdmin(user.id)}
                            >
                              Promote to Admin
                            </button>
                          )}
                          <button className="btn btn-sm btn-outline-danger">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="section mt-4">
          <div className="section-header">
            <h2 className="section-title">Your Equipment</h2>
            <Link to="/admin/equipment" className="btn btn-outline-success">
              Manage All Equipment
            </Link>
          </div>
          <div className="section-content">
            {adminEquipment.length === 0 ? (
              <p className="text-muted">No equipment to display.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Owner</th>
                      <th>Daily Rate</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminEquipment.slice(0, 5).map(item => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.status}</td>
                        <td>{item.user?.name || 'Admin'}</td>
                        <td>{item.price || item.minPrice || '-'}</td>
                        <td>
                          <Link to="/admin/equipment" className="btn btn-sm btn-outline-primary">Manage</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

       

        <div className="section mt-4">
          <div className="section-header">
            <h2 className="section-title">Recent bookings</h2>
          </div>
          <div className="section-content">
            {reservationsLoading ? (
              <div className="text-center p-4">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : reservationsError ? (
              <div className="alert alert-danger" role="alert">{reservationsError}</div>
            ) : allReservations.length === 0 ? (
              <p className="text-muted">No reservations to display.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Equipment</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allReservations.map(res => (
                      <tr key={res.id}>
                        <td>{res.user_name || res.user?.name || '-'}</td>
                        <td>{res.equipment_name || res.equipment?.name || '-'}</td>
                        <td>{res.start_date ? new Date(res.start_date).toLocaleDateString() : '-'}</td>
                        <td>{res.end_date ? new Date(res.end_date).toLocaleDateString() : '-'}</td>
                        <td>
                          <select
                            className={`form-select form-select-sm w-auto ${res.status === 'confirmed' ? 'text-success' : res.status === 'pending' ? 'text-warning' : 'text-secondary'}`}
                            value={res.status}
                            disabled={statusUpdating[res.id]}
                            onChange={e => handleStatusChange(res.id, e.target.value)}
                            style={{ minWidth: 110 }}
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                          </select>
                          {statusUpdating[res.id] && <span className="spinner-border spinner-border-sm ms-2" role="status" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard; 