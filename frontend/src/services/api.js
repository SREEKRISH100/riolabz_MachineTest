import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token and guest token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const guestToken = localStorage.getItem('guest_token');
  if (guestToken) {
    config.headers['x-guest-token'] = guestToken;
  }

  return config;
});

// Response interceptor to capture any generated guest token
api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.data && response.data.data.guestToken) {
      localStorage.setItem('guest_token', response.data.data.guestToken);
    }
    return response;
  },
  (error) => {
    // If token invalid, remove it
    if (error.response && error.response.status === 401) {
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
