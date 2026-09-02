/* ── AgentFeed — Live scrolling feed of agent decisions ── */

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useAuditFeed } from '../api/client';
import { formatPaise, getOutcomeBadgeClass } from '../types';
import { Activity } from 'lucide-react';

interface AgentFeedProps {
  onSelect?: (paymentId: string) => void;
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
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}>
      <div className="card-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={14} style={{ color: 'var(--accent)' }} />
          Live Agent Feed
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {entries.length} decisions · click row to inspect
        </span>
      </div>

      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
      >
        {entries.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No agent decisions yet. Run a batch or fire Failure Studio.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onClick={() => onSelect?.(entry.payment_id)}
                className="feed-entry cursor-pointer hover:bg-[#21262D] transition-colors"
              >
                <div className="feed-entry-header">
                  <span className="feed-timestamp">
                    {entry.created_at
                      ? format(new Date(entry.created_at + (entry.created_at.endsWith('Z') ? '' : 'Z')), 'HH:mm:ss')
                      : '--:--:--'}
                  </span>
                  <span className="feed-payment-id">{entry.payment_id}</span>
                  <span className="feed-amount">
                    {entry.amount_paise ? formatPaise(entry.amount_paise) : '—'}
                  </span>
                  <span className="feed-action">
                    <span style={{ color: 'var(--text-muted)' }}>{entry.failure_type || '?'}</span>
                    <span style={{ color: 'var(--text-muted)', margin: '0 2px' }}>→</span>
                    <span style={{ color: 'var(--accent)' }}>{entry.action_taken || '—'}</span>
                  </span>
                  <span className={`badge ${getOutcomeBadgeClass(entry.outcome)}`}>
                    {(entry.outcome || 'pending').toUpperCase()}
                  </span>
                  <span className="text-[10px] bg-[#21262D] text-[#58A6FF] border border-[#3395FF]/30 px-1.5 py-0.5 rounded-[4px] font-mono flex items-center gap-1 hover:bg-[#3395FF] hover:text-white transition-colors ml-auto">
                    📱 Simulator
                  </span>
                </div>
                {entry.llm_reasoning && (
                  <div className="feed-reasoning">
                    &quot;{entry.llm_reasoning}&quot;
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
