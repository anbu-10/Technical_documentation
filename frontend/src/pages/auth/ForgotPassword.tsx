import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Mail, ArrowRight, Loader2, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { api } from '../../api/client';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetTokenDev, setResetTokenDev] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await api.forgotPassword(email.trim());
      setSubmitted(true);
      if (res.reset_token_dev) {
        setResetTokenDev(res.reset_token_dev);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          Reset your password
        </h2>
        <p className="text-xs text-slate-400">
          Enter your registered email address and we'll send you recovery instructions
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {submitted ? (
            <div className="text-center space-y-4 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Password Reset Link Dispatched</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                If an account exists with <strong className="text-slate-200">{email}</strong>, you will receive an email with a secure, expiring token.
              </p>

              {/* Dev Shortcut button for testing ease */}
              {resetTokenDev && (
                <div className="p-3.5 rounded-xl bg-brand-950/40 border border-brand-800/60 text-xs space-y-2 text-left">
                  <div className="flex items-center gap-1.5 font-bold text-brand-300">
                    <KeyRound className="w-4 h-4 text-brand-400" />
                    <span>Development Direct Link:</span>
                  </div>
                  <button
                    onClick={() => navigate(`/reset-password?token=${resetTokenDev}`)}
                    className="w-full py-2 px-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-sm transition"
                  >
                    Proceed with Reset Token
                  </button>
                </div>
              )}

              <div className="pt-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 hover:underline"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/80 text-xs text-red-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="engineer@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/70 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-brand-900/50 transition active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
                Remember your password?{' '}
                <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300 hover:underline">
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
