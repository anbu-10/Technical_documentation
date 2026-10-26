import React from 'react';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Forbidden403: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-6 relative z-10">
        <div className="inline-flex p-4 rounded-2xl bg-red-950/40 border border-red-800/50 text-red-400 shadow-xl shadow-red-950/50">
          <ShieldAlert className="w-12 h-12 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-red-900/30 border border-red-800/40 text-red-300 text-xs font-mono font-semibold uppercase tracking-wider">
            HTTP 403 Access Denied
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Restricted Territory
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            You do not possess administrative clearance to access this sector. Privilege escalation attempts are recorded in the security audit trail.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left text-xs space-y-2 text-slate-400 font-mono">
          <div className="flex items-center gap-2 text-slate-300 font-sans font-semibold">
            <Lock className="w-3.5 h-3.5 text-red-400" />
            Security Enforcement Policy
          </div>
          <p className="text-[11px]">
            Tenant separation protocols strictly restrict system operations, raw ingestion metrics, and user management to verified Admin accounts.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Public Home
          </Link>
        </div>
      </div>
    </div>
  );
};
