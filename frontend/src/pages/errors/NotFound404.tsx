import React from 'react';
import { Compass, Home, Search, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotFound404: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-6 relative z-10">
        <div className="inline-flex p-4 rounded-2xl bg-brand-950/40 border border-brand-800/50 text-brand-400 shadow-xl shadow-brand-950/50">
          <Compass className="w-12 h-12 animate-[spin_10s_linear_infinite]" />
        </div>

        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-brand-900/30 border border-brand-800/40 text-brand-300 text-xs font-mono font-semibold uppercase tracking-wider">
            HTTP 404 Not Found
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Document Not Located
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            The requested vector coordinates or resource page could not be located in our index. The page may have been moved, renamed, or deleted.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <Link
            to="/search"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition"
          >
            <Search className="w-4 h-4" />
            Search Knowledge Base
          </Link>
        </div>
      </div>
    </div>
  );
};
