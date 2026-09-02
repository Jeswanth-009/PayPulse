/* ── Dashboard — Main view: Agent Feed + Metrics + Charts + Batch Runner ── */

import MetricCards from '../components/MetricCards';
import AgentFeed from '../components/AgentFeed';
import BatchRunner from '../components/BatchRunner';
import PaymentChart from '../components/PaymentChart';
import FailureBreakdown from '../components/FailureBreakdown';
import RecoveryDonut from '../components/RecoveryDonut';
import { useAuditFeed, useAuditLog } from '../api/client';
import { useMemo } from 'react';
import type { FailureBreakdown as FailureBreakdownType } from '../types';

export default function Dashboard() {
  const { data: feedData } = useAuditFeed();
  const { data: allAudit } = useAuditLog({ event_type: 'action_taken', limit: 200 });

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {/* Batch Runner - top */}
      <BatchRunner />

      {/* Metrics */}
      <MetricCards
        totalFailures={metrics.totalFailures}
        recovered={metrics.recovered}
        escalated={metrics.escalated}
        exhausted={metrics.exhausted}
        moneyAtRisk={metrics.moneyAtRisk}
        moneyRecovered={metrics.moneyRecovered}
        recoveryRate={metrics.recoveryRate}
      />

      {/* Main grid: Agent Feed (left) + Charts (right) */}
      <div className="dashboard-grid" style={{ flex: 1, minHeight: 0 }}>
        {/* Left: Agent Feed */}
        <AgentFeed />

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
    </div>
  );
}
