import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  // Dacă serverul încă verifică token-ul, afișăm un ecran simplu de încărcare
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 font-mono">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span>Se securizează sesiunea locală...</span>
      </div>
    );
  }

  // Dacă utilizatorul nu este autentificat, îl trimitem forțat la login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Dacă totul este în regulă, randează pagina solicitată
  return <Outlet />;
}