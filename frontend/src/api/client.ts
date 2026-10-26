const API_BASE = "http://localhost:8000/api";

export interface UserDetail {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
  theme: string;
  preferred_provider: string;
  notification_preferences: {
    email_notifications?: boolean;
    security_alerts?: boolean;
    [key: string]: any;
  };
  created_at: string;
  updated_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserDetail;
}

export interface DocumentItem {
  id: string;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  page_count: number;
  chunk_count: number;
  status: 'uploaded' | 'parsing' | 'chunking' | 'indexing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  chunk_index: number;
  page_number: number;
  section_heading: string;
  text_content: string;
  token_count: number;
}

export interface DocumentDetail extends DocumentItem {
  metadata: Record<string, any>;
  chunks: DocumentChunk[];
}

export interface CollectionItem {
  id: string;
  name: string;
  description: string;
  color: string;
  document_count: number;
  created_at: string;
}

export interface CitationItem {
  id: string;
  chunk_id?: string;
  document_id: string;
  document_title: string;
  page_number: number;
  section_heading: string;
  excerpt: string;
  score: number;
  rank_order: number;
}

export interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model_used: string;
  latency_ms: number;
  created_at: string;
  citations: CitationItem[];
  feedback?: number | null;
}

export interface ConversationItem {
  id: string;
  title: string;
  collection_id?: string;
  document_ids: string[];
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends ConversationItem {
  messages: MessageItem[];
}

export interface SearchResultItem {
  chunk_id: string;
  document_id: string;
  document_title: string;
  page_number: number;
  section_heading: string;
  text_content: string;
  highlighted_text?: string;
  score: number;
  retrieval_method: string;
  vector_score?: number;
  bm25_score?: number;
}

export interface SearchResponse {
  query: string;
  mode: string;
  total_results: number;
  latency_ms: number;
  results: SearchResultItem[];
}

export interface AnalyticsSummary {
  total_documents: number;
  processed_documents: number;
  failed_documents: number;
  total_chunks: number;
  total_questions: number;
  average_latency_ms: number;
  positive_feedback_count: number;
  negative_feedback_count: number;
  search_success_rate: number;
  recent_documents: DocumentItem[];
  recent_conversations: ConversationItem[];
  processing_chart: { name: string; value: number; color: string }[];
  query_chart: { mode: string; queries: number }[];
}

export interface BenchmarkMetrics {
  total_benchmark_queries: number;
  mrr: number;
  ndcg_at_5: number;
  recall_at_3: number;
  recall_at_5: number;
  precision_at_1: number;
  average_latency_ms: number;
  retrieval_hit_rate: number;
}

export interface BenchmarkResultItem {
  query: string;
  category: string;
  retrieved_top_docs: string[];
  hit: boolean;
  reciprocal_rank: number;
  ndcg: number;
  latency_ms: number;
  answer_preview?: string;
}

export interface EvaluationReport {
  pipeline_mode: string;
  metrics: BenchmarkMetrics;
  detailed_results: BenchmarkResultItem[];
  evaluated_at: string;
}

export interface ProviderInfo {
  name: string;
  display_name: string;
  status: 'connected' | 'disconnected' | 'not_configured';
  details: string;
  model: string;
  is_default: boolean;
}

export interface SettingsData {
  app_name: string;
  app_version: string;
  active_provider: string;
  providers: ProviderInfo[];
  embedding_model: string;
  chunk_size: number;
  chunk_overlap: number;
  top_k: number;
  dense_weight: number;
  sparse_weight: number;
  enable_reranker: boolean;
  database_type: string;
}

export interface AdminOverview {
  total_users: number;
  active_users: number;
  admin_users: number;
  total_documents: number;
  completed_documents: number;
  failed_documents: number;
  total_chunks: number;
  total_conversations: number;
  total_queries: number;
  total_audit_events: number;
  average_latency_ms: number;
}

export interface AdminUserItem {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  document_count: number;
  created_at: string;
}

export interface AdminDocumentItem {
  id: string;
  original_name: string;
  file_type: string;
  file_size: number;
  page_count: number;
  chunk_count: number;
  status: string;
  error_message?: string;
  owner_email: string;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  user_id?: string;
  user_email: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  status: string;
  details: Record<string, any>;
  created_at: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("techdoc_token");
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Authentication & Profile
  async register(payload: { email: string; full_name: string; password: string; confirm_password: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Registration failed" }));
      throw new Error(err.detail || "Registration failed");
    }
    return res.json();
  },

  async login(payload: { email: string; password: string; remember_me?: boolean }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Login failed");
    }
    return res.json();
  },

