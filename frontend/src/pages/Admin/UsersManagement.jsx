import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { getAllUsers, promoteToAdmin, createAdmin, deleteUser, demoteAdmin, revokeUserOwnerVerification } from '../../services/api';
import { getPublicMediaUrl } from '../../config/api';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import './UsersManagement.css';

const USERS_PER_PAGE = 5;

const UsersManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Get current user from localStorage to check if super admin
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = currentUser.email === 'admin@admin';

  // Calculate pagination
  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
  const indexOfLastUser = currentPage * USERS_PER_PAGE;
  const indexOfFirstUser = indexOfLastUser - USERS_PER_PAGE;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error.message || 'Failed to fetch users');
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePromoteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to promote this user to admin?')) {
      return;
    }

    try {
      const response = await promoteToAdmin(userId);
      toast.success(response.message || 'User promoted to admin successfully');
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error promoting user:', error);
      toast.error(error.message || 'Failed to promote user');
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      }
    }
  };

  const handleDemoteAdmin = async (userId) => {
    if (!window.confirm('Are you sure you want to remove admin privileges from this user?')) {
      return;
    }

    try {
      const response = await demoteAdmin(userId);
      toast.success(response.message || 'Admin privileges removed successfully');
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error demoting admin:', error);
      toast.error(error.message || 'Failed to remove admin privileges');
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await deleteUser(userId);
      toast.success(response.message || 'User deleted successfully');
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      }
    }
  };

  const handleUnverifyOwner = async (user) => {
    const reason = window.prompt(`Why are you unverifying ${user.prenom || ''} ${user.name}?`);
    if (!reason) return;
    try {
      const response = await revokeUserOwnerVerification(user.id, reason);
      toast.success(response.message);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to unverify owner');
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    
    if (newAdmin.password !== newAdmin.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const response = await createAdmin({
        name: newAdmin.name,
        prenom: newAdmin.prenom,
        email: newAdmin.email,
        password: newAdmin.password
      });

      toast.success(response.message || 'Admin created successfully');
      setShowCreateModal(false);
      setNewAdmin({
        name: '',
        prenom: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error creating admin:', error);
      toast.error(error.message || 'Failed to create admin');
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAdmin(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="users-loading">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="users-management">
        <div className="users-header">
          <div className="users-header-content">
            <h1>Users</h1>
            <p>Manage accounts, roles, and platform access.</p>
          </div>
          <div className="users-header-actions">
            <button
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              Create New Admin
            </button>
          </div>
        </div>

        <div className="users-table-container">
          <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Owner trust</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-name">
                    <span className="users-avatar">{user.avatar_url ? <img src={getPublicMediaUrl(user.avatar_url)} alt="" /> : `${user.prenom?.[0] || ''}${user.name?.[0] || ''}`.toUpperCase()}</span>
                    <span className="full-name">{user.prenom} {user.name}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge ${user.is_admin ? 'badge-admin' : 'badge-user'}`}>
                    {user.is_admin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td>
                  {user.is_verified_owner ? (
                    <div className="owner-trust-actions"><span className="owner-verified-badge">Verified</span><button onClick={() => handleUnverifyOwner(user)}>Unverify</button></div>
                  ) : <span className="owner-not-verified">Not verified</span>}
                </td>
                <td>
                  {user.created_at ? (
                    format(new Date(user.created_at), 'MMM dd, yyyy HH:mm')
                  ) : (
                    'N/A'
                  )}
                </td>
                <td className="actions">
                  {!user.is_admin && (
                    <>
                      <button
                        className="btn-promote"
                        onClick={() => handlePromoteUser(user.id)}
                        title="Promote to Admin"
                      >
                        Promote
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete User"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {user.is_admin && isSuperAdmin && user.email !== 'admin@admin' && (
                    <button
                      className="btn-demote"
                      onClick={() => handleDemoteAdmin(user.id)}
                      title="Remove Admin Privileges"
                    >
                      Demote
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          </table>

          <div className="table-info">
            <span>Total Users: {users.length}</span>
            <span>Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, users.length)} of {users.length} users</span>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>

      {/* Create Admin Modal */}
        {showCreateModal && (
          <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Admin</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateAdmin}>
              <div className="form-group">
                <label htmlFor="prenom">First Name</label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={newAdmin.prenom}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">Last Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newAdmin.name}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newAdmin.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={newAdmin.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                  required
                  minLength={6}
                />
                <small>Password must be at least 6 characters long</small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={newAdmin.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm password"
                  required
                  minLength={6}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Admin
                </button>
              </div>
            </form>
          </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UsersManagement;
