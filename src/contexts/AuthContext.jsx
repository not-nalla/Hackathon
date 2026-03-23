import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('smis_user');
      return stored ? JSON.parse(stored) : null;
    } catch(err) { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('smis_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data.user);
      localStorage.setItem('smis_user', JSON.stringify(response.data.user));
    } catch (err) {
      setUser(null);
      localStorage.removeItem('smis_token');
      localStorage.removeItem('smis_user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/api/auth/login', { email, password });
      
      localStorage.setItem('smis_token', response.data.token);
      localStorage.setItem('smis_user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const loginWithToken = async (token) => {
    localStorage.setItem('smis_token', token);
    await checkAuth();
    return { success: true };
  };

  const signup = async (fullName, email, password, jobTitle, department) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/api/auth/register', {
        fullName, email, password, jobTitle, department
      });

      localStorage.setItem('smis_token', response.data.token);
      localStorage.setItem('smis_user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Signup failed.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('smis_token');
    localStorage.removeItem('smis_user');
    setUser(null);
    window.location.href = '/login';
  };

  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.patch('/api/user/profile', updates);
      
      // Update local storage object
      const updatedUser = { ...user, ...response.data };
      localStorage.setItem('smis_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update profile.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    loginWithToken,
    signup,
    logout,
    updateProfile,
    checkAuth,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};