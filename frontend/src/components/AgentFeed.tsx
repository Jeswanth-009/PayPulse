/* ── AgentFeed — Live scrolling feed of agent decisions ── */

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuditFeed } from '../api/client';
import { formatPaise, getOutcomeBadgeClass } from '../types';
import { Activity, ArrowRight, Smartphone, Sparkles } from 'lucide-react';

interface AgentFeedProps {
  onSelect?: (paymentId: string) => void;
}

function formatSafeTime(dateStr?: string | null): string {
  if (!dateStr) return '--:--:--';
  try {
    const cleanStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const d = new Date(cleanStr.endsWith('Z') ? cleanStr : cleanStr + 'Z');
    if (isNaN(d.getTime())) return dateStr.slice(11, 19) || '--:--:--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch {
    return '--:--:--';
  }
}

export default function AgentFeed({ onSelect }: AgentFeedProps) {
  const { data } = useAuditFeed();
  const scrollRef = useRef<HTMLDivElement>(null);

  const entries = data?.entries || [];

  // Auto-scroll to top on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [entries.length]);

  return (
    <div className="card h-full flex flex-col p-0 overflow-hidden border border-[#222F46] shadow-xl">
      <div className="card-header p-3 px-4 border-b border-[#222F46] bg-[#090D16]/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
          <Activity size={15} className="text-[#38BDF8]" />
          <span className="text-[13px] font-bold text-[#F0F6FC]">Live Autonomous Agent Feed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#94A3B8] bg-[#182234] px-2 py-0.5 rounded-[4px] border border-[#222F46]">
            {entries.length} decisions
          </span>
          <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded-[4px]">
            1s Polling
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-[#1A2538]"
      >
        {entries.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-[#566782]" />
            <p className="text-[#94A3B8] text-[13px]">
              No agent decisions in this session yet.
            </p>
            <p className="text-[#566782] text-[11px] font-mono">
              Execute a batch or trigger Failure Studio to watch autonomous recoveries in real-time.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {entries.map((entry) => {
              const isRecovered = entry.outcome === 'recovered' || entry.outcome === 'dispatched';
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  onClick={() => onSelect?.(entry.payment_id)}
                  className={`feed-entry cursor-pointer p-3.5 hover:bg-[#182234] transition-all group ${
                    isRecovered ? 'bg-[#10B981]/[0.02]' : ''
                  }`}
                >
                  <div className="feed-entry-header flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="feed-timestamp text-[11px] font-mono text-[#566782]">
                        {formatSafeTime(entry.created_at)}
                      </span>
                      <span className="feed-payment-id font-mono text-[12px] font-bold text-[#F0F6FC] group-hover:text-[#38BDF8] transition-colors">
                        {entry.payment_id}
                      </span>
                      <span className="feed-amount font-mono text-[12px] font-bold text-[#10B981]">
                        {entry.amount_paise ? formatPaise(entry.amount_paise) : '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[11px] font-mono">
                        <span className="text-[#94A3B8] bg-[#182234] px-1.5 py-0.5 rounded-[3px] border border-[#222F46]">
                          {entry.failure_type || 'SOFT'}
                        </span>
                        <ArrowRight size={10} className="text-[#566782]" />
                        <span className="text-[#38BDF8] font-semibold">
                          {entry.action_taken || 'RETRY'}
                        </span>
                      </div>

                      <span className={`badge ${getOutcomeBadgeClass(entry.outcome)}`}>
                        {(entry.outcome || 'pending').toUpperCase()}
                      </span>

                      <span className="hidden sm:flex text-[10px] bg-[#182234] text-[#38BDF8] border border-[#38BDF8]/30 px-1.5 py-0.5 rounded-[4px] font-mono items-center gap-1 group-hover:bg-[#38BDF8] group-hover:text-white transition-all">
                        <Smartphone size={10} />
                        <span>Inspect</span>
                      </span>
                    </div>
                  </div>

                  {entry.llm_reasoning && (
                    <div className="feed-reasoning mt-2 text-[12px] text-[#94A3B8] italic border-l-2 border-[#38BDF8] pl-2.5 bg-[#38BDF8]/5 py-1 rounded-[0_4px_4px_0]">
                      &quot;{entry.llm_reasoning}&quot;
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
