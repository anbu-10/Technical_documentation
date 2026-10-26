import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Trash2,
  Cpu,
  Moon,
  Sun,
  Bell,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Profile fields
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [preferredProvider, setPreferredProvider] = useState(user?.preferred_provider || 'auto');
  const [theme, setTheme] = useState(user?.theme || 'dark');
  const [emailAlerts, setEmailAlerts] = useState(user?.notification_preferences?.email_notifications ?? true);
  const [secAlerts, setSecAlerts] = useState(user?.notification_preferences?.security_alerts ?? true);

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status & feedback
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      await updateProfile({
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim() || undefined,
        theme,
        preferred_provider: preferredProvider,
        notification_preferences: {
          email_notifications: emailAlerts,
          security_alerts: secAlerts,
        },
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Password update failed.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.deleteAccount();
      await logout();
      navigate('/login');
    } catch (err: any) {
      alert(err.message || 'Failed to delete account.');
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Profile Summary */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user?.full_name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-500 shadow-glow"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 text-white font-black text-xl flex items-center justify-center shadow-glow">
              {getInitials(user?.full_name || 'TechDoc User')}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {user?.full_name}
              </h2>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  user?.role === 'admin'
                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                    : 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-300 dark:border-brand-800'
                }`}
              >
                {user?.role === 'admin' ? 'System Administrator' : 'Engineer'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 justify-center sm:justify-start">
              <Mail className="w-3.5 h-3.5" />
              <span>{user?.email}</span>
            </p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-center sm:justify-start">
              <Calendar className="w-3.5 h-3.5" />
              <span>Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}</span>
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-700 dark:text-slate-300 hover:text-red-600 text-xs font-semibold flex items-center gap-2 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Profile Details Form */}
      <form onSubmit={handleUpdateProfile} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-brand-500" />
            Personal Details & Preferences
          </h3>
          <span className="text-xs text-slate-400">Manage account information</span>
        </div>

        {profileError && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{profileError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address (Immutable)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Avatar Image URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Preferred AI Generation Provider
            </label>
            <select
              value={preferredProvider}
              onChange={(e) => setPreferredProvider(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="auto">Automatic (Best Connected Provider)</option>
              <option value="local">Local Grounded Synthesizer (Built-in)</option>
              <option value="ollama">Ollama (Local LLM Daemon)</option>
              <option value="openai">OpenAI (GPT-4o-mini)</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>
        </div>

        {/* Notifications Checkboxes */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-brand-500" />
            Notification Preferences
          </span>
          <div className="space-y-1.5 text-slate-600 dark:text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Receive email notifications on completed document indexing</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={secAlerts}
                onChange={(e) => setSecAlerts(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Receive security alerts on password changes and new logins</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {profileSuccess ? (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Profile updated successfully!
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={profileSaving}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition active:scale-[0.98] flex items-center gap-2"
          >
            {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Profile</span>
          </button>
        </div>
      </form>

      {/* Change Password Form */}
      <form onSubmit={handleChangePassword} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-500" />
            Change Password
          </h3>
          <span className="text-xs text-slate-400">Update security credentials</span>
        </div>

        {passwordError && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{passwordError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Password (Min. 8)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {passwordSuccess ? (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Password changed successfully!
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={passwordSaving || !currentPassword || !newPassword}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold text-xs shadow-sm transition active:scale-[0.98] flex items-center gap-2"
          >
            {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>Update Password</span>
          </button>
        </div>
      </form>

      {/* Danger Zone: Delete Account */}
      <div className="p-6 rounded-3xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </h4>
            <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
              Permanently remove your account, all uploaded documents, chunks, and AI conversation histories.
            </p>
          </div>

          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-sm transition"
          >
            Delete Account
          </button>
        </div>

        {deleteConfirmOpen && (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 space-y-3 animate-in fade-in">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Are you absolutely sure you want to delete your account? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
              </button>
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