  async getMe(): Promise<UserDetail> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
  },

  async updateProfile(payload: { full_name?: string; avatar_url?: string; theme?: string; preferred_provider?: string; notification_preferences?: any }): Promise<UserDetail> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Update failed" }));
      throw new Error(err.detail || "Update failed");
    }
    return res.json();
  },

  async changePassword(payload: { current_password: string; new_password: string; confirm_password: string }): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Password change failed" }));
      throw new Error(err.detail || "Password change failed");
    }
  },

  async forgotPassword(email: string): Promise<{ message: string; reset_token_dev?: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || "Request failed");
    }
    return res.json();
  },

  async resetPassword(payload: { token: string; new_password: string; confirm_password: string }): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Reset failed" }));
      throw new Error(err.detail || "Reset failed");
    }
  },

  async verifyEmail(token: string): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Verification failed" }));
      throw new Error(err.detail || "Verification failed");
    }
  },

  async deleteAccount(): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/account`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete account");
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
    } catch {}
    localStorage.removeItem("techdoc_token");
  },

  // Documents
  async getDocuments(params?: { search?: string; status?: string; file_type?: string; sort_by?: string; order?: string }): Promise<DocumentItem[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/documents${query ? '?' + query : ''}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch documents");
    return res.json();
  },

  async getDocument(id: string): Promise<DocumentDetail> {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch document");
    return res.json();
  },

  async renameDocument(id: string, original_name: string): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/${id}/rename`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ original_name }),
    });
    if (!res.ok) throw new Error("Failed to rename document");
    return res.json();
  },

  async getDocumentPreview(id: string): Promise<{ document_id: string; title: string; page_count: number; preview_text: string }> {
    const res = await fetch(`${API_BASE}/documents/${id}/preview`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch document preview");
    return res.json();
  },

  async uploadDocument(file: File, collectionId?: string): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append("file", file);
    if (collectionId) formData.append("collection_id", collectionId);
    
    const token = localStorage.getItem("techdoc_token");
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Upload failed");
    }
    return res.json();
  },

  async retryDocument(id: string): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/${id}/retry`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to retry document processing");
    return res.json();
  },

  async deleteDocument(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete document");
  },

  // Collections
  async getCollections(): Promise<CollectionItem[]> {
    const res = await fetch(`${API_BASE}/collections`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch collections");
    return res.json();
  },

  async createCollection(name: string, description?: string): Promise<CollectionItem> {
    const res = await fetch(`${API_BASE}/collections`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) throw new Error("Failed to create collection");
    return res.json();
  },

  async deleteCollection(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/collections/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete collection");
  },

  // Chat
  async getConversations(): Promise<ConversationItem[]> {
    const res = await fetch(`${API_BASE}/chat/conversations`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch conversations");
    return res.json();
  },

  async getConversation(id: string): Promise<ConversationDetail> {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch conversation");
    return res.json();
  },

  async createConversation(title?: string, document_ids?: string[], collection_id?: string): Promise<ConversationItem> {
    const res = await fetch(`${API_BASE}/chat/conversations`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, document_ids: document_ids || [], collection_id }),
    });
    if (!res.ok) throw new Error("Failed to create conversation");
    return res.json();
  },

  async updateConversation(id: string, title: string): Promise<ConversationItem> {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error("Failed to update conversation");
    return res.json();
  },

  async deleteConversation(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete conversation");
  },

  async askQuestion(payload: {
    conversation_id?: string;
    question: string;
    document_ids?: string[];
    collection_id?: string;
    provider?: string;
    top_k?: number;
  }): Promise<MessageItem> {
    const res = await fetch(`${API_BASE}/chat/ask`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to generate answer" }));
      throw new Error(err.detail || "Failed to generate answer");
    }
    return res.json();
  },

  async sendFeedback(messageId: string, rating: number, comment?: string): Promise<void> {
    await fetch(`${API_BASE}/chat/messages/${messageId}/feedback`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ rating, comment }),
    });
  },

  // Search
  async search(payload: {
    query: string;
    mode?: string;
    collection_id?: string;
    document_ids?: string[];
    limit?: number;
  }): Promise<SearchResponse> {
    const res = await fetch(`${API_BASE}/search`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Search failed");
    return res.json();
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsSummary> {
    const res = await fetch(`${API_BASE}/analytics`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch analytics");
    return res.json();
  },

  // Evaluation
  async runEvaluation(pipelineMode: string = "hybrid"): Promise<EvaluationReport> {
    const res = await fetch(`${API_BASE}/evaluation/run?pipeline_mode=${pipelineMode}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to run evaluation benchmark");
    return res.json();
  },

  // Settings
  async getSettings(): Promise<SettingsData> {
    const res = await fetch(`${API_BASE}/settings`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch settings");
    return res.json();
  },

  async updateSettings(data: Partial<SettingsData>): Promise<SettingsData> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update settings");
    return res.json();
  },

  // Admin
  async getAdminOverview(): Promise<AdminOverview> {
    const res = await fetch(`${API_BASE}/admin/overview`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (res.status === 403) throw new Error("FORBIDDEN");
      throw new Error("Failed to fetch admin overview");
    }
    return res.json();
  },

  async getAdminUsers(search?: string): Promise<AdminUserItem[]> {
    const res = await fetch(`${API_BASE}/admin/users${search ? '?search=' + encodeURIComponent(search) : ''}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch admin users");
    return res.json();
  },

  async updateAdminUserStatus(userId: string, data: { is_active?: boolean; role?: string }): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to update user" }));
      throw new Error(err.detail || "Failed to update user");
    }
  },

  async getAdminDocuments(statusFilter?: string): Promise<AdminDocumentItem[]> {
    const res = await fetch(`${API_BASE}/admin/documents${statusFilter ? '?status_filter=' + statusFilter : ''}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch admin documents");
    return res.json();
  },

  async adminRetryDocument(docId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/documents/${docId}/retry`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to retry document");
  },

  async getAdminAuditLogs(): Promise<AuditLogItem[]> {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch audit logs");
    return res.json();
  },
};
