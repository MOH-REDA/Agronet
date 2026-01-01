import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Tractor } from 'lucide-react';
import { logout, isAdmin, getNotifications, markNotificationRead } from '../../services/api';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userIsAdmin = isAdmin();

  // Notification state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const fetchUserNotifications = async () => {
    setNotifLoading(true);
    try {
      const data = await getNotifications();
      console.log('Fetched notifications:', data);
      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (data && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      } else if (data && Array.isArray(data.data)) {
        setNotifications(data.data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      setNotifications([]);
    }
    setNotifLoading(false);
  };

  useEffect(() => {
    if (notifOpen && isAuthenticated) {
      fetchUserNotifications();
    }
    // eslint-disable-next-line
  }, [notifOpen, isAuthenticated]);

  const handleNotifClick = (notif) => {
    if (notif.status === 'unread') {
      markNotificationRead(notif.id).then(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, status: 'read' } : n))
        );
      });
    }
    // Optionally, navigate or show details
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light sticky-top">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <div style={{ height: 40, display: 'flex', alignItems: 'center' }}>
            <img src="/AGRONET.svg" alt="Agronet Logo" style={{ maxHeight: '100%', width: 'auto', display: 'block' }} />
          </div>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" end>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/equipment">
                Equipment
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/how-it-works">
                Walktrough
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/about">
                About Us
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/contact">
                Contact Us
              </NavLink>
            </li>
          </ul>

          <ul className="navbar-nav">
            {isAuthenticated && (
              <li className="nav-item position-relative">
                <button
                  className="notif-bell-btn"
                  style={{ background: 'none', border: 'none', position: 'relative', marginRight: 16, cursor: 'pointer' }}
                  onClick={() => setNotifOpen((o) => !o)}
                  aria-label="Notifications"
                >
                  <span role="img" aria-label="bell" style={{ fontSize: 22 }}>🔔</span>
                  {notifications.some(n => n.status === 'unread') && <span className="notif-dot" />}
                </button>
                {notifOpen && (
                  <div className="notif-dropdown">
                    {notifLoading ? (
                      <div className="notif-item">Loading...</div>
                    ) : Array.isArray(notifications) && notifications.length > 0 ? (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`notif-item${n.status === 'unread' ? ' unread' : ''}`}
                          onClick={() => handleNotifClick(n)}
                        >
                          <div>{n.message || JSON.stringify(n)}</div>
                          <div className="notif-date">{new Date(n.created_at).toLocaleString()}</div>
                        </div>
                      ))
                    ) : (
                      <div className="notif-item">No notifications</div>
                    )}
                  </div>
                )}
              </li>
            )}
            {!isAuthenticated ? (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/login">
                    Login
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="btn btn-success ms-lg-2" to="/register">
                    Sign Up
                  </NavLink>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/dashboard">
                    Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="btn btn-outline-success ms-lg-2 me-2" to="/equipment/list">
                    Rent My Own Machine
                  </NavLink>
                </li>
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    id="navbarDropdown"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {user.name || 'Account'}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                    <li>
                      <NavLink className="dropdown-item" to="/dashboard">
                        Dashboard
                      </NavLink>
                    </li>
                    {userIsAdmin && (
                      <>
                        <li>
                          <NavLink className="dropdown-item" to="/admin/users">
                            Manage Users
                          </NavLink>
                        </li>
                        <li>
                          <NavLink className="dropdown-item" to="/admin/equipment">
                            Manage Equipment
                          </NavLink>
                        </li>
                      </>
                    )}
                    <li>
                      <NavLink className="dropdown-item" to="/settings">
                        Settings
                      </NavLink>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button
                        className="dropdown-item text-danger"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 