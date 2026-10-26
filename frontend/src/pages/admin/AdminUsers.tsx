import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, AdminUserItem } from '../../api/client';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminUsers(search);
      setUsers(data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to fetch users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleToggleStatus = async (user: AdminUserItem) => {
    const newStatus = !user.is_active;
    const confirmText = newStatus
      ? `Reactivate account for ${user.email}?`
      : `Deactivate account for ${user.email}? The user will not be able to log in.`;

    if (!window.confirm(confirmText)) return;

    try {
      setActionLoading(user.id);
      await api.updateAdminUserStatus(user.id, { is_active: newStatus });
      setMessage({
        type: 'success',
        text: `User ${user.email} ${newStatus ? 'reactivated' : 'deactivated'} successfully.`
      });
      await fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update user status' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRole = async (user: AdminUserItem) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const confirmText = `Change role of ${user.email} to ${newRole.toUpperCase()}?`;

    if (!window.confirm(confirmText)) return;

    try {
      setActionLoading(user.id);
      await api.updateAdminUserStatus(user.id, { role: newRole });
      setMessage({
        type: 'success',
        text: `Role for ${user.email} updated to ${newRole}.`
      });
      await fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update user role' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Link to="/admin" className="hover:text-brand-500 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Admin Portal
            </Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">User Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-500" />
            User Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage registered accounts, view permissions, and control tenant access.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-500" />
            <p className="text-sm">Loading users directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium">No users found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Email Verified</th>
                  <th className="py-3 px-4">Documents</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => {
                  const initials = u.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || 'U';

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {u.full_name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            u.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                              : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {u.role.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            u.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                          }`}
                        >
                          {u.is_active ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Suspended
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {u.is_verified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          {u.document_count}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleRole(u)}
                            disabled={actionLoading === u.id}
                            title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                            className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition text-[11px] font-medium"
                          >
                            {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={actionLoading === u.id}
                            title={u.is_active ? 'Deactivate User' : 'Activate User'}
                            className={`p-1.5 rounded-md border transition ${
                              u.is_active
                                ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30'
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-950/30'
                            }`}
                          >
                            {actionLoading === u.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : u.is_active ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
