import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Heart,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Tractor,
  Users,
  X
} from 'lucide-react';
import {
  logout,
  isAdmin,
  getNotifications,
  getFavoriteEquipmentIds,
  markNotificationRead,
  markAllNotificationsRead
} from '../../services/api';
import './Navbar.css';
import { getPublicMediaUrl } from '../../config/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { getNotificationCopy, localizeNotification, notificationTypeLabel } from './notificationCopy';

const getNotificationIcon = (type) => {
  if (type === 'completion_requested') return CircleCheck;
  if (type === 'reservation_status') return CheckCheck;
  if (type === 'reservation') return CalendarClock;
  if (type === 'dispute') return AlertTriangle;
  return Bell;
};

const formatRelativeTime = (value, language) => {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return '';

  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];

  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }

  return formatter.format(0, 'second');
};

const Navbar = () => {
  const { language, t } = useLanguage();
  const notificationCopy = getNotificationCopy(language);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('token');
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const userIsAdmin = isAdmin();

  const notificationRef = useRef(null);
  const accountRef = useRef(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('all');
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    const syncUser = () => setUser(JSON.parse(localStorage.getItem('user') || '{}'));
    window.addEventListener('agronet:user-updated', syncUser);
    window.addEventListener('agronet:auth-changed', syncUser);
    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener('agronet:user-updated', syncUser);
      window.removeEventListener('agronet:auth-changed', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  const fetchUserNotifications = useCallback(async (showLoading = false) => {
    if (!isAuthenticated) return;
    if (showLoading) setNotifLoading(true);
    try {
      const data = await getNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (data && Array.isArray(data.data)) {
        setNotifications(data.data);
      } else {
        setNotifications([]);
      }
    } catch (_err) {
      if (showLoading) setNotifications([]);
    } finally {
      if (showLoading) setNotifLoading(false);
    }
  }, [isAuthenticated]);

  const fetchFavoriteCount = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoriteCount(0);
      return;
    }

    try {
      const data = await getFavoriteEquipmentIds();
      const ids = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setFavoriteCount(ids.length);
    } catch (_err) {
      setFavoriteCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    fetchUserNotifications(true);
    fetchFavoriteCount();
    const intervalId = window.setInterval(() => fetchUserNotifications(), 45000);
    const refreshOnFocus = () => fetchUserNotifications();
    window.addEventListener('focus', refreshOnFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [fetchFavoriteCount, fetchUserNotifications, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const syncFavorites = () => fetchFavoriteCount();
    window.addEventListener('focus', syncFavorites);
    window.addEventListener('agronet:favorites-updated', syncFavorites);
    return () => {
      window.removeEventListener('focus', syncFavorites);
      window.removeEventListener('agronet:favorites-updated', syncFavorites);
    };
  }, [fetchFavoriteCount, isAuthenticated]);

  useEffect(() => {
    if (!notifOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!notificationRef.current?.contains(event.target)) setNotifOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setNotifOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [notifOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!accountOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setAccountOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [accountOpen]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const closeMobileMenu = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    const closeAtDesktopWidth = () => {
      if (window.innerWidth > 991) setMobileOpen(false);
    };

    document.addEventListener('keydown', closeMobileMenu);
    window.addEventListener('resize', closeAtDesktopWidth);
    return () => {
      document.removeEventListener('keydown', closeMobileMenu);
      window.removeEventListener('resize', closeAtDesktopWidth);
    };
  }, [mobileOpen]);

  const unreadCount = notifications.filter(notification => notification.status === 'unread').length;
  const visibleNotifications = useMemo(
    () => notificationFilter === 'unread'
      ? notifications.filter(notification => notification.status === 'unread')
      : notifications,
    [notificationFilter, notifications]
  );

  const handleNotifClick = async (notif) => {
    if (notif.status === 'unread') {
      setNotifications(prev => prev.map(item => item.id === notif.id ? { ...item, status: 'read' } : item));
      try {
        await markNotificationRead(notif.id);
      } catch (_err) {
        fetchUserNotifications();
      }
    }

    setNotifOpen(false);
    const reservationId = notif.data?.reservation_id;
    navigate(reservationId ? `/my-bookings?reservation=${reservationId}` : '/my-bookings');
  };

  const handleMarkAllRead = async () => {
    if (!unreadCount) return;
    setNotifications(prev => prev.map(item => ({ ...item, status: 'read' })));
    try {
      await markAllNotificationsRead();
    } catch (_err) {
      fetchUserNotifications();
    }
  };

  const handleLogout = () => {
    logout();
    setAccountOpen(false);
    setMobileOpen(false);
    navigate('/login');
  };

  const userInitials = `${user.prenom?.[0] || ''}${user.name?.[0] || ''}`.toUpperCase() || 'A';
  const displayName = [user.prenom, user.name].filter(Boolean).join(' ') || 'Account';

  return (
    <header className="site-header">
      <nav className="agronet-navbar" aria-label="Main navigation">
        <div className="agronet-nav-shell">
          <Link className="agronet-brand" to="/" aria-label="AgroNet home">
            <span className="brand-logo-wrap">
              <img src="/AGRONET.svg" alt="" className="brand-logo" />
            </span>
            <span className="brand-copy">
              <strong>AgroNet</strong>
              <small>{t('brand.tagline')}</small>
            </span>
          </Link>

          <div className="desktop-nav-links">
            <NavLink className={({ isActive }) => `primary-nav-link${isActive ? ' active' : ''}`} to="/equipment">
              {t('nav.marketplace')}
            </NavLink>
            <NavLink className={({ isActive }) => `primary-nav-link${isActive ? ' active' : ''}`} to="/how-it-works">
              {t('nav.how')}
            </NavLink>
            <NavLink className={({ isActive }) => `primary-nav-link${isActive ? ' active' : ''}`} to="/about">
              {t('nav.about')}
            </NavLink>
            <NavLink className={({ isActive }) => `primary-nav-link${isActive ? ' active' : ''}`} to="/contact">
              {t('nav.contact')}
            </NavLink>
          </div>

          <div className="nav-actions">
            {isAuthenticated && (
              <NavLink className="list-equipment-action desktop-only-action" to="/equipment/list">
                <Plus size={17} aria-hidden="true" />
                {t('nav.list')}
              </NavLink>
            )}

            {isAuthenticated && (
              <NavLink className="favorites-nav-link desktop-only-action" to="/equipment?favorites=1">
                <Heart size={16} aria-hidden="true" />
                {t('nav.saved')}
                {favoriteCount > 0 && <span className="favorites-count">{favoriteCount}</span>}
              </NavLink>
            )}

            {isAuthenticated && (
              <div className="notification-menu" ref={notificationRef}>
                <button
                  type="button"
                  className="notif-bell-btn"
                  onClick={() => {
                    setNotifOpen((open) => !open);
                    setAccountOpen(false);
                    setMobileOpen(false);
                  }}
                  aria-label={t('nav.notifications')}
                  aria-expanded={notifOpen}
                  aria-haspopup="dialog"
                >
                  <Bell size={21} aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="notif-count" aria-label={`${unreadCount} ${notificationCopy.unreadPlural}`}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="notif-dropdown" role="dialog" aria-label={notificationCopy.panel}>
                    <div className="notif-header">
                      <div className="notif-header-main">
                        <span className="notif-title-icon"><Bell size={18} aria-hidden="true" /></span>
                        <div className="notif-header-copy">
                          <h2>{t('nav.notifications')}</h2>
                          <span>{unreadCount ? `${unreadCount} ${unreadCount === 1 ? notificationCopy.unread : notificationCopy.unreadPlural}` : notificationCopy.caughtUp}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="notif-close"
                        onClick={() => setNotifOpen(false)}
                        aria-label={notificationCopy.close}
                      >
                        <X size={18} aria-hidden="true" />
                      </button>
                    </div>

                    <div className="notif-toolbar">
                      <div className="notif-filters" role="tablist" aria-label={notificationCopy.filter}>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={notificationFilter === 'all'}
                          className={notificationFilter === 'all' ? 'active' : ''}
                          onClick={() => setNotificationFilter('all')}
                        >
                          {notificationCopy.all}
                        </button>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={notificationFilter === 'unread'}
                          className={notificationFilter === 'unread' ? 'active' : ''}
                          onClick={() => setNotificationFilter('unread')}
                        >
                          {notificationCopy.unreadTab} {unreadCount > 0 && <span>{unreadCount}</span>}
                        </button>
                      </div>
                      <button
                        type="button"
                        className="notif-mark-all"
                        onClick={handleMarkAllRead}
                        disabled={!unreadCount}
                        title={notificationCopy.markAll}
                      >
                        <CheckCheck size={15} aria-hidden="true" />
                        {notificationCopy.markAll}
                      </button>
                    </div>

                    <div className="notif-list">
                      {notifLoading ? (
                        <div className="notif-loading" aria-label={notificationCopy.loading}>
                          <span />
                          <span />
                          <span />
                        </div>
                      ) : visibleNotifications.length > 0 ? (
                        visibleNotifications.map(n => {
                          const NotificationIcon = getNotificationIcon(n.type);
                          return (
                            <button
                              type="button"
                              key={n.id}
                              className={`notif-item${n.status === 'unread' ? ' unread' : ''}`}
                              onClick={() => handleNotifClick(n)}
                            >
                              <span className="notif-icon-wrap">
                                <span className={`notif-type-icon notif-type-${n.type || 'general'}`}>
                                  <NotificationIcon size={18} aria-hidden="true" />
                                </span>
                                {n.status === 'unread' && <span className="notif-unread-dot" aria-label={notificationCopy.unread} />}
                              </span>
                              <span className="notif-content">
                                <span className="notif-meta">
                                  <strong>{notificationTypeLabel(n.type, language)}</strong>
                                  <time title={new Date(n.created_at).toLocaleString(language)}>{formatRelativeTime(n.created_at, language)}</time>
                                </span>
                                <span className="notif-message">{localizeNotification(n, language)}</span>
                                {n.data?.reservation_id && <span className="notif-reference">#{n.data.reservation_id}</span>}
                              </span>
                              <ChevronRight className="notif-item-arrow" size={17} aria-hidden="true" />
                            </button>
                          );
                        })
                      ) : (
                        <div className="notif-empty">
                          <span><Inbox size={25} aria-hidden="true" /></span>
                          <strong>{notificationFilter === 'unread' ? notificationCopy.noneUnread : notificationCopy.none}</strong>
                          <p>{notificationCopy.emptyHint}</p>
                        </div>
                      )}
                    </div>

                    <Link className="notif-footer" to="/my-bookings" onClick={() => setNotifOpen(false)}>
                      <span>{t('nav.bookings')}</span>
                      <ChevronRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {!isAuthenticated ? (
              <div className="guest-actions desktop-only-action">
                <NavLink className="sign-in-link" to="/login">{t('nav.signIn')}</NavLink>
                <NavLink className="create-account-action" to="/register">{t('nav.register')}</NavLink>
              </div>
            ) : (
              <div className="account-menu desktop-only-action" ref={accountRef}>
                <button
                  type="button"
                  className="account-trigger"
                  onClick={() => {
                    setAccountOpen((open) => !open);
                    setNotifOpen(false);
                  }}
                  aria-label="Open account menu"
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                >
                  <span className="account-avatar">{user.avatar_url ? <img src={getPublicMediaUrl(user.avatar_url)} alt="" /> : userInitials}</span>
                  <span className="account-trigger-copy">
                    <strong>{displayName}</strong>
                    <small>{userIsAdmin ? t('role.admin') : t('role.member')}</small>
                  </span>
                  <ChevronDown size={16} aria-hidden="true" />
                </button>

                {accountOpen && (
                  <div className="account-dropdown" role="menu">
                    <div className="account-dropdown-header">
                      <span className="account-avatar large">{user.avatar_url ? <img src={getPublicMediaUrl(user.avatar_url)} alt="" /> : userInitials}</span>
                      <span>
                        <strong>{displayName}</strong>
                        <small>{user.email || (userIsAdmin ? 'Administrator' : 'AgroNet member')}</small>
                      </span>
                    </div>
                    <NavLink className="account-menu-item" to="/dashboard" role="menuitem">
                      <LayoutDashboard size={17} aria-hidden="true" />
                      {t('nav.dashboard')}
                    </NavLink>
                    <NavLink className="account-menu-item" to="/my-bookings" role="menuitem">
                      <CalendarClock size={17} aria-hidden="true" />
                      {t('nav.bookings')}
                    </NavLink>
                    <NavLink className="account-menu-item" to="/equipment?favorites=1" role="menuitem">
                      <Heart size={17} aria-hidden="true" />
                      {t('nav.saved')} {favoriteCount > 0 ? `(${favoriteCount})` : ''}
                    </NavLink>
                    {userIsAdmin && (
                      <>
                        <NavLink className="account-menu-item" to="/admin/users" role="menuitem">
                          <Users size={17} aria-hidden="true" />
                          {t('nav.users')}
                        </NavLink>
                        <NavLink className="account-menu-item" to="/admin/equipment" role="menuitem">
                          <Tractor size={17} aria-hidden="true" />
                          {t('nav.equipment')}
                        </NavLink>
                      </>
                    )}
                    <NavLink className="account-menu-item" to="/settings" role="menuitem">
                      <Settings size={17} aria-hidden="true" />
                      {t('nav.settings')}
                    </NavLink>
                    <div className="account-menu-divider" />
                    <button className="account-menu-item danger" type="button" onClick={handleLogout} role="menuitem">
                      <LogOut size={17} aria-hidden="true" />
                      {t('nav.signOut')}
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => {
                setMobileOpen((open) => !open);
                setNotifOpen(false);
                setAccountOpen(false);
              }}
              aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
            >
              {mobileOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="mobile-nav-panel" id="mobile-navigation">
            <div className="mobile-nav-links">
              <NavLink className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`} to="/equipment">
                {t('nav.marketplace')}
              </NavLink>
              <NavLink className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`} to="/how-it-works">
                {t('nav.how')}
              </NavLink>
              <NavLink className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`} to="/about">
                {t('nav.about')}
              </NavLink>
              <NavLink className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`} to="/contact">
                {t('nav.contact')}
              </NavLink>
            </div>

            {isAuthenticated ? (
              <div className="mobile-account-section">
                <div className="mobile-account-identity">
                  <span className="account-avatar large">{user.avatar_url ? <img src={getPublicMediaUrl(user.avatar_url)} alt="" /> : userInitials}</span>
                  <span>
                    <strong>{displayName}</strong>
                    <small>{userIsAdmin ? t('role.admin') : t('role.member')}</small>
                  </span>
                </div>
                <NavLink className="mobile-primary-action" to="/equipment/list">
                  <Plus size={17} aria-hidden="true" />
                  {t('nav.list')}
                </NavLink>
                <div className="mobile-account-links">
                  <NavLink to="/dashboard">
                    <LayoutDashboard size={17} aria-hidden="true" /> {t('nav.dashboard')}
                  </NavLink>
                  <NavLink to="/my-bookings">
                    <CalendarClock size={17} aria-hidden="true" /> {t('nav.bookings')}
                  </NavLink>
                  <NavLink to="/equipment?favorites=1">
                    <Heart size={17} aria-hidden="true" /> {t('nav.saved')} {favoriteCount > 0 ? `(${favoriteCount})` : ''}
                  </NavLink>
                  {userIsAdmin && (
                    <NavLink to="/admin/users">
                      <Users size={17} aria-hidden="true" /> {t('nav.users')}
                    </NavLink>
                  )}
                  <NavLink to="/settings">
                    <Settings size={17} aria-hidden="true" /> {t('nav.settings')}
                  </NavLink>
                  <button type="button" onClick={handleLogout}>
                    <LogOut size={17} aria-hidden="true" /> {t('nav.signOut')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mobile-guest-actions">
                <NavLink className="mobile-sign-in" to="/login">{t('nav.signIn')}</NavLink>
                <NavLink className="mobile-create-account" to="/register">{t('nav.register')}</NavLink>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
