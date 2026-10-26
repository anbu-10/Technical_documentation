import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  FileText,
  Activity,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  CheckCircle2,
  ListFilter
} from 'lucide-react';
import { api, AdminOverview } from '../../api/client';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminOverview()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-navy-950 border border-purple-900/60 shadow-xl flex items-center justify-between text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>System Administrator Console</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Enterprise Infrastructure & Audit Overview</h2>
          <p className="text-xs text-slate-300">
            Monitor tenant accounts, inspect multi-user document queues, and track security audit events.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Link
            to="/admin/users"
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-white shadow-sm transition"
          >
            Manage Users
          </Link>
          <Link
            to="/admin/documents"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200 transition"
          >
            All Documents
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Registered Users</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.total_users ?? 0}</p>
          <p className="text-[11px] text-slate-400">{data?.active_users} active • {data?.admin_users} admins</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>System Documents</span>
            <FileText className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.total_documents ?? 0}</p>
          <p className="text-[11px] text-slate-400">{data?.total_chunks ?? 0} indexed chunks</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Ingestion Health</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.completed_documents ?? 0}</p>
          <p className="text-[11px] text-slate-400">{data?.failed_documents ?? 0} failed jobs</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Audit Events</span>
            <Activity className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.total_audit_events ?? 0}</p>
          <p className="text-[11px] text-slate-400">{data?.total_queries ?? 0} total queries</p>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/users"
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 shadow-sm transition group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>User Management</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Inspect all tenant accounts, activate or deactivate users, and promote or demote administrative privileges.
          </p>
        </Link>

        <Link
          to="/admin/documents"
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-600 shadow-sm transition group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Document Overview</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View system-wide document status, diagnose failed parser errors, and re-trigger chunking pipelines.
          </p>
        </Link>

        <Link
          to="/admin/analytics"
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-600 shadow-sm transition group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Audit Logs & Security</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Inspect immutable security event records, IP addresses, authentication logs, and document upload traces.
          </p>
        </Link>
      </div>
    </div>
  );
};
