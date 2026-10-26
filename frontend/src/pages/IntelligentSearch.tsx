import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  Bookmark,
  FileText,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { api, SearchResponse, SearchResultItem, CollectionItem, DocumentItem } from '../api/client';
import { decodeHtmlEntities } from '../utils/textFormatter';

interface IntelligentSearchProps {
  initialQuery?: string;
  onAskAIWithQuery: (query: string) => void;
  collections: CollectionItem[];
  documents: DocumentItem[];
}

export const IntelligentSearch: React.FC<IntelligentSearchProps> = ({
  initialQuery = '',
  onAskAIWithQuery,
  collections,
  documents,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<'hybrid' | 'vector' | 'bm25'>('hybrid');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([
    "architecture pipeline",
    "cache eviction policy",
    "kubernetes ingress configuration",
    "authentication JWT specifications"
  ]);

  const handleSearch = async (searchQuery?: string) => {
    const q = (searchQuery || query).trim();
    if (!q) return;

    setIsSearching(true);
    try {
      const res = await api.search({
        query: q,
        mode,
        collection_id: selectedCollection || undefined,
        limit: 10,
      });
      setResults(res.results);
      setLatency(res.latency_ms);

      if (!searchHistory.includes(q)) {
        setSearchHistory((prev) => [q, ...prev.slice(0, 5)]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header & Search Bar */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-brand-600" />
            Intelligent Document Search
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Execute hybrid searches fusing dense neural vector embeddings with BM25 keyword matching and structure-aware reranking.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="relative"
        >
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords, concepts, or technical questions..."
            className="w-full pl-12 pr-28 py-3.5 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="absolute right-2 top-2 bottom-2 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-xs transition shadow-sm"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Search Mode & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Mode:</span>
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setMode('hybrid')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  mode === 'hybrid'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Hybrid (Dense + BM25)
              </button>
              <button
                type="button"
                onClick={() => setMode('vector')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  mode === 'vector'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Vector Similarity
              </button>
              <button
                type="button"
                onClick={() => setMode('bm25')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  mode === 'bm25'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                BM25 Exact Keyword
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 focus:outline-none"
            >
              <option value="">All Collections</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* History Pills */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Recent Searches:
          </span>
          {searchHistory.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(item);
                handleSearch(item);
              }}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-brand-50 hover:text-brand-600 text-[11px] font-medium transition"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Latency and Status Info */}
      {latency !== null && (
        <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
          <span>Found {results.length} ranked passages</span>
          <span>Latency: <strong className="text-slate-800 dark:text-slate-200">{latency} ms</strong></span>
        </div>
      )}

      {/* Results List */}
      <div className="space-y-4">
        {results.map((item, idx) => (
          <div
            key={item.chunk_id || idx}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 shadow-sm transition space-y-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <FileText className="w-4 h-4 text-brand-500" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">{item.document_title}</span>
                  <span>•</span>
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-medium">
                    Page {item.page_number}
                  </span>
                  {item.section_heading && (
                    <>
                      <span>•</span>
                      <span className="text-brand-600 dark:text-brand-400 font-medium">{item.section_heading}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Score Badges */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-800 text-xs font-bold">
                  {(item.score * 100).toFixed(1)}% Match
                </span>
                <button
                  onClick={() => onAskAIWithQuery(item.text_content)}
                  title="Ask AI about this specific passage"
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Discuss</span>
                </button>
              </div>
            </div>

            {/* Passage Text with Highlighting */}
            <div
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed"
              dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(item.highlighted_text || item.text_content) }}
            />

            {/* Score Breakdown Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Method: <strong className="text-slate-600 dark:text-slate-300">{item.retrieval_method}</strong></span>
              <div className="flex items-center gap-3">
                {item.vector_score !== undefined && (
                  <span>Dense Vector: <strong>{item.vector_score}</strong></span>
                )}
                {item.bm25_score !== undefined && (
                  <span>BM25 Keyword: <strong>{item.bm25_score}</strong></span>
                )}
              </div>
            </div>
          </div>
        ))}

        {!isSearching && results.length === 0 && query && (
          <div className="text-center py-12 text-slate-400 text-xs space-y-2">
            <Search className="w-8 h-8 mx-auto opacity-50" />
            <p>No matching passages found for "{query}".</p>
            <p className="text-[11px]">Try switching between Hybrid, Vector, or BM25 mode, or search with fewer words.</p>
          </div>
        )}
      </div>
    </div>
  );
};
