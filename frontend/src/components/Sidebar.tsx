import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Bot,
  Search,
  FolderKanban,
  BarChart3,
  Settings,
  Sparkles,
  Sun,
  Moon,
  Layers,
  CheckCircle2,
  AlertCircle,
  Shield,
  Users,
  Activity,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProviderInfo } from '../api/client';

export type NavTab = 'overview' | 'documents' | 'chat' | 'search' | 'collections' | 'analytics' | 'evaluation' | 'settings';

interface SidebarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  activeProvider?: string;
  providers?: ProviderInfo[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isDark,
  onToggleTheme,
  activeProvider = 'local',
  providers = [],
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const currentProviderInfo = providers.find((p) => p.name === activeProvider) || {
    name: 'local',
    display_name: 'Local RAG Engine',
    status: 'connected',
  };

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: '/documents', label: 'Documents', icon: <FileText className="w-5 h-5" /> },
    { path: '/chat', label: 'AI Assistant', icon: <Bot className="w-5 h-5" />, badge: 'RAG' },
    { path: '/search', label: 'Search', icon: <Search className="w-5 h-5" /> },
    { path: '/collections', label: 'Collections', icon: <FolderKanban className="w-5 h-5" /> },
    { path: '/analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { path: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const adminNavItems = [
    { path: '/admin', label: 'Admin Overview', icon: <Shield className="w-5 h-5" /> },
    { path: '/admin/users', label: 'User Directory', icon: <Users className="w-5 h-5" /> },
    { path: '/admin/documents', label: 'Document Pipeline', icon: <FileText className="w-5 h-5" /> },
    { path: '/admin/analytics', label: 'Telemetry & Audits', icon: <Activity className="w-5 h-5" /> },
  ];

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out of TechDoc AI?')) {
      await logout();
      navigate('/login');
    }
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-navy-950 text-slate-300 flex flex-col h-screen border-r border-navy-850 select-none flex-shrink-0 transition-all duration-300">
      {/* Brand Header */}
      <Link to="/dashboard" className="p-5 flex items-center gap-3 border-b border-navy-850 hover:bg-navy-900/50 transition">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 flex items-center justify-center text-white shadow-glow">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight text-white">TechDoc</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 font-semibold border border-brand-500/30">AI</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Document Intelligence SaaS</p>
        </div>
      </Link>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          Platform Workspace
        </div>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-900/50'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-navy-900/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={active ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                    active ? 'bg-white/20 text-white' : 'bg-brand-900/40 text-brand-400 border border-brand-800/50'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Admin Navigation Section */}
        {user?.role === 'admin' && (
          <div className="pt-5 space-y-1">
            <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-indigo-400 uppercase flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Administrative Portal
            </div>
            {adminNavItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50'
                      : 'text-indigo-300 hover:text-white hover:bg-navy-900/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? 'text-white' : 'text-indigo-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Provider Connectivity Indicator */}
      <div className="px-4 py-3 mx-3 mb-2 rounded-xl bg-navy-900/90 border border-navy-800 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            AI Provider
          </span>
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
              currentProviderInfo.status === 'connected'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {currentProviderInfo.status === 'connected' ? (
              <CheckCircle2 className="w-2.5 h-2.5" />
            ) : (
              <AlertCircle className="w-2.5 h-2.5" />
            )}
            {currentProviderInfo.status === 'connected' ? 'Ready' : 'Fallback'}
          </span>
        </div>
        <p className="text-slate-200 font-semibold truncate text-[12px]">{currentProviderInfo.display_name}</p>
        <p className="text-[11px] text-slate-500 truncate mt-0.5">Hybrid RAG + MiniLM Embeddings</p>
      </div>

      {/* Footer Profile & Actions */}
      <div className="p-3 border-t border-navy-850 flex items-center justify-between">
        <Link
          to="/profile"
          className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition py-1 px-1.5 rounded-lg hover:bg-navy-900"
          title="View & Edit Profile"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-brand-600 flex items-center justify-center font-bold text-xs text-white shadow-sm flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || 'Authenticated User'}</p>
            <div className="flex items-center gap-1">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-1 rounded ${user?.role === 'admin' ? 'bg-purple-900/60 text-purple-300' : 'bg-slate-800 text-slate-400'}`}>
                {user?.role || 'user'}
              </span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-850 transition"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-navy-850 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
