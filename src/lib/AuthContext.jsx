import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '@/api/Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      
      // Apelează endpoint-ul nativ de Express (/api/auth/me) prin instanța api
      const currentUser = await api.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Autentificarea utilizatorului a eșuat:', error);
      localStorage.removeItem('token'); 
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({
        type: 'auth_failed',
        message: error.response?.data?.message || 'Sesiune expirată. Te rugăm să te reconectezi.'
      });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setIsAuthenticated(true);
    window.location.href = '/dashboard';
  };

  const logout = () => {
    api.auth.logout();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      authError,
      logout,
      login,
      checkUserAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};