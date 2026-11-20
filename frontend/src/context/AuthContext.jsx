import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [isLoading, setIsLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [redirectPath, setRedirectPath] = useState(null);

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  // Helper to ensure guest cart items are merged into user's account and localStorage cleaned
  const syncGuestCartAfterAuth = async () => {
    const guestToken = localStorage.getItem('guest_token');
    if (guestToken) {
      try {
        await api.post('/cart/merge', { guestToken });
      } catch (e) {
        console.warn('Guest cart merge notice:', e);
      } finally {
        localStorage.removeItem('guest_token');
      }
    }
    // Notify CartContext to immediately fetch the newly merged cart
    window.dispatchEvent(new Event('cart-updated'));
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user: userData, token: userToken } = res.data.data;

      setUser(userData);
      setToken(userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', userToken);

      await syncGuestCartAfterAuth();

      setAuthModalOpen(false);
      const targetRedirect = userData.role === 'admin' ? '/admin' : redirectPath;
      setRedirectPath(null);
      return { success: true, user: userData, redirect: targetRedirect };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, message, isRateLimited: error.response?.status === 429 };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', userData);
      const { user: newUser, token: userToken } = res.data.data;

      setUser(newUser);
      setToken(userToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('token', userToken);

      await syncGuestCartAfterAuth();

      setAuthModalOpen(false);
      const targetRedirect = newUser.role === 'admin' ? '/admin' : redirectPath;
      setRedirectPath(null);
      return { success: true, user: newUser, redirect: targetRedirect };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed.';
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore logout network errors
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/auth/profile', profileData);
      const updatedUser = res.data.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile',
      };
    }
  };

  const openAuth = (mode = 'login', redirect = null) => {
    setAuthMode(mode);
    setRedirectPath(redirect);
    setAuthModalOpen(true);
  };

  const closeAuth = () => {
    setRedirectPath(null);
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'admin',
        isLoading,
        authModalOpen,
        authMode,
        setAuthMode,
        openAuth,
        closeAuth,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
