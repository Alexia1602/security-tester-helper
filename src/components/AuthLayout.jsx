 import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-500/20">
            {Icon && <Icon className="w-7 h-7 text-white" aria-hidden="true" />}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="text-slate-400 mt-2 text-sm">{subtitle}</p>}
        </div>
        
        <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-8">
          {children}
        </div>
        
        {footer && (
          <div className="text-center text-sm text-slate-500 mt-6">{footer}</div>
        )}
      </div>
    </div>
  );
}
