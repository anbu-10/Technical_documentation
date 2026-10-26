import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Folder } from 'lucide-react';
import { api, CollectionItem, DocumentItem } from '../api/client';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDoc: DocumentItem) => void;
  collections: CollectionItem[];
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  collections,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>('idle'); // idle, uploading, parsing, chunking, indexing, done
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setErrorMsg(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMsg(null);
    setUploadStep('uploading');

    try {
      // Simulate visual pipeline progression steps for real feel while request completes
      const stepTimer1 = setTimeout(() => setUploadStep('parsing'), 500);
      const stepTimer2 = setTimeout(() => setUploadStep('chunking'), 1200);
      const stepTimer3 = setTimeout(() => setUploadStep('indexing'), 2000);

      const doc = await api.uploadDocument(selectedFile, selectedCollection || undefined);

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      setUploadStep('done');
      setTimeout(() => {
        onSuccess(doc);
        onClose();
        reset();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload and indexing failed');
      setUploadStep('idle');
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setSelectedCollection('');
    setErrorMsg(null);
    setUploadStep('idle');
    setIsUploading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Upload Technical Document</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">PDF, DOCX, Markdown, or TXT files (Max 25MB)</p>
          </div>
          <button
            onClick={() => { reset(); onClose(); }}
            disabled={isUploading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
              {selectedFile ? selectedFile.name : 'Click to browse or drag and drop'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedFile
                ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for ingestion`
                : 'Supports PDF, Word (.docx), Markdown (.md), and Text (.txt)'}
            </p>
          </div>

          {/* Collection Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-brand-500" />
              Assign to Collection (Optional)
            </label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              disabled={isUploading}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="">None (Uncategorized)</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Pipeline Progress Status */}
          {isUploading && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-200">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-brand-500 animate-spin" />
                  Processing Ingestion Pipeline...
                </span>
                <span className="text-brand-600 dark:text-brand-400 uppercase text-[10px]">
                  {uploadStep}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-medium">
                <span className={uploadStep !== 'idle' ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-400'}>1. Upload</span>
                <span className={['parsing', 'chunking', 'indexing', 'done'].includes(uploadStep) ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-400'}>2. Parse</span>
                <span className={['chunking', 'indexing', 'done'].includes(uploadStep) ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-400'}>3. Chunk</span>
                <span className={['indexing', 'done'].includes(uploadStep) ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-400'}>4. Embed</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-brand-500 h-full transition-all duration-300"
                  style={{
                    width:
                      uploadStep === 'uploading' ? '25%' :
                      uploadStep === 'parsing' ? '50%' :
                      uploadStep === 'chunking' ? '75%' :
                      uploadStep === 'indexing' ? '90%' :
                      uploadStep === 'done' ? '100%' : '10%'
                  }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
          <button
            onClick={() => { reset(); onClose(); }}
            disabled={isUploading}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white shadow-sm transition flex items-center gap-1.5"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Start Ingestion</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
