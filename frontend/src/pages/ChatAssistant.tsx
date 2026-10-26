import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  User,
  Plus,
  Trash2,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Sparkles,
  FileText,
  Bookmark,
  ChevronRight,
  ExternalLink,
  Layers,
  Search,
  Loader2,
  SlidersHorizontal,
  Info,
  CheckCircle2
} from 'lucide-react';
import {
  api,
  ConversationItem,
  ConversationDetail,
  MessageItem,
  CitationItem,
  DocumentItem,
  CollectionItem
} from '../api/client';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { SourceCitationsView } from '../components/SourceCitationsView';
import { decodeHtmlEntities, stripLegacyVerifiedSection } from '../utils/textFormatter';

interface ChatAssistantProps {
  initialConversationId?: string | null;
  initialDocumentId?: string | null;
  documents: DocumentItem[];
  collections: CollectionItem[];
}

const EXAMPLE_QUESTIONS = [
  "Explain the architecture described in this document.",
  "What are the installation and setup requirements?",
  "Summarize the main technical components and data flow.",
  "Find the API configuration steps and endpoints.",
  "What errors and troubleshooting steps are documented?"
];

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  initialConversationId,
  initialDocumentId,
  documents,
  collections,
}) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [currentConv, setCurrentConv] = useState<ConversationDetail | null>(null);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(initialDocumentId ? [initialDocumentId] : []);
  const [selectedCitation, setSelectedCitation] = useState<CitationItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFeedback, setActiveFeedback] = useState<Record<string, number>>({});
  const [showDocSelector, setShowDocSelector] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations list
  const loadConversations = async (autoSelectId?: string) => {
    try {
      const list = await api.getConversations();
      setConversations(list);
      const targetId = autoSelectId || initialConversationId || (list.length > 0 ? list[0].id : null);
      if (targetId) {
        selectConversation(targetId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [initialConversationId]);

  useEffect(() => {
    if (initialDocumentId && !selectedDocIds.includes(initialDocumentId)) {
      setSelectedDocIds([initialDocumentId]);
    }
  }, [initialDocumentId]);

  const selectConversation = async (id: string) => {
    try {
      const detail = await api.getConversation(id);
      setCurrentConv(detail);
      setSelectedDocIds(detail.document_ids || []);
      // Auto-select latest message citation if present
      const lastMsg = detail.messages[detail.messages.length - 1];
      if (lastMsg && lastMsg.citations && lastMsg.citations.length > 0) {
        setSelectedCitation(lastMsg.citations[0]);
      } else {
        setSelectedCitation(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await api.createConversation("New Technical Discussion", selectedDocIds);
      await loadConversations(newConv.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      try {
        await api.deleteConversation(id);
        const remaining = conversations.filter((c) => c.id !== id);
        setConversations(remaining);
        if (currentConv?.id === id) {
          if (remaining.length > 0) {
            selectConversation(remaining[0].id);
          } else {
            setCurrentConv(null);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSend = async (questionToSend?: string) => {
    const q = (questionToSend || inputQuestion).trim();
    if (!q || isGenerating) return;

    setInputQuestion('');
    setIsGenerating(true);

    // Optimistic user message insertion
    const tempUserMsg: MessageItem = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: q,
      model_used: 'client',
      latency_ms: 0,
      created_at: new Date().toISOString(),
      citations: [],
    };

    if (currentConv) {
      setCurrentConv({
        ...currentConv,
        messages: [...currentConv.messages, tempUserMsg],
      });
    }

    try {
      const assistantMsg = await api.askQuestion({
        conversation_id: currentConv?.id,
        question: q,
        document_ids: selectedDocIds.length > 0 ? selectedDocIds : undefined,
      });

      if (currentConv) {
        // Refresh full conversation detail to get accurate DB IDs
        const updated = await api.getConversation(currentConv.id);
        setCurrentConv(updated);
        if (assistantMsg.citations && assistantMsg.citations.length > 0) {
          setSelectedCitation(assistantMsg.citations[0]);
        }
      } else {
        await loadConversations();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate response');
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = async (messageId: string, rating: number) => {
    try {
      await api.sendFeedback(messageId, rating);
      setActiveFeedback((prev) => ({ ...prev, [messageId]: rating }));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleDocSelection = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* 1. Left Panel: Conversation History */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Recent Conversations
          </p>
          {conversations.map((conv) => {
            const isActive = currentConv?.id === conv.id;
            return (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`group px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition flex items-center justify-between ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Bot className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Center Panel: Chat Interface */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
        {/* Context Bar: Selected Document Pills */}
        <div className="px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 overflow-x-auto min-w-0">
            <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1 flex-shrink-0">
              <FileText className="w-3.5 h-3.5 text-brand-500" />
              Grounded Context:
            </span>
            {selectedDocIds.length === 0 ? (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px]">
                All Indexed Documents ({documents.length})
              </span>
            ) : (
              selectedDocIds.map((id) => {
                const doc = documents.find((d) => d.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 text-[11px] font-medium"
                  >
                    <span className="truncate max-w-[120px]">{doc ? doc.original_name : id}</span>
                    <button
                      onClick={() => toggleDocSelection(id)}
                      className="hover:text-red-500 ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                );
              })
            )}
          </div>

          <button
            onClick={() => setShowDocSelector(!showDocSelector)}
            className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-semibold flex-shrink-0 ml-3"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter Sources ({selectedDocIds.length || 'All'})</span>
          </button>
        </div>

        {/* Dropdown for selecting specific documents */}
        {showDocSelector && (
          <div className="px-6 py-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs flex flex-wrap gap-2 items-center animate-in slide-in-from-top-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Target specific files:</span>
            {documents.map((d) => {
              const isSelected = selectedDocIds.includes(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => toggleDocSelection(d.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-400'
                  }`}
                >
                  {d.original_name}
                </button>
              );
            })}
            {selectedDocIds.length > 0 && (
              <button
                onClick={() => setSelectedDocIds([])}
                className="text-xs text-slate-500 underline ml-2"
              >
                Clear filter
              </button>
            )}
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {(!currentConv || currentConv.messages.length === 0) ? (
            <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-400 text-white flex items-center justify-center mx-auto shadow-glow">
                <Bot className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Technical Document Intelligence Assistant
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Ask deep architectural questions, verify installation steps, and inspect citations verified directly from your ingested documents.
                </p>
              </div>

              {/* Example Question Chips */}
              <div className="space-y-2 text-left">
                <p className="text-xs font-semibold text-slate-400 text-center uppercase tracking-wider">
                  Suggested Technical Inquiries
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {EXAMPLE_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-400 hover:shadow-sm text-xs font-medium text-slate-700 dark:text-slate-300 transition flex items-center justify-between group"
                    >
                      <span>{q}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            currentConv.messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto' : 'mr-auto'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-brand-600 text-white rounded-tr-sm shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-tl-sm shadow-sm'
                      }`}
                    >
                      {isUser ? (
                        <div className="whitespace-pre-wrap font-sans text-xs">
                          {decodeHtmlEntities(msg.content)}
                        </div>
                      ) : (
                        <div className="font-sans text-xs">
                          <MarkdownRenderer
                            content={
                              msg.citations && msg.citations.length > 0
                                ? stripLegacyVerifiedSection(msg.content)
                                : msg.content
                            }
                            onCitationClick={(citNum) => {
                              const cit =
                                msg.citations.find((c) => c.rank_order === citNum) ||
                                msg.citations[citNum - 1];
                              if (cit) setSelectedCitation(cit);
                            }}
                          />

                          {/* Structured Source Cards & Verified Source Evidence */}
                          {msg.citations && msg.citations.length > 0 && (
                            <SourceCitationsView
                              citations={msg.citations}
                              selectedCitationId={selectedCitation?.id}
                              onSelectCitation={(cit) => setSelectedCitation(cit)}
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Metadata & Actions for Assistant */}
                    {!isUser && (
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 px-1">
                        <span>{msg.model_used}</span>
                        <span>•</span>
                        <span>{msg.latency_ms}ms</span>
                        <span>•</span>

                        {/* Citations Badges */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-brand-600 dark:text-brand-400">Sources:</span>
                            {msg.citations.map((c, i) => (
                              <button
                                key={c.id || i}
                                onClick={() => setSelectedCitation(c)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                                  selectedCitation?.id === c.id
                                    ? 'bg-brand-600 text-white border-brand-600'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-400'
                                }`}
                              >
                                [{c.rank_order}]
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            onClick={() => handleCopy(msg.content, msg.id)}
                            title="Copy answer"
                            className="p-1 hover:text-slate-600 dark:hover:text-slate-200 transition"
                          >
                            {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, 1)}
                            className={`p-1 transition ${
                              (activeFeedback[msg.id] === 1 || msg.feedback === 1)
                                ? 'text-emerald-500'
                                : 'hover:text-emerald-500'
                            }`}
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, -1)}
                            className={`p-1 transition ${
                              (activeFeedback[msg.id] === -1 || msg.feedback === -1)
                                ? 'text-red-500'
                                : 'hover:text-red-500'
                            }`}
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1 text-xs font-bold">
                      AM
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isGenerating && (
            <div className="flex gap-3 max-w-3xl mr-auto animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                <span>Retrieving evidence and synthesizing grounded response...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Question Input Box */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 max-w-4xl mx-auto"
          >
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Ask a technical question about your uploaded documents..."
              disabled={isGenerating}
              className="flex-1 px-4 py-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900 transition"
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || isGenerating}
              className="px-4 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition active:scale-[0.98] flex items-center gap-1.5"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            Answers are strictly grounded in retrieved evidence chunks. Source citations are verified against stored documents.
          </p>
        </div>
      </div>

      {/* 3. Right Panel: Grounded Source Citation Inspector */}
      <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col flex-shrink-0 h-full overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Bookmark className="w-4 h-4 text-brand-500" />
            Verified Source Citation
          </h3>
          {selectedCitation && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              Source [{selectedCitation.rank_order}]
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {selectedCitation ? (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Document</span>
                  <span className="bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-400 font-bold px-1.5 py-0.5 rounded text-[10px]">
                    Page {selectedCitation.page_number}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white truncate">
                  {selectedCitation.document_title}
                </h4>
                {selectedCitation.section_heading && (
                  <p className="text-[11px] text-slate-500 font-medium">
                    Section: <span className="text-slate-700 dark:text-slate-300 font-bold">{selectedCitation.section_heading}</span>
                  </p>
                )}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400">
                  <span>Relevance Score:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {(selectedCitation.score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">
                  Grounded Passage Excerpt
                </h5>
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-mono leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap shadow-inner">
                  {decodeHtmlEntities(selectedCitation.excerpt)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                <span>
                  This citation corresponds to verified chunk #{selectedCitation.chunk_id?.slice(0, 8)} stored in the vector database.
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <Info className="w-8 h-8 mx-auto opacity-50" />
              <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">No source selected</p>
              <p className="text-[11px]">Click on any [1], [2] citation badge in the answer to inspect its evidence and page location.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
