import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldAlert,
  Server,
  Zap,
  Clock,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, AdminOverview, AuditLogItem } from '../../api/client';

export const AdminAnalytics: React.FC = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLog, setSearchLog] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ovData, logsData] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminAuditLogs(),
      ]);
      setOverview(ovData);
      setAuditLogs(logsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLogs = auditLogs.filter((log) => {
    if (!searchLog) return true;
    const q = searchLog.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.user_email.toLowerCase().includes(q) ||
      (log.resource_type && log.resource_type.toLowerCase().includes(q))
    );
  });

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
            <span className="text-slate-800 dark:text-slate-200 font-medium">System Telemetry & Audit</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-7 h-7 text-emerald-500" />
            System Analytics & Audit Trails
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor real-time system performance, query throughput, and immutable security audit logs.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Total Questions Ingested</span>
              <Zap className="w-4 h-4 text-brand-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {overview.total_queries}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Avg Hybrid Latency</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {overview.average_latency_ms.toFixed(0)} <span className="text-xs font-normal text-slate-400">ms</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Total Vector Chunks</span>
              <Server className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {overview.total_chunks}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Security Events Recorded</span>
              <ShieldAlert className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {overview.total_audit_events}
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-500" />
              Audit Trail & Security Events
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Immutable logs for compliance, authentication attempts, file access, and administrative actions.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by action or email..."
              value={searchLog}
              onChange={(e) => setSearchLog(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-500" />
              <p className="text-sm">Loading security audit trails...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium">No audit events match your filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 font-sans font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.user_email || 'System'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-brand-600 dark:text-brand-400">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-sans">
                        {log.resource_type ? (
                          <span>
                            {log.resource_type} <span className="text-slate-400 font-mono text-[10px]">({log.resource_id?.slice(0, 8)})</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold border ${
                            log.status === 'success'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                          }`}
                        >
                          {log.status === 'success' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          <span className="uppercase">{log.status}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {log.ip_address || '127.0.0.1'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-sans"
                        >
                          View Payload
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-500" />
                Audit Event Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Action:</span>
                <p className="font-mono font-semibold text-brand-600 dark:text-brand-400 mt-0.5">
                  {selectedLog.action}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Timestamp:</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {new Date(selectedLog.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">User Email:</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {selectedLog.user_email}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Status:</span>
                <p className="font-semibold uppercase text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {selectedLog.status}
                </p>
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                Metadata & Payload:
              </span>
              <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto max-h-60">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
