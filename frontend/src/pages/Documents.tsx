import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Grid,
  List as ListIcon,
  RotateCcw,
  Trash2,
  ExternalLink,
  Eye,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Folder,
  Layers,
  Sparkles,
  Download,
  Edit2
} from 'lucide-react';
import { api, DocumentItem, DocumentDetail, CollectionItem } from '../api/client';
import { decodeHtmlEntities } from '../utils/textFormatter';

interface DocumentsProps {
  onOpenUpload: () => void;
  onAskDoc: (docId: string) => void;
  collections: CollectionItem[];
}

export const Documents: React.FC<DocumentsProps> = ({
  onOpenUpload,
  onAskDoc,
  collections,
}) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Preview / Detail Modal State
  const [selectedDoc, setSelectedDoc] = useState<DocumentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'chunks' | 'text'>('chunks');
  const [rawTextPreview, setRawTextPreview] = useState<string>('');

  // Rename Modal State
  const [renameDoc, setRenameDoc] = useState<{ id: string; name: string } | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await api.getDocuments({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        file_type: typeFilter !== 'all' ? typeFilter : undefined,
        sort_by: sortBy,
      });
      setDocuments(docs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [searchQuery, statusFilter, typeFilter, sortBy]);

  const handleOpenDetail = async (doc: DocumentItem) => {
    try {
      setDetailLoading(true);
      const detail = await api.getDocument(doc.id);
      setSelectedDoc(detail);
      const textPrev = await api.getDocumentPreview(doc.id).catch(() => ({ preview_text: 'Preview not available' }));
      setRawTextPreview(textPrev.preview_text);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRetry = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.retryDocument(docId);
      fetchDocuments();
    } catch (err: any) {
      alert(err.message || 'Retry failed');
    }
  };

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this document and all its indexed chunks?')) {
      try {
        await api.deleteDocument(docId);
        fetchDocuments();
        if (selectedDoc?.id === docId) setSelectedDoc(null);
      } catch (err: any) {
        alert(err.message || 'Delete failed');
      }
    }
  };

  const handleOpenRename = (doc: DocumentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameDoc({ id: doc.id, name: doc.original_name });
    setRenameInput(doc.original_name);
  };

  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameDoc || !renameInput.trim()) return;
    try {
      setRenameLoading(true);
      await api.renameDocument(renameDoc.id, renameInput.trim());
      setRenameDoc(null);
      fetchDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to rename document');
    } finally {
      setRenameLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by name..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="indexing">Indexing</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
            <option value="md">Markdown</option>
            <option value="txt">Text</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="created_at">Date Uploaded</option>
            <option value="name">Document Name</option>
            <option value="file_size">File Size</option>
            <option value="status">Status</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenUpload}
            className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition active:scale-[0.98]"
          >
            Upload File
          </button>
        </div>
      </div>

      {/* Document Grid / Table */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-2xl skeleton-shimmer border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">No documents found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload your technical documents (PDF, Word, Markdown, or text) to start intelligent search and AI Q&A.
          </p>
          <button
            onClick={onOpenUpload}
            className="mt-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition"
          >
            Upload Document
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handleOpenDetail(doc)}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-600 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
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
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {doc.original_name}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="uppercase font-semibold text-brand-600 dark:text-brand-400">{doc.file_type}</span>
                  <span>•</span>
                  <span>{doc.page_count} pages</span>
                  <span>•</span>
                  <span>{doc.chunk_count} chunks</span>
                  <span>•</span>
                  <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                </div>
              </div>

              {doc.error_message && (
                <p className="text-[11px] text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2 rounded-lg line-clamp-2">
                  {doc.error_message}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAskDoc(doc.id);
                  }}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ask AI
                </button>

                <div className="flex items-center gap-1 text-slate-400">
                  {doc.status === 'failed' && (
                    <button
                      onClick={(e) => handleRetry(doc.id, e)}
                      title="Retry processing"
                      className="p-1.5 rounded-lg hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleOpenRename(doc, e)}
                    title="Rename document"
                    className="p-1.5 rounded-lg hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    title="Delete document"
                    className="p-1.5 rounded-lg hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Pages</th>
                <th className="py-3 px-4">Chunks</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => handleOpenDetail(doc)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition"
                >
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-500 flex-shrink-0" />
                    <span className="truncate max-w-xs">{doc.original_name}</span>
                  </td>
                  <td className="py-3 px-4 uppercase text-slate-500">{doc.file_type}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{doc.page_count}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{doc.chunk_count}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{(doc.file_size / 1024).toFixed(0)} KB</td>
                  <td className="py-3 px-4">
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
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAskDoc(doc.id);
                      }}
                      className="px-2 py-1 rounded bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 text-[11px] font-semibold hover:bg-brand-100 transition"
                    >
                      Ask AI
                    </button>
                    <button
                      onClick={(e) => handleOpenRename(doc, e)}
                      title="Rename document"
                      className="p-1 rounded text-slate-400 hover:text-brand-500 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(doc.id, e)}
                      className="p-1 rounded text-slate-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Document Detail & Extracted Text Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl h-[85vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-500" />
                  {selectedDoc.original_name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedDoc.page_count} Pages • {selectedDoc.chunk_count} Chunks • {(selectedDoc.file_size / 1024).toFixed(1)} KB • Ingested via SentenceTransformers & PyMuPDF
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const id = selectedDoc.id;
                    setSelectedDoc(null);
                    onAskDoc(id);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ask AI About This
                </button>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="px-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-6 text-xs font-semibold">
              <button
                onClick={() => setActiveModalTab('chunks')}
                className={`py-3 border-b-2 transition ${
                  activeModalTab === 'chunks'
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Structure-Aware Chunks ({selectedDoc.chunks?.length || 0})
              </button>
              <button
                onClick={() => setActiveModalTab('text')}
                className={`py-3 border-b-2 transition ${
                  activeModalTab === 'text'
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Raw Extracted Document Text
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {activeModalTab === 'chunks' ? (
                <div className="space-y-3">
                  {selectedDoc.chunks && selectedDoc.chunks.length > 0 ? (
                    selectedDoc.chunks.map((chunk) => (
                      <div
                        key={chunk.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          <span className="font-bold text-brand-600 dark:text-brand-400">
                            Chunk #{chunk.chunk_index + 1}
                          </span>
                          <span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-[10px]">
                            Page {chunk.page_number}
                          </span>
                          <span>~{chunk.token_count} tokens</span>
                        </div>
                        {chunk.section_heading && (
                          <p className="font-bold text-slate-800 dark:text-slate-100">
                            Heading: {chunk.section_heading}
                          </p>
                        )}
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-mono text-[11px] bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
                          {decodeHtmlEntities(chunk.text_content)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-8">No chunks recorded</p>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-full overflow-y-auto">
                  {decodeHtmlEntities(rawTextPreview) || 'Extracted content loading...'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rename Document Modal */}
      {renameDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-brand-500" />
                Rename Document
              </h3>
              <button
                onClick={() => setRenameDoc(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRename} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  placeholder="Enter new document title..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameDoc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renameLoading || !renameInput.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 disabled:opacity-50 transition flex items-center gap-2"
                >
                  {renameLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
