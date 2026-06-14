 import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Terminal, 
  GitFork, 
  Zap, 
  History, 
  LogOut, 
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Attack Checklist', path: '/checklist', icon: ShieldCheck },
    { name: 'Code Analysis', path: '/analysis', icon: Terminal },
    { name: 'Attack Visualizer', path: '/visualizer', icon: GitFork },
    { name: 'Chain Breaker', path: '/chain-breaker', icon: Zap },
    { name: 'Audit Sesiuni', path: '/sessions', icon: History },
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen bg-slate-900 border-r border-slate-800 flex flex-col justify-between text-slate-300 z-20 transition-all duration-200 ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Zona de Sus: Logo & Toggle Button */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3 truncate animate-fade-in">
            <span className="text-xl">🛡️</span>
            <div className="truncate">
              <h1 className="font-bold text-white text-sm tracking-wider uppercase truncate">Security Helper</h1>
              <span className="text-[10px] text-blue-400 font-mono font-semibold">AI DIAGNOSTIC SUITE</span>
          </div>
        </div>
        )}
        {collapsed && <span className="text-xl mx-auto mb-1">🛡️</span>}
        
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white hidden lg:block"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Zona de Mijloc: Navigare */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.name : ''}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white font-semibold shadow-md' 
                    : 'hover:bg-slate-800 hover:text-slate-100'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Zona de Jos: Profil & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className={`flex items-center gap-3 mb-3 px-2 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 border border-slate-700 shrink-0">
            <User className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.username || user?.email || 'SecTester'}</p>
              <p className="text-[10px] text-slate-400 font-mono capitalize">Auditor Local</p>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          title={collapsed ? "Deconectare" : ""}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Deconectare</span>}
        </button>
      </div>
    </aside>
  );
}
