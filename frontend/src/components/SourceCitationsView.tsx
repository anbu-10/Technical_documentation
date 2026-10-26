import React from 'react';
import { CitationItem } from '../api/client';
import { ShieldCheck, FileText, ChevronRight, Sparkles } from 'lucide-react';

interface SourceCitationsViewProps {
  citations: CitationItem[];
  selectedCitationId?: string | null;
  onSelectCitation: (citation: CitationItem) => void;
}

export const SourceCitationsView: React.FC<SourceCitationsViewProps> = ({
  citations,
  selectedCitationId,
  onSelectCitation,
}) => {
  if (!citations || citations.length === 0) return null;

  const passageCount = citations.length;
  const passageLabel = passageCount === 1 ? '1 primary passage' : `${passageCount} primary passages`;

  return (
    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
      {/* 1. Verified Source Evidence Section */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            Verified Source Evidence
          </h4>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
          The above findings are grounded in {passageLabel} retrieved via hybrid vector and keyword matching.
          Select any source card below to inspect the verified passage and document coordinates.
        </p>
      </div>

      {/* 2. Structured Source Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {citations.map((cit) => {
          const isSelected = selectedCitationId === cit.id;
          const sectionTitle = cit.section_heading || `Section on Page ${cit.page_number}`;

          return (
            <div
              key={cit.id || cit.rank_order}
              onClick={() => onSelectCitation(cit)}
              className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-500 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {sectionTitle}
                  </h5>
                  <span className="flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                    [{cit.rank_order}]
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                  <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{cit.document_title}</span>
                  <span>·</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 flex-shrink-0">
                    Page {cit.page_number}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span className="text-slate-500">
                  Citation number: <strong className="text-brand-600 dark:text-brand-400 font-bold">[{cit.rank_order}]</strong>
                </span>
                <span className="flex items-center gap-0.5 text-brand-600 dark:text-brand-400 font-medium">
                  <span>Inspect</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
