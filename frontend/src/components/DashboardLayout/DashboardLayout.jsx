import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout, isAdmin } from '../../services/api';
import './DashboardLayout.css';
import { getPublicMediaUrl } from '../../config/api';
import { CalendarCheck, Home, LogOut, Plus, Settings, Tractor, Users } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const DashboardLayout = ({ children }) => {
  const { t } = useLanguage();
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
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}><Home size={18} /> {t('nav.dashboard')}</NavLink>
          
          {!userIsAdmin && (
            <>
              <NavLink to="/equipment" className={({ isActive }) => isActive ? 'active' : ''}><Tractor size={18} /> {t('nav.marketplace')}</NavLink>
              <NavLink to="/equipment/list" className={({ isActive }) => isActive ? 'active' : ''}><Plus size={18} /> {t('nav.list')}</NavLink>
            </>
          )}
          
          {userIsAdmin && (
            <>
              <NavLink to="/my-bookings" className={({ isActive }) => isActive ? 'active' : ''}><CalendarCheck size={18} /> {t('nav.bookings')}</NavLink>
              <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''}><Users size={18} /> {t('nav.users')}</NavLink>
              <NavLink to="/admin/equipment" className={({ isActive }) => isActive ? 'active' : ''}><Tractor size={18} /> {t('nav.equipment')}</NavLink>
            </>
          )}
          
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}><Settings size={18} /> {t('nav.settings')}</NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            {user.avatar_url ? <img src={getPublicMediaUrl(user.avatar_url)} alt="User" className="avatar" /> : <span className="avatar avatar-fallback">{`${user.prenom?.[0] || ''}${user.name?.[0] || ''}`.toUpperCase() || 'A'}</span>}
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{userIsAdmin ? t('role.admin') : t('role.member')}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>{window.location.pathname.split('/').pop().charAt(0).toUpperCase() + window.location.pathname.split('/').pop().slice(1)}</h1>
            <div className="header-actions">
              
              <div className="user-header-info">
                <span className="user-name-header">{user.name}</span>
                <button onClick={handleLogout} className="logout-btn">
                  <LogOut size={16} /> {t('nav.signOut')}
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
