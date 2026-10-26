import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layers, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setErrorMsg('No verification token provided in URL.');
      setLoading(false);
      return;
    }

    api.verifyEmail(token)
      .then(async () => {
        setSuccess(true);
        if (user) await refreshUser();
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Verification token is invalid or expired.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-2">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 flex items-center justify-center text-white shadow-glow group-hover:scale-105 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">TechDoc <span className="text-brand-400">AI</span></span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-slate-100 mt-2">
          Email Verification
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
          {loading ? (
            <div className="py-8 space-y-3">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Verifying your email token with the security server...</p>
            </div>
          ) : success ? (
            <div className="space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-glow">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">Email Address Verified!</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                Your account is now verified. You have full authenticated access to document ingestion, hybrid vector search, and AI assistant capabilities.
              </p>
              <div className="pt-2">
                <Link
                  to={user ? "/dashboard" : "/login"}
                  className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-xs shadow-lg transition active:scale-[0.98]"
                >
                  <span>{user ? 'Continue to Dashboard' : 'Sign In to Your Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">Verification Failed</h3>
              <p className="text-xs text-red-400 leading-relaxed">
                {errorMsg}
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 hover:underline"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
