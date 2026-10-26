import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { cleanMarkdownFormatting } from '../utils/textFormatter';

interface MarkdownRendererProps {
  content: string;
  onCitationClick?: (citationNum: number) => void;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onCitationClick,
  className = '',
}) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const cleanedContent = cleanMarkdownFormatting(content);

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Helper to turn inline [1], [2] citation markers into interactive buttons
  const renderTextWithCitations = (children: React.ReactNode): React.ReactNode => {
    if (typeof children !== 'string') {
      if (Array.isArray(children)) {
        return children.map((child, idx) => (
          <React.Fragment key={idx}>{renderTextWithCitations(child)}</React.Fragment>
        ));
      }
      return children;
    }

    const parts = children.split(/(\[\d+\])/g);
    if (parts.length === 1) return children;

    return parts.map((part, index) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return (
          <button
            key={index}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onCitationClick) onCitationClick(num);
            }}
            className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 rounded text-[10px] font-bold bg-brand-100 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-300 dark:border-brand-700/60 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-500 transition cursor-pointer select-none align-baseline shadow-xs"
            title={`View Source Citation [${num}]`}
          >
            [{num}]
          </button>
        );
      }
      return part;
    });
  };

  return (
    <div className={`prose dark:prose-invert max-w-none text-xs leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ node, ...props }) => (
            <h1 className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2 first:mt-0 flex items-center gap-1.5">
              {renderTextWithCitations(props.children)}
            </h1>
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-3.5 mb-1.5 border-b border-slate-200 dark:border-slate-800 pb-1 first:mt-0">
              {renderTextWithCitations(props.children)}
            </h2>
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1 first:mt-0">
              {renderTextWithCitations(props.children)}
            </h3>
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-2.5 mb-1">
              {renderTextWithCitations(props.children)}
            </h4>
          ),
          h5: ({ node, ...props }) => (
            <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2 mb-1">
              {renderTextWithCitations(props.children)}
            </h5>
          ),
          h6: ({ node, ...props }) => (
            <h6 className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-2 mb-0.5">
              {renderTextWithCitations(props.children)}
            </h6>
          ),

          // Paragraphs
          p: ({ node, ...props }) => (
            <p className="mb-2.5 leading-relaxed text-slate-800 dark:text-slate-200 last:mb-0">
              {renderTextWithCitations(props.children)}
            </p>
          ),

          // Lists
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-5 my-2 space-y-1 text-slate-800 dark:text-slate-200">
              {props.children}
            </ul>
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1 text-slate-800 dark:text-slate-200">
              {props.children}
            </ol>
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed">
              {renderTextWithCitations(props.children)}
            </li>
          ),

          // Bold & Italic
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-slate-900 dark:text-white">
              {renderTextWithCitations(props.children)}
            </strong>
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-slate-700 dark:text-slate-300">
              {renderTextWithCitations(props.children)}
            </em>
          ),

          // Blockquote
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-brand-500 pl-3 my-2.5 italic text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 py-1 rounded-r-lg">
              {props.children}
            </blockquote>
          ),

          // Links
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 dark:text-brand-400 font-semibold underline underline-offset-2 hover:text-brand-700 dark:hover:text-brand-300 inline-flex items-center gap-0.5"
            >
              <span>{props.children}</span>
              <ExternalLink className="w-3 h-3 inline" />
            </a>
          ),

          // Tables
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {props.children}
              </table>
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold">
              {props.children}
            </thead>
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/40">
              {props.children}
            </tbody>
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
              {props.children}
            </tr>
          ),
          th: ({ node, ...props }) => (
            <th className="px-3 py-2 text-left text-xs font-semibold">
              {props.children}
            </th>
          ),
          td: ({ node, ...props }) => (
            <td className="px-3 py-2 text-slate-700 dark:text-slate-300 text-xs">
              {renderTextWithCitations(props.children)}
            </td>
          ),

          // Code
          code: ({ node, className: codeClassName, children, ...props }: any) => {
            const isInline = !codeClassName && typeof children === 'string' && !children.includes('\n');
            const codeString = String(children).replace(/\n$/, '');

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-semibold border border-slate-200 dark:border-slate-700"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const match = /language-(\w+)/.exec(codeClassName || '');
            const language = match ? match[1] : '';

            return (
              <div className="my-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 overflow-hidden shadow-sm">
                <div className="px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{language || 'code'}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(codeString, 0)}
                    className="flex items-center gap-1 hover:text-white transition"
                    title="Copy code"
                  >
                    {copiedCodeIndex === 0 ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 overflow-x-auto text-[11px] font-mono leading-relaxed bg-slate-950">
                  <code>{codeString}</code>
                </pre>
              </div>
            );
          },
        }}
      >
        {cleanedContent}
      </ReactMarkdown>
    </div>
  );
};
