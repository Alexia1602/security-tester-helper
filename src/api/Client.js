import axios from 'axios';

// Instanța globală Axios pentru comunicarea cu serverul tău Express local
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor automat pentru injectarea JWT-ului la fiecare cerere către backend
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Hardening suplimentar: Prevenim caching-ul datelor sensibile de securitate în browser
      config.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
      config.headers['Pragma'] = 'no-cache';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Obiect helper local pentru managementul sesiunii de autentificare
api.auth = {
  me: async () => {
    // CORECȚIE ALINIERE: Axios adaugă deja /api, deci apelăm doar /auth/me
    const response = await api.get('/auth/me');
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  
};