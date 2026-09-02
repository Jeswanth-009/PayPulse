/* ── AuditPage v3.0 — Decision Ledger & Audit Trail ── */

import { ScrollText } from 'lucide-react';
import AuditTrail from '../components/AuditTrail';

export default function AuditPage() {
  return (
    <div className="max-w-[1360px] mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222F46] pb-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-[8px] bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
              <ScrollText size={16} />
            </div>
            <h1 className="text-[#F0F6FC] text-[22px] font-bold tracking-tight">
              Audit Trail & Autonomous Decision Ledger
            </h1>
            <span className="text-[10px] font-mono font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 px-2 py-0.5 rounded-[4px]">
              Immutable Log
            </span>
          </div>
          <p className="text-[#94A3B8] text-[13px]">
            Comprehensive ledger tracking every webhook signal, LLM root-cause classification, generated payload, and customer resolution.
          </p>
        </div>
      </div>

      <AuditTrail />
    </div>
  );
}
