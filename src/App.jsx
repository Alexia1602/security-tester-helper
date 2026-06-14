import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { AuthProvider, useAuth } from '@/lib/AuthContext';

import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageNotFound from '@/lib/PageNotFound';
import ScrollToTop from '@/components/ScrollToTop';
import { Toaster } from '@/components/ui/toaster';

import Dashboard from '@/pages/Dashboard';
import Sessions from '@/pages/Sessions';
import CodeAnalysis from '@/pages/CodeAnalysis';
import AttackChecklist from '@/pages/AttackChecklist';
import ChainVisualizer from '@/pages/ChainVisualizer';
import ChainBreaker from '@/pages/ChainBreaker';
import AIAudit from '@/pages/AIAudit';

import Login from '@/pages/Login';
import Register from '@/pages/Register';


const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950 text-slate-200 font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400">Se securizează sesiunea locală...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/checklist" element={<AttackChecklist />} />
          <Route path="/analysis" element={<CodeAnalysis />} />
          <Route path="/visualizer" element={<ChainVisualizer />} />
          <Route path="/chain-breaker" element={<ChainBreaker />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/analysis-ai" element={<AIAudit />} />
        </Route>
      </Route>
      
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </AuthProvider>
      
    </QueryClientProvider>
  );
}

export default App;