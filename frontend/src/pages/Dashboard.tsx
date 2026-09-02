/* ── Dashboard v3.0 — Main view: Agent Feed + Metrics + ROI Calculator + Clean Fluid Grid ── */

import { useState, useMemo } from 'react';
import { FlaskConical, Smartphone, ShoppingBag } from 'lucide-react';
import MetricCards from '../components/MetricCards';
import AgentFeed from '../components/AgentFeed';
import BatchRunner from '../components/BatchRunner';
import PaymentChart from '../components/PaymentChart';
import FailureBreakdown from '../components/FailureBreakdown';
import RecoveryDonut from '../components/RecoveryDonut';
import { FailureStudio } from '../components/FailureStudio';
import { PaymentDetailDrawer } from '../components/PaymentDetailDrawer';
import { ROICalculator } from '../components/ROICalculator';
import { useAuditFeed, useAuditLog } from '../api/client';
import type { FailureBreakdown as FailureBreakdownType } from '../types';

interface DashboardProps {
  onOpenStorefront?: () => void;
}

export default function Dashboard({ onOpenStorefront }: DashboardProps) {
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  const { data: feedData } = useAuditFeed();
  const { data: allAuditData } = useAuditLog({ limit: 200 });

  // Calculate live metrics
  const allAudit = allAuditData?.entries || [];
  const metrics = useMemo(() => {
    let recovered = 0;
    let escalated = 0;
    let exhausted = 0;
    let moneyAtRisk = 0;
    let moneyRecovered = 0;
    const seenPayments = new Set<string>();

    const breakdown: FailureBreakdownType = {
      SOFT: 0,
      HARD: 0,
      UPI_HANDOFF: 0,
      SESSION_TIMEOUT: 0,
    };

    for (const e of allAudit) {
      if (e.event_type === 'classified' && e.failure_type) {
        const ft = e.failure_type as keyof FailureBreakdownType;
        if (breakdown[ft] !== undefined) {
          breakdown[ft]++;
        }
      }

      if (e.event_type === 'failure_detected' && !seenPayments.has(e.payment_id)) {
        seenPayments.add(e.payment_id);
        moneyAtRisk += e.amount_paise || 0;
      }

      const amount = e.amount_paise || 0;
      if (e.outcome === 'recovered' || e.outcome === 'dispatched') {
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
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-10">
      {/* Top Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#101623] border border-[#222F46] p-3.5 px-4 rounded-[12px] shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[#F0F6FC] text-[13px] font-bold">
            Autonomous Recovery Engine Active
          </span>
          <span className="hidden md:inline text-[11px] font-mono text-[#94A3B8]">
            · Monitoring Razorpay webhook & polling stream
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenStorefront}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#38BDF8] to-[#3B82F6] hover:from-[#0EA5E9] hover:to-[#2563EB] text-white font-bold text-[12px] py-1.5 px-3.5 rounded-[6px] shadow-md shadow-[#38BDF8]/20 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>🛍️ Live Storefront Demo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const latestWithLink = feedEntries.find((e) => e.action_taken && e.action_taken !== 'STOP');
              if (latestWithLink) {
                setSelectedPaymentId(latestWithLink.payment_id);
              } else if (feedEntries[0]) {
                setSelectedPaymentId(feedEntries[0].payment_id);
              } else {
                setIsStudioOpen(true);
              }
            }}
            className="btn btn-secondary py-1.5 px-3 text-[12px] flex items-center gap-1.5"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Phone Simulator</span>
          </button>

          <button
            type="button"
            onClick={() => setIsStudioOpen(true)}
            className="btn btn-secondary py-1.5 px-3 text-[12px] flex items-center gap-1.5"
          >
            <FlaskConical className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Failure Studio</span>
          </button>
        </div>
      </div>

      {/* 1. Hero Metric Cards */}
      <MetricCards
        totalFailures={metrics.totalFailures}
        recovered={metrics.recovered}
        escalated={metrics.escalated}
        exhausted={metrics.exhausted}
        moneyAtRisk={metrics.moneyAtRisk}
        moneyRecovered={metrics.moneyRecovered}
        recoveryRate={metrics.recoveryRate}
      />

      {/* 2. Autonomous Batch Execution Engine */}
      <BatchRunner />

      {/* 3. Command Center: Balanced 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (7 cols): Live Agent Feed */}
        <div className="lg:col-span-7 min-h-[500px] flex flex-col">
          <AgentFeed onSelect={setSelectedPaymentId} />
        </div>

        {/* Right Column (5 cols): Visual Analytics */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Recovery Timeline */}
          <PaymentChart entries={feedEntries} />

          {/* Breakdown & Outcomes Side-by-Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FailureBreakdown data={metrics.breakdown} />
            <RecoveryDonut
              recovered={metrics.recovered}
              escalated={metrics.escalated}
              exhausted={metrics.exhausted}
            />
          </div>
        </div>
      </div>

      {/* 4. Projected Revenue Recovery (ROI Simulator) */}
      <div className="pt-2">
        <ROICalculator />
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

      {/* Payment Inspector Drawer */}
      <PaymentDetailDrawer
        paymentId={selectedPaymentId}
        onClose={() => setSelectedPaymentId(null)}
      />
    </div>
  );
}
