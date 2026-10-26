import React, { useEffect, useState } from 'react';
import {
  FileText,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Clock,
  Upload,
  Bot,
  Search,
  ArrowRight,
  Sparkles,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { api, AnalyticsSummary, DocumentItem, ConversationItem } from '../api/client';
import { NavTab } from '../components/Sidebar';

interface OverviewProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenUpload: () => void;
  onOpenDoc: (doc: DocumentItem) => void;
  onSelectConversation: (convId: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({
  onSelectTab,
  onOpenUpload,
  onOpenDoc,
  onSelectConversation,
}) => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalytics();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl skeleton-shimmer border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 rounded-xl skeleton-shimmer border border-slate-200 dark:border-slate-800" />
          <div className="h-72 rounded-xl skeleton-shimmer border border-slate-200 dark:border-slate-800" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Uploaded Documents',
      value: data?.total_documents ?? 0,
      icon: <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />,
      sub: `${data?.total_chunks ?? 0} indexed chunks`,
      color: 'bg-brand-50 dark:bg-brand-950/40 border-brand-100 dark:border-brand-900/50',
    },
    {
      label: 'Processed & Indexed',
      value: data?.processed_documents ?? 0,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      sub: `${data?.failed_documents ?? 0} failed ingestion`,
      color: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50',
    },
    {
      label: 'Questions Answered',
      value: data?.total_questions ?? 0,
      icon: <HelpCircle className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      sub: `${data?.positive_feedback_count ?? 0} positive ratings`,
      color: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-100 dark:border-cyan-900/50',
    },
    {
      label: 'Search Success Rate',
      value: `${data?.search_success_rate ?? 100}%`,
      icon: <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      sub: `Avg latency: ${data?.average_latency_ms ?? 0}ms`,
      color: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50',
    },
  ];

  const pieColors = ['#10b981', '#3b82f6', '#ef4444'];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-navy-950 via-navy-900 to-brand-950 text-white border border-navy-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-brand-600/10 to-transparent pointer-events-none" />
        <div className="space-y-1.5 z-10 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            RAG Document Intelligence
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Ask questions, verify citations, and analyze technical specs.
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Ingest architectural docs, code manuals, and compliance guides. Ground all AI answers strictly in real parsed text chunks with page citations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            onClick={onOpenUpload}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-brand-900/40 transition active:scale-[0.98]"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
          <button
            onClick={() => onSelectTab('chat')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 backdrop-blur transition"
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            Launch Assistant
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border ${card.color} flex flex-col justify-between transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{card.label}</span>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-sm">{card.icon}</div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{card.value}</p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Status Breakdown */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Document Ingestion Pipeline</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Status breakdown across uploaded technical files</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {data?.total_documents} Total
            </span>
          </div>

          <div className="h-60 flex items-center justify-center">
            {data?.processing_chart && data.processing_chart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.processing_chart}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.processing_chart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No documents processed yet</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
            {data?.processing_chart.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 dark:text-slate-400">{item.name}:</span>
                <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Query Activity Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Retrieval Query Volume</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Distribution by search and retrieval mode</p>
            </div>
            <button
              onClick={() => onSelectTab('analytics')}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>View Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-60">
            {data?.query_chart && data.query_chart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.query_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="mode" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="queries" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 flex items-center justify-center h-full">No queries logged yet</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span>Powered by Reciprocal Rank Fusion (RRF)</span>
            <span className="font-semibold text-brand-600 dark:text-brand-400">Real-time DB logs</span>
          </div>
        </div>
      </div>

      {/* Recent Documents & Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-brand-500" />
              Recently Uploaded Documents
            </h3>
            <button
              onClick={() => onSelectTab('documents')}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
            >
              All Documents
            </button>
          </div>

          <div className="space-y-2.5">
            {data?.recent_documents && data.recent_documents.length > 0 ? (
              data.recent_documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onOpenDoc(doc)}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {doc.original_name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {doc.page_count} pages • {doc.chunk_count} chunks • {(doc.file_size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      doc.status === 'completed'
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                        : doc.status === 'failed'
                        ? 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400'
                        : 'bg-brand-100 dark:bg-brand-950/50 text-brand-700 dark:text-brand-400'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No documents uploaded yet. Click Upload Document to begin.
              </div>
            )}
          </div>
        </div>

        {/* Recent AI Discussions */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-500" />
              Recent AI Conversations
            </h3>
            <button
              onClick={() => onSelectTab('chat')}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
            >
              Start New Chat
            </button>
          </div>

          <div className="space-y-2.5">
            {data?.recent_conversations && data.recent_conversations.length > 0 ? (
              data.recent_conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onSelectTab('chat');
                  }}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {conv.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {conv.message_count} messages
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No conversations yet. Ask questions to explore your documents!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
