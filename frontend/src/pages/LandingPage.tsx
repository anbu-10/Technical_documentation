import React from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  Search,
  Bot,
  FlaskConical,
  CheckCircle2,
  Lock,
  Cpu,
  BarChart3,
  Bookmark,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Navigation Header */}
      <header className="h-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 flex items-center justify-center text-white shadow-glow group-hover:scale-105 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            TechDoc <span className="text-brand-400">AI</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
          <a href="#rag-citations" className="hover:text-white transition">Grounded Citations</a>
          <a href="#security" className="hover:text-white transition">Enterprise Security</a>
        </nav>

        <div className="flex items-center gap-3 text-xs">
          {user ? (
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold flex items-center gap-1.5 shadow-glow transition active:scale-[0.98]"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-850 font-semibold transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold flex items-center gap-1.5 shadow-glow transition active:scale-[0.98]"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-6 lg:px-12 max-w-7xl mx-auto w-full text-center space-y-8 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-b from-brand-600/20 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-950/60 border border-brand-800/60 text-brand-400 text-xs font-semibold shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Production Technical Document Intelligence & Hybrid RAG</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Ingest technical docs. <br />
          Ask questions. <span className="bg-gradient-to-r from-brand-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">Verify exact citations.</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          TechDoc AI powers architectural analysis, code documentation search, and compliance Q&A by fusing dense neural vector embeddings with BM25 keyword matching and strict source verification.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to={user ? "/dashboard" : "/register"}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-500 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-brand-900/50 flex items-center gap-2 transition active:scale-[0.98]"
          >
            <span>{user ? 'Open Your Dashboard' : 'Start Ingesting Free'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="px-6 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-sm transition"
          >
            Sign In with Demo Credentials
          </Link>
        </div>

        {/* Interactive Feature Preview Card */}
        <div className="mt-14 max-w-5xl mx-auto rounded-3xl p-1 bg-gradient-to-b from-slate-700 to-slate-900 shadow-2xl">
          <div className="bg-slate-950 rounded-[22px] p-6 md:p-8 space-y-6 text-left">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs text-slate-400 font-mono">TechDoc AI — Assistant Preview</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                RAG Confidence: 98.4%
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Question & Grounded Answer */}
              <div className="lg:col-span-2 space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">User Query</span>
                  <p className="font-semibold text-slate-200 mt-0.5">
                    "Explain the consistent hashing ring and node failure tolerance in the cache spec."
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs leading-relaxed text-slate-300">
                  <div className="flex items-center gap-2 text-brand-400 font-bold">
                    <Bot className="w-4 h-4" />
                    <span>Grounded Technical Synthesis</span>
                  </div>
                  <p>
                    The distributed cache architecture utilizes a <strong>Murmur3 consistent hashing ring</strong> configured with 256 virtual nodes per physical host <span className="text-brand-400 font-bold">[1]</span>. When node partition or timeout occurs, traffic automatically fails over to the next clockwise virtual replica in the ring <span className="text-brand-400 font-bold">[2]</span>.
                  </p>
                </div>
              </div>

              {/* Verified Source Citation Box */}
              <div className="p-4 rounded-xl bg-brand-950/30 border border-brand-800/50 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-brand-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5" />
                    Source [1]
                  </span>
                  <span className="bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded text-[10px]">
                    Page 3 • Spec.md
                  </span>
                </div>
                <p className="font-mono text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  "Consistent Hash Ring: Employs Murmur3 hashing with 256 virtual nodes per physical node to guarantee uniform key distribution."
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Match Score: <strong>81.4%</strong></span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified DB Chunk
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Complete Platform Architecture</span>
          <h2 className="text-3xl font-extrabold text-white">Engineered for Technical Precision</h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Everything needed to ingest, structure, retrieve, and evaluate complex technical documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-brand-600/10 text-brand-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Multi-Format Ingestion</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Native parsers for PDF (PyMuPDF with pypdf fallback), Word (.docx), Markdown (.md), and plain text, preserving headers, page numbers, and structural hierarchy.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/10 text-cyan-400 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Hybrid Retrieval (Dense + BM25)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fuses dense neural semantic similarity (SentenceTransformers) with BM25Okapi exact keyword matching and structure-aware reranking to guarantee zero lexical misses.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center">
              <Bookmark className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Verifiable Grounded Citations</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every factual assertion references real stored chunks with page numbers and excerpts. Zero fabricated source references.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center">
              <FlaskConical className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">IR Benchmark Suite</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Built-in retrieval evaluation measuring Mean Reciprocal Rank (MRR), NDCG@5, and Recall@K against real ground-truth technical queries.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Multi-Tenant Isolation & RBAC</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete isolation between users. Strict authorization checks ensure users can never access, search, or inspect private documents belonging to another user.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Flexible AI Providers</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Works out-of-the-box with the built-in Local Grounded Synthesizer, or seamlessly connects to local Ollama inference, OpenAI GPT, or Google Gemini.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto w-full border-t border-slate-800/80 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Ingestion to Answer Pipeline</span>
          <h2 className="text-3xl font-extrabold text-white">How TechDoc AI Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 text-white font-bold flex items-center justify-center">1</div>
            <h4 className="font-bold text-white">Upload & Validate</h4>
            <p className="text-slate-400">PDF, DOCX, TXT, or MD files are uploaded and validated for MIME types and structure.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 text-white font-bold flex items-center justify-center">2</div>
            <h4 className="font-bold text-white">Structure-Aware Chunking</h4>
            <p className="text-slate-400">Text is partitioned into overlapping windows, preserving section titles and page locations.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 text-white font-bold flex items-center justify-center">3</div>
            <h4 className="font-bold text-white">Hybrid Retrieval & Rerank</h4>
            <p className="text-slate-400">Fuses dense vector cosine similarity with BM25 keyword matching and heading boosts.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 text-white font-bold flex items-center justify-center">4</div>
            <h4 className="font-bold text-white">Grounded Answer & Citations</h4>
            <p className="text-slate-400">Synthesizes factual answers with clickable citations linked directly to verified source passages.</p>
          </div>
        </div>
      </section>

      {/* Security & RBAC Section */}
      <section id="security" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto w-full border-t border-slate-800/80 space-y-12">
        <div className="rounded-3xl p-8 md:p-12 bg-gradient-to-tr from-navy-950 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Enterprise-Ready Security Architecture</span>
            </div>
            <h3 className="text-2xl font-bold text-white">
              Strict User Isolation, Audit Logging, and Zero Data Leakage
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every document, conversation, and vector embedding is strictly scoped to the authenticated user ID. Role-Based Access Control guarantees administrative features are restricted to verified admins. All security events are recorded in immutable audit logs.
            </p>
          </div>

          <div className="space-y-3 w-full md:w-auto">
            <Link
              to="/register"
              className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-glow flex items-center justify-center gap-2 transition"
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-12 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            <span className="font-bold text-slate-300">TechDoc AI</span>
            <span>• Technical Document Intelligence & Question Answering Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-slate-300 transition">Sign In</Link>
            <Link to="/register" className="hover:text-slate-300 transition">Register</Link>
            <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition flex items-center gap-1">
              <span>Swagger API</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
