/* ── App Shell — Sidebar navigation + page routing ── */

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Smartphone,
  ScrollText,
  SlidersHorizontal,
  Zap,
  Heart,
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AuditPage from './pages/AuditPage';
import { PolicyStudioPage } from './pages/PolicyStudioPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { useAgentStatus } from './api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 2000,
    },
  },
});

type Page = 'dashboard' | 'simulator' | 'policy' | 'audit';

function AgentIndicator() {
  const { data } = useAgentStatus();
  const isRunning = Boolean(data?.is_running || (data?.queue_size && data.queue_size > 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ position: 'relative', display: 'flex', width: 8, height: 8 }}>
          {isRunning ? (
            <>
              <span
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  opacity: 0.75,
                  animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                }}
              />
              <span
                style={{
                  position: 'relative',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                }}
              />
            </>
          ) : (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#566782',
              }}
            />
          )}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            color: isRunning ? '#10B981' : 'var(--text-secondary)',
          }}
        >
          {isRunning ? 'Agent Active' : 'Agent Standby'}
        </span>
      </div>

      {isRunning ? (
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#38BDF8', paddingLeft: 15 }}>
          {data?.current_batch_id
            ? `Recovering ${data.current_batch_id.slice(0, 10)}...`
            : `${data?.queue_size || 1} in recovery queue`}
        </span>
      ) : (
        <span style={{ fontSize: 10, color: 'var(--text-muted)', paddingLeft: 15 }}>
          Polling interval: 30s
        </span>
      )}
    </div>
  );
}

function AppContent() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} style={{ color: 'var(--accent)' }} />
            <span className="sidebar-logo">PayPulse</span>
          </div>
          <div className="sidebar-tagline">Detect. Decide. Recover.</div>
        </div>

        <nav className="sidebar-nav">
          <div
            className={`sidebar-link ${page === 'dashboard' ? 'active' : ''}`}
            onClick={() => setPage('dashboard')}
          >
            <LayoutDashboard size={16} />
            Dashboard
          </div>
          <div
            className={`sidebar-link ${page === 'simulator' ? 'active' : ''}`}
            onClick={() => setPage('simulator')}
          >
            <Smartphone size={16} />
            Phone Simulator
          </div>
          <div
            className={`sidebar-link ${page === 'policy' ? 'active' : ''}`}
            onClick={() => setPage('policy')}
          >
            <SlidersHorizontal size={16} />
            Policy Studio
          </div>
          <div
            className={`sidebar-link ${page === 'audit' ? 'active' : ''}`}
            onClick={() => setPage('audit')}
          >
            <ScrollText size={16} />
            Audit Trail
          </div>
        </nav>

        <div className="sidebar-footer">
          <AgentIndicator />
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Heart size={10} style={{ color: 'var(--status-exhausted)' }} />
            <span>Razorpay AI Buildathon 2026</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {page === 'dashboard' && <Dashboard />}
        {page === 'simulator' && <SimulatorPage />}
        {page === 'policy' && <PolicyStudioPage />}
        {page === 'audit' && <AuditPage />}
      </main>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
