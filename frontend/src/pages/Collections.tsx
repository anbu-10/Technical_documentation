import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Trash2,
  Folder,
  FileText,
  Layers,
  ArrowRight,
  X
} from 'lucide-react';
import { api, CollectionItem, DocumentItem } from '../api/client';

interface CollectionsProps {
  documents: DocumentItem[];
  onRefreshDocs: () => void;
  onAskDoc: (docId: string) => void;
}

export const Collections: React.FC<CollectionsProps> = ({
  documents,
  onRefreshDocs,
  onAskDoc,
}) => {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCollName, setNewCollName] = useState('');
  const [newCollDesc, setNewCollDesc] = useState('');

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const list = await api.getCollections();
      setCollections(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollName.trim()) return;
    try {
      await api.createCollection(newCollName, newCollDesc);
      setNewCollName('');
      setNewCollDesc('');
      setIsCreating(false);
      fetchCollections();
    } catch (e: any) {
      alert(e.message || 'Failed to create collection');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this collection? Contained documents will NOT be deleted.')) {
      try {
        await api.deleteCollection(id);
        fetchCollections();
      } catch (e: any) {
        alert(e.message || 'Failed to delete collection');
      }
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-brand-600" />
            Document Collections
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Isolate technical documentation into projects, systems, or organizational namespaces.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Creation Modal / Inline Drawer */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 shadow-md space-y-4 animate-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Create New Collection</h4>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Collection Name
              </label>
              <input
                type="text"
                required
                value={newCollName}
                onChange={(e) => setNewCollName(e.target.value)}
                placeholder="e.g., Microservices Core Architecture"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                value={newCollDesc}
                onChange={(e) => setNewCollDesc(e.target.value)}
                placeholder="e.g., Ingress specs, Kubernetes manifests, and security protocols"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm"
            >
              Save Collection
            </button>
          </div>
        </form>
      )}

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((coll) => (
          <div
            key={coll.id}
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 group"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Folder className="w-5 h-5" />
              </div>
              <button
                onClick={() => handleDelete(coll.id)}
                title="Delete collection safely"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {coll.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                {coll.description || 'No description provided.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                {coll.document_count} Documents
              </span>
              <span className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold">
                Active Namespace
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
