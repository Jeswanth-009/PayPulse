/* ── App Shell — Modern Fintech Sidebar + Top Bar + Smooth View Transitions ── */

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Smartphone,
  ScrollText,
  SlidersHorizontal,
  Zap,
  Heart,
  ShoppingBag,
  ShieldCheck,
  Cpu,
  Radio,
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AuditPage from './pages/AuditPage';
import { PolicyStudioPage } from './pages/PolicyStudioPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { StorefrontModal } from './components/StorefrontModal';
import { useAgentStatus } from './api/client';
import { RecoveryToast } from './components/RecoveryToast';

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
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="relative flex w-2 h-2">
          {isRunning ? (
            <>
              <span className="absolute w-full h-full rounded-full bg-[#10B981] opacity-75 animate-ping" />
              <span className="relative w-2 h-2 rounded-full bg-[#10B981]" />
            </>
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#566782]" />
          )}
        </span>
        <span className={`text-[11px] font-mono font-bold ${isRunning ? 'text-[#10B981]' : 'text-[#94A3B8]'}`}>
          {isRunning ? 'AGENT ACTIVE' : 'AGENT STANDBY'}
        </span>
      </div>

      {isRunning ? (
        <span className="text-[10px] font-mono text-[#38BDF8] pl-4">
          {data?.current_batch_id
            ? `Recovering ${data.current_batch_id.slice(0, 10)}...`
            : `${data?.queue_size || 1} in queue`}
        </span>
      ) : (
        <span className="text-[10px] text-[#566782] pl-4">
          Polling stream (30s)
        </span>
      )}
    </div>
  );
}

function AppContent() {
  const [page, setPage] = useState<Page>('dashboard');
  const [isStorefrontOpen, setIsStorefrontOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[6px] bg-gradient-to-br from-[#38BDF8] to-[#3B82F6] flex items-center justify-center shadow-lg shadow-[#38BDF8]/20">
              <Zap size={16} className="text-white fill-white" />
            </div>
            <div>
              <span className="sidebar-logo block leading-none">PayPulse</span>
              <span className="sidebar-tagline block">Autonomous AI Recovery</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#566782] px-3 py-1 mb-1">
            Command Center
          </div>

          <button
            type="button"
            className={`sidebar-link w-full text-left ${page === 'dashboard' ? 'active' : ''}`}
            onClick={() => setPage('dashboard')}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`sidebar-link w-full text-left ${page === 'simulator' ? 'active' : ''}`}
            onClick={() => setPage('simulator')}
          >
            <Smartphone size={16} />
            <div className="flex items-center justify-between flex-1">
              <span>Phone Simulator</span>
              <span className="text-[9px] font-mono font-bold bg-[#10B981]/15 text-[#10B981] px-1.5 py-0.5 rounded-[3px] border border-[#10B981]/30">
                LIVE
              </span>
            </div>
          </button>

          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#566782] px-3 pt-4 pb-1">
            Governance & Logs
          </div>

          <button
            type="button"
            className={`sidebar-link w-full text-left ${page === 'policy' ? 'active' : ''}`}
            onClick={() => setPage('policy')}
          >
            <SlidersHorizontal size={16} />
            <span>Policy Studio</span>
          </button>

          <button
            type="button"
            className={`sidebar-link w-full text-left ${page === 'audit' ? 'active' : ''}`}
            onClick={() => setPage('audit')}
          >
            <ScrollText size={16} />
            <span>Audit Trail</span>
          </button>

          {/* Quick Interactive Storefront Demo Link */}
          <div className="mt-auto pt-4 px-1">
            <button
              type="button"
              onClick={() => setIsStorefrontOpen(true)}
              className="w-full bg-gradient-to-r from-[#38BDF8]/15 to-[#3B82F6]/15 hover:from-[#38BDF8]/25 hover:to-[#3B82F6]/25 border border-[#38BDF8]/40 hover:border-[#38BDF8] p-3 rounded-[8px] text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between text-[#38BDF8] text-[12px] font-bold mb-1">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Storefront Demo</span>
                </div>
                <span className="text-[10px] font-mono group-hover:translate-x-0.5 transition-transform">➔</span>
              </div>
              <p className="text-[#94A3B8] text-[11px] leading-snug">
                Simulate a real checkout dropout & instant AI recovery.
              </p>
            </button>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <AgentIndicator />
          <div className="mt-3 flex items-center justify-between text-[#566782] text-[10px]">
            <div className="flex items-center gap-1">
              <Heart size={10} className="text-[#EF4444]" />
              <span>Razorpay Buildathon</span>
            </div>
            <span className="font-mono">v2.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area with Header */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Global Top Bar */}
        <header className="top-bar">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#F0F6FC]">
              {page === 'dashboard' && (
                <>
                  <LayoutDashboard className="w-4 h-4 text-[#38BDF8]" />
                  <span>Autonomous Recovery Command Center</span>
                </>
              )}
              {page === 'simulator' && (
                <>
                  <Smartphone className="w-4 h-4 text-[#10B981]" />
                  <span>Customer Experience & Phone Simulator</span>
                </>
              )}
              {page === 'policy' && (
                <>
                  <SlidersHorizontal className="w-4 h-4 text-[#F59E0B]" />
                  <span>Merchant Policy & Guardrails Studio</span>
                </>
              )}
              {page === 'audit' && (
                <>
                  <ScrollText className="w-4 h-4 text-[#38BDF8]" />
                  <span>Audit Trail & Decision Ledger</span>
                </>
              )}
            </div>
          </div>

          {/* Right Status Indicators */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-[#182234] border border-[#222F46] px-2.5 py-1 rounded-[6px] text-[11px] font-mono text-[#94A3B8]">
              <Radio className="w-3 h-3 text-[#10B981] animate-pulse" />
              <span>Razorpay Testnet</span>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-[#182234] border border-[#222F46] px-2.5 py-1 rounded-[6px] text-[11px] font-mono text-[#94A3B8]">
              <Cpu className="w-3 h-3 text-[#38BDF8]" />
              <span>MiniMax M3 Free</span>
            </div>
            <div className="hidden lg:flex items-center gap-2 bg-[#182234] border border-[#222F46] px-2.5 py-1 rounded-[6px] text-[11px] font-mono text-[#94A3B8]">
              <ShieldCheck className="w-3 h-3 text-[#10B981]" />
              <span>Guardrails: 2 Retries Max</span>
            </div>

            {/* Quick Trigger Storefront Demo Header Button */}
            <button
              type="button"
              onClick={() => setIsStorefrontOpen(true)}
              className="btn btn-primary py-1.5 px-3 text-[12px] flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Test Store Checkout</span>
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full flex-1"
            >
              {page === 'dashboard' && <Dashboard onOpenStorefront={() => setIsStorefrontOpen(true)} />}
              {page === 'simulator' && <SimulatorPage />}
              {page === 'policy' && <PolicyStudioPage />}
              {page === 'audit' && <AuditPage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Interactive Storefront Demo Modal */}
      <StorefrontModal
        isOpen={isStorefrontOpen}
        onClose={() => setIsStorefrontOpen(false)}
        onOpenSimulator={() => {
          setIsStorefrontOpen(false);
          setPage('simulator');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <RecoveryToast />
    </QueryClientProvider>
  );
}
