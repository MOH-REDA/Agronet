import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import { Link } from 'react-router-dom';
import { getCurrentUser, getUserEquipment, deleteEquipment } from '../../services/api';
import { toast } from 'react-toastify';

const UserDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeRentals: 0,
    completedBookings: 0,
    rating: 0,
    totalEquipment: 0
  });

  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [myEquipment, setMyEquipment] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [userData, equipmentData] = await Promise.all([
        getCurrentUser(),
        getUserEquipment()
      ]);

      setUserData(userData);
      setMyEquipment(equipmentData.data || []);
      
      // Update stats with user data
      setStats({
        totalEarnings: userData.totalEarnings || 0,
        activeRentals: userData.activeRentals || 0,
        completedBookings: userData.completedBookings || 0,
        rating: userData.rating || 0,
        totalEquipment: equipmentData.data?.length || 0
      });
      
      setUpcomingBookings(userData.upcomingBookings || []);
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
      <div className="welcome-section mb-4">
        <h2>Welcome back, {userData?.name}!</h2>
        <p className="text-muted">Here's what's happening with your account</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Earnings</div>
          <div className="stat-value">${stats.totalEarnings}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Active Rentals</div>
          <div className="stat-value">{stats.activeRentals}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Completed Bookings</div>
          <div className="stat-value">{stats.completedBookings}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Rating</div>
          <div className="stat-value">
            <i className="fas fa-star text-warning"></i> {stats.rating}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">My Equipment</div>
          <div className="stat-value">{stats.totalEquipment}</div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section mt-4">
          <div className="section-header">
            <h2 className="section-title">Your Equipment</h2>
            <Link to="/equipment/list" className="btn btn-success">
              Add New Equipment
            </Link>
          </div>
          <div className="section-content">
            {myEquipment.length === 0 ? (
              <div className="text-center p-4">
                <p className="text-muted mb-3">You haven't listed any equipment yet</p>
                <Link to="/equipment/add" className="btn btn-success">
                  Add Your First Equipment
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Equipment</th>
                      <th>Status</th>
                      <th>Daily Rate</th>
                      <th>Total Bookings</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myEquipment.map(equipment => (
                      <tr key={equipment.id}>
                        <td>
                          <Link to={{ pathname: `/my-equipment/${equipment.id}`, state: { equipment } }}>
                            {equipment.name}
                          </Link>
                        </td>
                        <td>
                          <span className={`badge ${equipment.status === 'active' ? 'bg-success' : 'bg-warning'}`}>{equipment.status}</span>
                        </td>
                        <td>{equipment.price || equipment.minPrice || '-'}</td>
                        <td>{equipment.total_bookings || 0}</td>
                        <td>
                          <Link to={{ pathname: '/equipment/list', state: { edit: true, equipment } }} className="btn btn-sm btn-outline-primary me-2">Edit</Link>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteEquipment(equipment.id)}>Delete</button>
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

export default UserDashboard; 