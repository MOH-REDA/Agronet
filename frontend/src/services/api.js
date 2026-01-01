import axios from 'axios';

const API_URL = 'http://localhost:8000/api'; // adjust this to match your backend URL

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
    const response = await api.put(`/equipment/${id}`, equipmentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
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
    const response = await api.post('/register', userData);
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

export default api; 