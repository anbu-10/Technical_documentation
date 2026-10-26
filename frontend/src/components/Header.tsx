import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Upload,
  Bell,
  User as UserIcon,
  Shield,
  Settings,
  LogOut,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenUpload: () => void;
  onQuickSearch?: (query: string) => void;
}

const pathMeta: Record<string, { title: string; section: string; subtitle: string }> = {
  '/dashboard': { section: 'Platform', title: 'Dashboard Overview', subtitle: 'Platform health, ingestion metrics, and user activity' },
  '/documents': { section: 'Platform', title: 'Document Management', subtitle: 'Upload, parse, chunk, and index technical manuals & specs' },
  '/chat': { section: 'Platform', title: 'AI Assistant & Q&A', subtitle: 'Grounded multi-document question answering with source citations' },
  '/search': { section: 'Platform', title: 'Intelligent Search', subtitle: 'Hybrid dense semantic vectors combined with BM25 keyword matching' },
  '/collections': { section: 'Platform', title: 'Document Collections', subtitle: 'Organize technical documentation into isolated namespaces' },
  '/analytics': { section: 'Platform', title: 'Analytics & Insights', subtitle: 'Query latency, retrieval hit rate, and user feedback logs' },
  '/settings': { section: 'Platform', title: 'System Settings', subtitle: 'Configure LLM providers, embedding models, and chunking parameters' },
  '/profile': { section: 'Account', title: 'User Profile & Settings', subtitle: 'Personal information, security credentials, and AI preferences' },
  '/admin': { section: 'Administration', title: 'System Admin Dashboard', subtitle: 'Multi-tenant operational overview and system telemetry' },
  '/admin/users': { section: 'Administration', title: 'User Account Directory', subtitle: 'Manage registered users, assign roles, and control access' },
  '/admin/documents': { section: 'Administration', title: 'System-Wide Ingestion Pipeline', subtitle: 'Inspect customer documents, processing jobs, and error logs' },
  '/admin/analytics': { section: 'Administration', title: 'Telemetry & Security Audits', subtitle: 'Query latency throughput and immutable compliance logs' },
};

export const Header: React.FC<HeaderProps> = ({ onOpenUpload, onQuickSearch }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const meta = pathMeta[location.pathname] || {
    section: 'Workspace',
    title: 'TechDoc AI',
    subtitle: 'Technical Document Intelligence Platform',
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      if (onQuickSearch) onQuickSearch(searchInput.trim());
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
      navigate('/login');
    }
  };

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 flex-shrink-0 transition-colors">
      {/* Title & Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{meta.section}</span>
          <span>/</span>
          <span className="font-semibold text-brand-600 dark:text-brand-400">{meta.title}</span>
        </div>
        <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
          {meta.title}
        </h1>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Search */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search documents or query vectors..."
            className="w-64 pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900 transition"
          />
        </form>

        {/* AI Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>RAG Active</span>
        </div>

        {/* Upload Action */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm hover:shadow transition active:scale-[0.98]"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Document</span>
        </button>

        {/* Notifications */}
        <button
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-brand-500 absolute top-1.5 right-1.5"></span>
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {initials}
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden lg:inline max-w-[120px] truncate">
              {user?.full_name || 'Account'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.full_name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {user?.role}
                  </span>
                  {user?.is_verified && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
              </div>

              <div className="py-1 text-xs">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>Profile & Preferences</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>System Settings</span>
                </Link>

                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 font-medium transition"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Control Center</span>
                  </Link>
                )}
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
