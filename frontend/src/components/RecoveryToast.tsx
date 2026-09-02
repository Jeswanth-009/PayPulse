import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle, X, Smartphone, ArrowRight } from 'lucide-react';
import { useAuditFeed } from '../api/client';
import { formatPaise } from '../types';

interface ToastItem {
  id: string;
  paymentId: string;
  amountPaise: number;
  customerName?: string;
  action: string;
  timestamp: string;
}

interface RecoveryToastProps {
  onInspectPayment?: (paymentId: string) => void;
}

export const RecoveryToast: React.FC<RecoveryToastProps> = ({ onInspectPayment }) => {
  const { data: feedData } = useAuditFeed();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seenIds = useRef<Set<number>>(new Set());
  const initialLoad = useRef(true);

  useEffect(() => {
    if (!feedData?.entries) return;

    // Ignore entries on initial page load to avoid toast spam
    if (initialLoad.current) {
      feedData.entries.forEach((e) => seenIds.current.add(e.id));
      initialLoad.current = false;
      return;
    }

    // Check for newly arrived recoveries
    feedData.entries.forEach((entry) => {
      if (!seenIds.current.has(entry.id)) {
        seenIds.current.add(entry.id);

        if (entry.outcome === 'dispatched' || entry.outcome === 'recovered') {
          const newToast: ToastItem = {
            id: `toast-${entry.id}`,
            paymentId: entry.payment_id,
            amountPaise: entry.amount_paise || 199900,
            action: entry.action_taken || 'RECOVERY_LINK',
            timestamp: new Date().toLocaleTimeString(),
          };

          setToasts((prev) => [newToast, ...prev.slice(0, 2)]);

          // Auto remove after 6 seconds
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
          }, 6000);
        }
      }
    });
  }, [feedData]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-[380px] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="pointer-events-auto bg-[#101623] border border-[#10B981]/50 rounded-[10px] p-3.5 shadow-2xl shadow-[#10B981]/15 backdrop-blur-lg flex items-start gap-3 relative overflow-hidden"
          >
            {/* Top glowing line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#10B981] via-[#38BDF8] to-[#10B981]" />

            <div className="bg-[#10B981]/15 border border-[#10B981]/30 p-2 rounded-full shrink-0 mt-0.5">
              <CheckCircle className="w-4 h-4 text-[#10B981]" />
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5 text-[11px] text-[#10B981] font-mono font-bold mb-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Autonomous Recovery Fired</span>
              </div>
              <p className="text-[#F0F6FC] text-[13px] font-semibold">
                Saved {formatPaise(toast.amountPaise)} checkout
              </p>
              <p className="text-[#94A3B8] text-[11px] font-mono truncate mt-0.5">
                {toast.paymentId} · {toast.action}
              </p>

              <button
                type="button"
                onClick={() => {
                  onInspectPayment?.(toast.paymentId);
                  removeToast(toast.id);
                }}
                className="mt-2 text-[11px] font-semibold text-[#38BDF8] hover:text-[#0EA5E9] flex items-center gap-1 transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Open in Phone Simulator</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-[#566782] hover:text-[#F0F6FC] p-1 transition-colors absolute top-2 right-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
