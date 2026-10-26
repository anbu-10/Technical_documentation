import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { UploadModal } from './components/UploadModal';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { VerifyEmail } from './pages/auth/VerifyEmail';

// Protected Pages
import { Overview } from './pages/Overview';
import { Documents } from './pages/Documents';
import { ChatAssistant } from './pages/ChatAssistant';
import { IntelligentSearch } from './pages/IntelligentSearch';
import { Collections } from './pages/Collections';
import { Analytics } from './pages/Analytics';
import { Evaluation } from './pages/Evaluation';
import { SettingsPage } from './pages/Settings';
import { Profile } from './pages/Profile';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminDocuments } from './pages/admin/AdminDocuments';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';

// Error Pages
import { Forbidden403 } from './pages/errors/Forbidden403';
import { NotFound404 } from './pages/errors/NotFound404';

import { api, DocumentItem, CollectionItem, ProviderInfo } from './api/client';
import { Loader2 } from 'lucide-react';

// Route Guards
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-3" />
        <p className="text-sm text-slate-400 font-mono">Authenticating session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-3" />
        <p className="text-sm text-slate-400 font-mono">Verifying administrative credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main App Layout for Protected and Admin pages
const AppWorkspaceLayout: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [activeProvider, setActiveProvider] = useState<string>('local');
  const navigate = useNavigate();
  const location = useLocation();

  const loadGlobalData = async () => {
    try {
      const [docs, colls, settings] = await Promise.all([
        api.getDocuments().catch(() => []),
        api.getCollections().catch(() => []),
        api.getSettings().catch(() => null),
      ]);
      setDocuments(docs);
      setCollections(colls);
      if (settings) {
        setProviders(settings.providers);
        setActiveProvider(settings.active_provider);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadGlobalData();
  }, [location.pathname]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleUploadSuccess = (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev]);
    setIsUploadOpen(false);
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <Sidebar
        isDark={isDark}
        onToggleTheme={toggleTheme}
        activeProvider={activeProvider}
        providers={providers}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          onOpenUpload={() => setIsUploadOpen(true)}
          onQuickSearch={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)}
        />

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route
              path="/dashboard"
              element={
                <Overview
                  onSelectTab={(tab) => navigate(`/${tab === 'overview' ? 'dashboard' : tab}`)}
                  onOpenUpload={() => setIsUploadOpen(true)}
                  onOpenDoc={(doc) => navigate(`/chat?doc=${doc.id}`)}
                  onSelectConversation={(convId) => navigate(`/chat/${convId}`)}
                />
              }
            />

            <Route
              path="/documents"
              element={
                <Documents
                  onOpenUpload={() => setIsUploadOpen(true)}
                  onAskDoc={(docId) => navigate(`/chat?doc=${docId}`)}
                  collections={collections}
                />
              }
            />

            <Route
              path="/documents/:id"
              element={
                <Documents
                  onOpenUpload={() => setIsUploadOpen(true)}
                  onAskDoc={(docId) => navigate(`/chat?doc=${docId}`)}
                  collections={collections}
                />
              }
            />

            <Route
              path="/chat"
              element={
                <ChatWorkspaceWrapper
                  documents={documents}
                  collections={collections}
                />
              }
            />

            <Route
              path="/chat/:id"
              element={
                <ChatWorkspaceWrapper
                  documents={documents}
                  collections={collections}
                />
              }
            />

            <Route
              path="/search"
              element={
                <SearchWorkspaceWrapper
                  collections={collections}
                  documents={documents}
                />
              }
            />

            <Route
              path="/collections"
              element={
                <Collections
                  documents={documents}
                  onRefreshDocs={loadGlobalData}
                  onAskDoc={(docId) => navigate(`/chat?doc=${docId}`)}
                />
              }
            />

            <Route path="/analytics" element={<Analytics />} />
            <Route path="/evaluation" element={<Evaluation />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<Profile />} />

            {/* Admin Subroutes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/documents"
              element={
                <AdminRoute>
                  <AdminDocuments />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <AdminAnalytics />
                </AdminRoute>
              }
            />
            <Route path="*" element={<NotFound404 />} />
          </Routes>
        </main>
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
        collections={collections}
      />
    </div>
  );
};

// Route Helpers for Chat and Search query params
const ChatWorkspaceWrapper: React.FC<{ documents: DocumentItem[]; collections: CollectionItem[] }> = ({
  documents,
  collections,
}) => {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const docParam = searchParams.get('doc');

  return (
    <ChatAssistant
      initialConversationId={id || null}
      initialDocumentId={docParam || null}
      documents={documents}
      collections={collections}
    />
  );
};

const SearchWorkspaceWrapper: React.FC<{ documents: DocumentItem[]; collections: CollectionItem[] }> = ({
  documents,
  collections,
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  return (
    <IntelligentSearch
      initialQuery={query}
      onAskAIWithQuery={(text) => {
        navigate(`/chat?query=${encodeURIComponent(text)}`);
      }}
      collections={collections}
      documents={documents}
    />
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Auth Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Dedicated Error Pages */}
          <Route path="/403" element={<Forbidden403 />} />

          {/* Protected Application Workspace */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppWorkspaceLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
