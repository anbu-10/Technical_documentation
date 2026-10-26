import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  RefreshCw,
  Mail,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, AdminDocumentItem } from '../../api/client';

export const AdminDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<AdminDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminDocuments(statusFilter !== 'all' ? statusFilter : undefined);
      setDocuments(data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to fetch documents' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter]);

  const handleRetry = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setRetryingId(docId);
      await api.adminRetryDocument(docId);
      setMessage({ type: 'success', text: 'Document ingestion re-triggered successfully.' });
      await fetchDocuments();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to retry ingestion' });
    } finally {
      setRetryingId(null);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      doc.original_name.toLowerCase().includes(q) ||
      doc.owner_email.toLowerCase().includes(q) ||
      doc.file_type.toLowerCase().includes(q)
    );
  });

  const completedCount = documents.filter((d) => d.status === 'completed').length;
  const failedCount = documents.filter((d) => d.status === 'failed').length;
  const processingCount = documents.filter((d) => d.status === 'processing' || d.status === 'pending').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Link to="/admin" className="hover:text-brand-500 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Admin Portal
            </Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">Document Ingestion</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-brand-500" />
            Document Processing Pipeline
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            System-wide view of all customer documents, ingestion pipeline states, and error diagnostics.
          </p>
        </div>

        <button
          onClick={fetchDocuments}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Pipeline
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

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Ingested</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{documents.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{completedCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Processing / Pending
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{processingCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Ingestion Errors
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{failedCount}</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by document title, owner email, or format..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading && filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-500" />
            <p className="text-sm">Loading document records...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium">No documents match filter criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Owner Email</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Pages / Chunks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Ingested At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {doc.original_name}
                      </div>
                      {doc.error_message && (
                        <div className="text-[11px] text-red-500 font-mono mt-0.5 truncate max-w-xs">
                          {doc.error_message}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {doc.owner_email}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {doc.file_type}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {(doc.file_size / 1024).toFixed(1)} KB
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <span>{doc.page_count} pgs</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-400" />
                          {doc.chunk_count} chunks
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          doc.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : doc.status === 'failed'
                            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {doc.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                        {doc.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                        {(doc.status === 'processing' || doc.status === 'pending') && (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        )}
                        <span className="capitalize">{doc.status}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {doc.status === 'failed' && (
                        <button
                          onClick={(e) => handleRetry(doc.id, e)}
                          disabled={retryingId === doc.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-950/40 dark:hover:bg-brand-900/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800 transition"
                        >
                          <RotateCcw className={`w-3 h-3 ${retryingId === doc.id ? 'animate-spin' : ''}`} />
                          Retry Ingestion
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
