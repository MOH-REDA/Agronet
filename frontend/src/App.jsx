import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import SocialAuthCallback from './pages/Auth/SocialAuthCallback';
import Contact from './pages/Contact/Contact';
import Equipment from './pages/Equipment/Equipment';
import HowItWorks from './pages/HowItWorks/HowItWorks';
import UserDashboard from './pages/Dashboard/UserDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import UsersManagement from './pages/Admin/UsersManagement';
import EquipmentManagement from './pages/Admin/EquipmentManagement';
import Settings from './pages/Settings/Settings';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminRoute from './components/ProtectedRoute/AdminRoute';
import { isAdmin } from './services/api';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import ListEquipment from './pages/Equipment/ListEquipment';
import EquipmentConfirmation from './pages/Equipment/EquipmentConfirmation';
import EquipmentDetails from './pages/Equipment/EquipmentDetails';
import EquipmentReservation from './pages/Equipment/EquipmentReservation';
import MyEquipmentDetails from './pages/Equipment/MyEquipmentDetails';
import EquipmentReservationDetails from './pages/Equipment/EquipmentReservationDetails';
import EquipmentReservationConfirm from './pages/Equipment/EquipmentReservationConfirm';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));

  useEffect(() => {
    const syncAuth = () => setIsAuthenticated(!!localStorage.getItem('token'));
    window.addEventListener('agronet:auth-changed', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('agronet:auth-changed', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  return (
    <Router>
      <div className="App">
        <Navbar />
        <main>
          <Routes>
            {/* Public routes that are always accessible */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/equipment" element={<Equipment />} />
            
            {/* Auth routes - redirect to dashboard if already logged in */}
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login />
                )
              }
            />
            <Route
              path="/register"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Register />
                )
              }
            />

            {/* Protected routes - require authentication */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  {isAdmin() ? <AdminDashboard /> : <UserDashboard />}
                </ProtectedRoute>
              }
            />
            <Route path="/auth/social/callback" element={<SocialAuthCallback />} />

            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin routes */}
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <UsersManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/equipment"
              element={
                <AdminRoute>
                  <EquipmentManagement />
                </AdminRoute>
              }
            />

            {/* Protected equipment routes */}
            <Route
              path="/equipment/list"
              element={
                <ProtectedRoute>
                  <ListEquipment />
                </ProtectedRoute>
              }
            />

            <Route
              path="/equipment/confirmation"
              element={
                <ProtectedRoute>
                  <EquipmentConfirmation />
                </ProtectedRoute>
              }
            />

            <Route
              path="/equipment/:id"
              element={
                <ProtectedRoute>
                  <EquipmentDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/equipment/:id/reserve"
              element={
                <ProtectedRoute>
                  <EquipmentReservation />
                </ProtectedRoute>
              }
            />

            <Route
              path="/equipment/:id/reserve/details"
              element={
                <ProtectedRoute>
                  <EquipmentReservationDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/equipment/:id/reserve/confirm"
              element={
                <ProtectedRoute>
                  <EquipmentReservationConfirm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-equipment/:id"
              element={
                <ProtectedRoute>
                  <MyEquipmentDetails />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route - redirect to home if not found */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </Router>
  );
};

export default App;
