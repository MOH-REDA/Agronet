import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout, isAdmin } from '../../services/api';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const userIsAdmin = isAdmin();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-text">AC</div>
          <h3>Agronet</h3>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/dashboard" className={window.location.pathname === '/dashboard' ? 'active' : ''}>
            <i className="fas fa-home"></i> Dashboard
          </Link>
          
          {!userIsAdmin && (
            <>
              <Link to="/bookings" className={window.location.pathname === '/bookings' ? 'active' : ''}>
                <i className="fas fa-calendar"></i> Bookings
              </Link>
              <Link to="/equipment" className={window.location.pathname === '/equipment' ? 'active' : ''}>
                <i className="fas fa-tractor"></i> Equipment
              </Link>
              <Link to="/reviews" className={window.location.pathname === '/reviews' ? 'active' : ''}>
                <i className="fas fa-star"></i> Reviews
              </Link>
            </>
          )}
          
          {userIsAdmin && (
            <>
              <Link to="/admin/users" className={window.location.pathname === '/admin/users' ? 'active' : ''}>
                <i className="fas fa-users"></i> Users
              </Link>
              <Link to="/admin/equipment" className={window.location.pathname === '/admin/equipment' ? 'active' : ''}>
                <i className="fas fa-tractor"></i> Equipment
              </Link>
            </>
          )}
          
          <Link to="/settings" className={window.location.pathname === '/settings' ? 'active' : ''}>
            <i className="fas fa-cog"></i> Settings
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <img src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="User" className="avatar" />
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{userIsAdmin ? 'Administrator' : 'User'}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-fontent">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>{window.location.pathname.split('/').pop().charAt(0).toUpperCase() + window.location.pathname.split('/').pop().slice(1)}</h1>
            <div className="header-actions">
              
              <div className="user-header-info">
                <span className="user-name-header">{user.name}</span>
                <button onClick={handleLogout} className="logout-btn">
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </div>
            </div>
          </div>
        </header>
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout; 