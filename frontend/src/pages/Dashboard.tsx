/* ── Dashboard — Main view: Agent Feed + Metrics + ROI Calculator + Charts + Failure Studio ── */

import { useState, useMemo } from 'react';
import { FlaskConical } from 'lucide-react';
import MetricCards from '../components/MetricCards';
import AgentFeed from '../components/AgentFeed';
import BatchRunner from '../components/BatchRunner';
import PaymentChart from '../components/PaymentChart';
import FailureBreakdown from '../components/FailureBreakdown';
import RecoveryDonut from '../components/RecoveryDonut';
import { ROICalculator } from '../components/ROICalculator';
import { FailureStudio } from '../components/FailureStudio';
import { PaymentDetailDrawer } from '../components/PaymentDetailDrawer';
import { useAuditFeed, useAuditLog } from '../api/client';
import type { FailureBreakdown as FailureBreakdownType } from '../types';

export default function Dashboard() {
  const { data: feedData } = useAuditFeed();
  const { data: allAudit } = useAuditLog({ event_type: 'action_taken', limit: 200 });

  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  // Compute metrics from audit feed
  const metrics = useMemo(() => {
    const entries = allAudit?.entries || [];

    let recovered = 0;
    let escalated = 0;
    let exhausted = 0;
    let moneyAtRisk = 0;
    let moneyRecovered = 0;
    const seenPayments = new Set<string>();
    const breakdown: FailureBreakdownType = { SOFT: 0, HARD: 0, UPI_HANDOFF: 0, SESSION_TIMEOUT: 0 };

    for (const e of entries) {
      const amount = e.amount_paise || 0;

      if (!seenPayments.has(e.payment_id)) {
        seenPayments.add(e.payment_id);
        moneyAtRisk += amount;

        // Count failure types (unique per payment)
        if (e.failure_type && e.failure_type in breakdown) {
          breakdown[e.failure_type as keyof FailureBreakdownType]++;
        }
      }

      if (e.outcome === 'dispatched' || e.outcome === 'recovered') {
        recovered++;
        moneyRecovered += amount;
      } else if (e.outcome === 'escalated') {
        escalated++;
      } else if (e.outcome === 'exhausted') {
        exhausted++;
      }
    }

    const totalFailures = seenPayments.size;
    const rate = totalFailures > 0 ? ((recovered / totalFailures) * 100).toFixed(2) + '%' : '0.00%';

    return {
      totalFailures,
      recovered,
      escalated,
      exhausted,
      moneyAtRisk,
      moneyRecovered,
      recoveryRate: rate,
      breakdown,
    };
  }, [allAudit]);

  const feedEntries = feedData?.entries || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top action row with Batch Runner & Failure Studio trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1">
          <BatchRunner />
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsStudioOpen(true)}
            className="flex items-center gap-2 bg-[#21262D] hover:bg-[#30363D] text-[#E6EDF3] border border-[#30363D] text-[13px] font-medium py-2 px-3.5 rounded-[4px] shadow-xs transition-colors"
          >
            <FlaskConical className="w-4 h-4 text-[#3395FF]" />
            <span>Failure Studio</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <MetricCards
        totalFailures={metrics.totalFailures}
        recovered={metrics.recovered}
        escalated={metrics.escalated}
        exhausted={metrics.exhausted}
        moneyAtRisk={metrics.moneyAtRisk}
        moneyRecovered={metrics.moneyRecovered}
        recoveryRate={metrics.recoveryRate}
      />

      {/* Merchant ROI Calculator */}
      <ROICalculator />

      {/* Main grid: Agent Feed (left) + Charts (right) */}
      <div className="dashboard-grid" style={{ flex: 1, minHeight: 0 }}>
        {/* Left: Agent Feed */}
        <AgentFeed onSelect={setSelectedPaymentId} />

        {/* Right: Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
          <PaymentChart entries={feedEntries} />
          <div className="charts-grid">
            <FailureBreakdown data={metrics.breakdown} />
            <RecoveryDonut
              recovered={metrics.recovered}
              escalated={metrics.escalated}
              exhausted={metrics.exhausted}
            />
          </div>
        </div>
      </div>

      {/* Failure Studio Drawer */}
      <FailureStudio
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        onSelectPayment={(id) => {
          setIsStudioOpen(false);
          setSelectedPaymentId(id);
        }}
      />

      {/* Payment Inspector / Customer Experience Drawer */}
      <PaymentDetailDrawer
        paymentId={selectedPaymentId}
        onClose={() => setSelectedPaymentId(null)}
      />
    </div>
  );
}
