import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Clock,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { api, AnalyticsSummary } from '../api/client';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="h-28 rounded-2xl skeleton-shimmer" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl skeleton-shimmer" />
          <div className="h-64 rounded-2xl skeleton-shimmer" />
        </div>
      </div>
    );
  }

  const pieColors = ['#10b981', '#3b82f6', '#ef4444'];

  const feedbackTotal = (data?.positive_feedback_count ?? 0) + (data?.negative_feedback_count ?? 0);
  const satisfactionRate = feedbackTotal > 0
    ? Math.round(((data?.positive_feedback_count ?? 0) / feedbackTotal) * 100)
    : 100;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-600" />
          Analytics & Insights Dashboard
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Metrics calculated from real query logs, retrieved chunk counts, and recorded user feedback.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Average Latency</span>
            <Clock className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.average_latency_ms ?? 0} ms</p>
          <p className="text-[11px] text-slate-400">Hybrid retrieval + inference</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Search Success Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.search_success_rate ?? 100}%</p>
          <p className="text-[11px] text-slate-400">Queries with &gt;0 matched chunks</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>User Satisfaction</span>
            <ThumbsUp className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{satisfactionRate}%</p>
          <p className="text-[11px] text-slate-400">
            {data?.positive_feedback_count} upvotes / {data?.negative_feedback_count} downvotes
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Answered Queries</span>
            <HelpCircle className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.total_questions ?? 0}</p>
          <p className="text-[11px] text-slate-400">{data?.total_chunks ?? 0} searchable chunks</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retrieval Query Volume */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Query Mode Utilization</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.query_chart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <Bar dataKey="queries" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ingestion Status */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ingestion Pipeline Reliability</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.processing_chart || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(data?.processing_chart || []).map((entry, index) => (
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
          </div>
        </div>
      </div>
    </div>
  );
};
