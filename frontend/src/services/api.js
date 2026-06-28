import axios from 'axios';
import { API_URL } from '../config/api';

const api = axios.create({
  baseURL: API_URL,
  // Do NOT set default Content-Type here; set per-request below
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Equipment endpoints
export const getAllEquipment = async (filters = {}) => {
  try {
    const response = await api.get('/equipment', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getEquipmentTypes = async () => {
  try {
    const response = await api.get('/equipment/types');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getUserEquipment = async () => {
  try {
    const response = await api.get('/user/equipment');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createEquipment = async (equipmentData) => {
  try {
    // If equipmentData is FormData, do NOT set Content-Type
    const isFormData = equipmentData instanceof FormData;
    const response = await api.post(
      '/equipment',
      equipmentData,
      isFormData ? {} : { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateEquipment = async (id, equipmentData) => {
  try {
    const isFormData = equipmentData instanceof FormData;
    if (isFormData) {
      equipmentData.append('_method', 'PUT');
    }

    const response = isFormData
      ? await api.post(`/equipment/${id}`, equipmentData)
      : await api.put(`/equipment/${id}`, equipmentData, { headers: { 'Content-Type': 'application/json' } });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getMarketplaceStats = async () => {
  const response = await api.get('/equipment/marketplace-stats');
  return response.data;
};

export const getEquipmentAdvice = async (payload) => {
  const response = await api.post('/equipment/advisor', payload);
  return response.data;
};

export const getFavoriteEquipmentIds = async () => {
  const response = await api.get('/favorites');
  return response.data;
};

export const addEquipmentFavorite = async (equipmentId) => {
  const response = await api.post(`/favorites/${equipmentId}`);
  return response.data;
};

export const removeEquipmentFavorite = async (equipmentId) => {
  const response = await api.delete(`/favorites/${equipmentId}`);
  return response.data;
};

export const deleteEquipment = async (id) => {
  try {
    const response = await api.delete(`/equipment/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const reserveEquipment = async (equipmentId, reservationData) => {
  try {
    const response = await api.post(`/equipment/${equipmentId}/reserve`, reservationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getEquipmentReservations = async () => {
  try {
    const response = await api.get('/equipment/reservations');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const submitReservationReview = async (reservationId, payload) => {
  const response = await api.post(`/reservations/${reservationId}/review`, payload);
  return response.data;
};

export const getUserReservations = async () => {
  try {
    const response = await api.get('/user/reservations');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const ownerMarkReservationComplete = async (reservationId) => {
  try {
    const response = await api.patch(`/reservations/${reservationId}/owner-complete`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const renterConfirmReservationCompletion = async (reservationId) => {
  try {
    const response = await api.patch(`/reservations/${reservationId}/confirm-completion`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const disputeReservation = async (reservationId, reason = '') => {
  try {
    const response = await api.patch(`/reservations/${reservationId}/dispute`, { reason });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const respondToReservation = async (reservationId, decision) => {
  try {
    const response = await api.patch(`/reservations/${reservationId}/owner-decision`, { decision });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Admin equipment endpoints
export const getAdminEquipment = async () => {
  try {
    const response = await api.get('/admin/equipment');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateEquipmentStatus = async (equipmentId, status) => {
  try {
    const response = await api.patch(`/admin/equipment/${equipmentId}/status`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const adminDeleteEquipment = async (equipmentId) => {
  try {
    const response = await api.delete(`/admin/equipment/${equipmentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// User authentication
export const register = async (userData) => {
  try {
    const response = await api.post(
      '/register',
      userData,
      userData instanceof FormData ? {} : { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const login = async (credentials) => {
  try {
    const response = await api.post('/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // Store user data
      const userData = response.data.user || await getCurrentUser();
      localStorage.setItem('user', JSON.stringify(userData));
      window.dispatchEvent(new Event('agronet:auth-changed'));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/user');
    // Update stored user data
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Admin functions
export const promoteToAdmin = async (userId) => {
  try {
    const response = await api.post(`/admin/promote/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createAdmin = async (adminData) => {
  try {
    const response = await api.post('/admin/create', adminData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAdminDashboardData = async () => {
  try {
    const response = await api.get('/admin/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('agronet:auth-changed'));
};

// Helper function to check if the current user is an admin
export const isAdmin = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // Check if user exists and has is_admin property set to true
    return user && user.is_admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Admin user management
export const getAllUsers = async () => {
  try {
    const response = await api.get('/admin/users');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const demoteAdmin = async (userId) => {
  try {
    const response = await api.post(`/admin/demote/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Notification endpoints
export const getNotifications = async () => {
  try {
    const response = await api.get('/notifications');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const markNotificationRead = async (id) => {
  try {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAdminReservations = async () => {
  try {
    const response = await api.get('/admin/reservations');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateAdminReservationStatus = async (reservationId, status) => {
  try {
    const response = await api.patch(`/admin/reservations/${reservationId}/status`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getSocialProviders = async () => {
  const response = await api.get('/auth/providers');
  return response.data;
};

export const exchangeSocialLogin = async (code) => {
  try {
    const response = await api.post('/auth/social/exchange', { code });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    window.dispatchEvent(new Event('agronet:auth-changed'));
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const markAllNotificationsRead = async () => {
  try {
    const response = await api.post('/notifications/read-all');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const verifyAdminReservationPayment = async (reservationId, verification_notes = '') => {
  try {
    const response = await api.patch(`/admin/reservations/${reservationId}/payment/verify`, { verification_notes });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAdminPayouts = async () => {
  try {
    const response = await api.get('/admin/payouts');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const markAdminPayoutPaid = async (payoutId, payload) => {
  try {
    const response = await api.patch(`/admin/payouts/${payoutId}/paid`, payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getOwnerVerification = async () => {
  const response = await api.get('/owner-verification');
  return response.data;
};

export const submitOwnerVerification = async (formData) => {
  const response = await api.post('/owner-verification', formData);
  return response.data;
};

export const uploadProfileAvatar = async (formData) => {
  const response = await api.post('/user/avatar', formData);
  return response.data;
};

export const getAdminOwnerVerifications = async () => {
  const response = await api.get('/admin/owner-verifications');
  return response.data;
};

export const reviewOwnerVerification = async (id, payload) => {
  const response = await api.patch(`/admin/owner-verifications/${id}`, payload);
  return response.data;
};

export const revokeUserOwnerVerification = async (userId, reason) => {
  const response = await api.patch(`/admin/users/${userId}/owner-verification/revoke`, { reason });
  return response.data;
};

export const downloadVerificationDocument = async (id, type) => {
  const response = await api.get(`/admin/owner-verifications/${id}/documents/${type}`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
};

export default api;
