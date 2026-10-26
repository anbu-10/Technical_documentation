import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Sparkles,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Server
} from 'lucide-react';
import { api, SettingsData, ProviderInfo } from '../api/client';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [activeProvider, setActiveProvider] = useState<string>('local');
  const [chunkSize, setChunkSize] = useState<number>(600);
  const [chunkOverlap, setChunkOverlap] = useState<number>(120);
  const [topK, setTopK] = useState<number>(5);
  const [denseWeight, setDenseWeight] = useState<number>(0.65);
  const [enableReranker, setEnableReranker] = useState<boolean>(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setSettings(data);
      setActiveProvider(data.active_provider);
      setChunkSize(data.chunk_size);
      setChunkOverlap(data.chunk_overlap);
      setTopK(data.top_k);
      setDenseWeight(data.dense_weight);
      setEnableReranker(data.enable_reranker);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.updateSettings({
        active_provider: activeProvider,
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap,
        top_k: topK,
        dense_weight: denseWeight,
        sparse_weight: Math.round((1 - denseWeight) * 100) / 100,
        enable_reranker: enableReranker,
      });
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-40 rounded-2xl skeleton-shimmer" />
        <div className="h-64 rounded-2xl skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-brand-600" />
          System & Model Configuration
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage AI providers, vector similarity weights, document chunking parameters, and database adapters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. AI Provider Selection & Status */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand-500" />
              AI Inference Providers & Connectivity
            </h3>
            <span className="text-xs text-slate-400">Select active generation model</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {settings.providers.map((p) => {
              const isSelected = activeProvider === p.name;
              return (
                <div
                  key={p.name}
                  onClick={() => setActiveProvider(p.name)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/30 ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{p.display_name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Model: {p.model}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        p.status === 'connected'
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                          : p.status === 'disconnected'
                          ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {p.status === 'connected' ? (
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      ) : (
                        <AlertCircle className="w-2.5 h-2.5" />
                      )}
                      <span className="capitalize">{p.status.replace('_', ' ')}</span>
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    {p.details}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Retrieval & Hybrid Search Hyperparameters */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-500" />
              Retrieval & Ingestion Hyperparameters
            </h3>
            <span className="text-xs text-slate-400">Fine-tune RAG pipeline</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Top-K Passages Retrieved
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Number of chunks fed into context window</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dense Vector Weight (vs Sparse BM25)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={denseWeight}
                  onChange={(e) => setDenseWeight(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="font-mono font-bold text-brand-600 dark:text-brand-400 w-12 text-right">
                  {Math.round(denseWeight * 100)}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Dense: {Math.round(denseWeight * 100)}% • BM25 Keyword: {Math.round((1 - denseWeight) * 100)}%
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chunk Size (Approx. Characters)
              </label>
              <input
                type="number"
                min="200"
                max="2000"
                step="50"
                value={chunkSize}
                onChange={(e) => setChunkSize(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Target chunk length for splitting parsed text</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chunk Overlap (Approx. Characters)
              </label>
              <input
                type="number"
                min="0"
                max="500"
                step="20"
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Sliding boundary overlap to preserve cross-sentence context</p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-white">Enable Heading & Co-occurrence Reranker</p>
              <p className="text-[11px] text-slate-400">Boosts passages matching title hierarchy and exact technical terms</p>
            </div>
            <input
              type="checkbox"
              checked={enableReranker}
              onChange={(e) => setEnableReranker(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* 3. Storage and Embeddings Engine Info */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-500" />
              Storage Adapters & Vector Database Engine
            </h3>
            <span className="text-xs text-slate-400">Persistence Architecture</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Database Engine</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{settings.database_type}</p>
              <p className="text-[11px] text-slate-500">
                Supports automatic fallback or zero-downtime switch to PostgreSQL + pgvector via DATABASE_URL
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Dense Embedding Model</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{settings.embedding_model}</p>
              <p className="text-[11px] text-slate-500">
                384-dimensional dense semantic vectors with Cosine Similarity and L2 normalization
              </p>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Configuration saved successfully!
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
