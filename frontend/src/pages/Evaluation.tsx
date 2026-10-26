import React, { useState } from 'react';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  BarChart,
  FileText,
  Target
} from 'lucide-react';
import { api, EvaluationReport } from '../api/client';

export const Evaluation: React.FC = () => {
  const [pipelineMode, setPipelineMode] = useState<string>('hybrid');
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runBenchmark = async () => {
    setIsRunning(true);
    try {
      const res = await api.runEvaluation(pipelineMode);
      setReport(res);
    } catch (e: any) {
      alert(e.message || 'Benchmark run failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-brand-600" />
            Retrieval Pipeline Benchmark & Evaluation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Execute Information Retrieval (IR) evaluation suites to compute MRR, NDCG@5, and Recall@K against ground-truth technical queries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={pipelineMode}
            onChange={(e) => setPipelineMode(e.target.value)}
            disabled={isRunning}
            className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 focus:outline-none"
          >
            <option value="hybrid">Evaluate Hybrid (Dense + BM25)</option>
            <option value="vector">Evaluate Dense Vector Only</option>
            <option value="bm25">Evaluate BM25 Keyword Only</option>
          </select>

          <button
            onClick={runBenchmark}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'Running Benchmark...' : 'Run Benchmark'}</span>
          </button>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="p-4 rounded-2xl bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 text-xs text-brand-900 dark:text-brand-300 flex items-start gap-3">
        <Target className="w-5 h-5 flex-shrink-0 text-brand-600 dark:text-brand-400 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Evaluation Methodology & Ground Truth</p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            This benchmark executes test queries across your indexed technical corpus and calculates true IR metrics:
            <strong> MRR</strong> (Mean Reciprocal Rank), <strong>NDCG@5</strong> (ranking quality with logarithmic discount), and <strong>Recall@K</strong>.
            Values are derived strictly by querying your active vector and BM25 index.
          </p>
        </div>
      </div>

      {/* Results Section */}
      {report && (
        <div className="space-y-6 animate-in fade-in">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">MRR</span>
              <p className="text-xl font-bold text-brand-600 dark:text-brand-400">{report.metrics.mrr}</p>
              <p className="text-[10px] text-slate-400">Mean Recip. Rank</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">NDCG@5</span>
              <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{report.metrics.ndcg_at_5}</p>
              <p className="text-[10px] text-slate-400">Discounted Gain</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">Recall@3</span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {(report.metrics.recall_at_3 * 100).toFixed(0)}%
              </p>
              <p className="text-[10px] text-slate-400">Top-3 Coverage</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">Recall@5</span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {(report.metrics.recall_at_5 * 100).toFixed(0)}%
              </p>
              <p className="text-[10px] text-slate-400">Top-5 Coverage</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">Hit Rate</span>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {(report.metrics.retrieval_hit_rate * 100).toFixed(0)}%
              </p>
              <p className="text-[10px] text-slate-400">Any relevant passage</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">Avg Latency</span>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{report.metrics.average_latency_ms}ms</p>
              <p className="text-[10px] text-slate-400">Per query pipeline</p>
            </div>
          </div>

          {/* Detailed Queries Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Detailed Evaluation Run Breakdown ({report.detailed_results.length} Test Queries)
              </h3>
              <span className="text-[11px] text-slate-400">Mode: {report.pipeline_mode}</span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Benchmark Query</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Hit</th>
                  <th className="py-3 px-4">Recip. Rank</th>
                  <th className="py-3 px-4">NDCG</th>
                  <th className="py-3 px-4">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {report.detailed_results.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 max-w-sm">
                      <p>{r.query}</p>
                      <p className="text-[11px] text-slate-400 font-normal truncate mt-0.5">{r.answer_preview}</p>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-500">{r.category}</td>
                    <td className="py-3 px-4">
                      {r.hit ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Hit
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Miss
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">{r.reciprocal_rank}</td>
                    <td className="py-3 px-4 font-mono">{r.ndcg}</td>
                    <td className="py-3 px-4 text-slate-500">{r.latency_ms} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!report && !isRunning && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <FlaskConical className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Ready to Evaluate Pipeline</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click "Run Benchmark" above to test retrieval precision, recall, and ranking latency on the seeded evaluation queries.
          </p>
        </div>
      )}
    </div>
  );
};
