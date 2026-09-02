/* ── MetricCards — 4 key metrics with counter animation & glowing accents ── */

import { useEffect, useRef, useState } from 'react';
import { TrendingUp, AlertTriangle, XCircle, Zap } from 'lucide-react';
import { formatPaise } from '../types';

interface MetricCardsProps {
  totalFailures: number;
  recovered: number;
  escalated: number;
  exhausted: number;
  moneyAtRisk: number;
  moneyRecovered: number;
  recoveryRate: string;
}

function AnimatedNumber({ value, duration = 400 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const startTime = useRef(0);
  const rafId = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const diff = value - start;
    if (diff === 0) return;

    startTime.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = value;
      }
    };

    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [value, duration]);

  return <>{display}</>;
}

export default function MetricCards({
  totalFailures,
  recovered,
  escalated,
  exhausted,
  moneyAtRisk,
  moneyRecovered,
  recoveryRate,
}: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* Total Failures */}
      <div className="metric-card relative border-t-2 border-t-[#38BDF8]">
        <div className="flex items-center justify-between">
          <div className="metric-label flex items-center gap-1.5 text-[#94A3B8]">
            <Zap size={14} className="text-[#38BDF8]" />
            <span>Failures Intercepted</span>
          </div>
          <span className="text-[10px] font-mono text-[#38BDF8] bg-[#38BDF8]/10 px-1.5 py-0.5 rounded-[4px]">
            100% Tracked
          </span>
        </div>
        <div className="metric-value text-[#F0F6FC] mt-1">
          <AnimatedNumber value={totalFailures} />
        </div>
        <div className="metric-sublabel text-[#566782] font-mono">
          {formatPaise(moneyAtRisk)} at risk
        </div>
      </div>

      {/* Recovered */}
      <div className="metric-card relative border-t-2 border-t-[#10B981] shadow-lg shadow-[#10B981]/5">
        <div className="flex items-center justify-between">
          <div className="metric-label flex items-center gap-1.5 text-[#10B981] font-semibold">
            <TrendingUp size={14} />
            <span>Money Recovered</span>
          </div>
          <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded-[4px] font-bold">
            {recoveryRate} Rate
          </span>
        </div>
        <div className="metric-value text-[#10B981] mt-1">
          <AnimatedNumber value={recovered} />
          <span className="text-[14px] text-[#94A3B8] font-normal ml-1">orders</span>
        </div>
        <div className="metric-sublabel text-[#10B981]/80 font-mono font-medium">
          {formatPaise(moneyRecovered)} saved
        </div>
      </div>

      {/* Escalated */}
      <div className="metric-card relative border-t-2 border-t-[#F59E0B]">
        <div className="flex items-center justify-between">
          <div className="metric-label flex items-center gap-1.5 text-[#94A3B8]">
            <AlertTriangle size={14} className="text-[#F59E0B]" />
            <span>Escalated (Human Review)</span>
          </div>
          <span className="text-[10px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5 rounded-[4px]">
            High-Value
          </span>
        </div>
        <div className="metric-value text-[#F59E0B] mt-1">
          <AnimatedNumber value={escalated} />
        </div>
        <div className="metric-sublabel text-[#566782]">flagged by policy guardrails</div>
      </div>

      {/* Exhausted */}
      <div className="metric-card relative border-t-2 border-t-[#EF4444]">
        <div className="flex items-center justify-between">
          <div className="metric-label flex items-center gap-1.5 text-[#94A3B8]">
            <XCircle size={14} className="text-[#EF4444]" />
            <span>Exhausted / Stopped</span>
          </div>
          <span className="text-[10px] font-mono text-[#EF4444] bg-[#EF4444]/10 px-1.5 py-0.5 rounded-[4px]">
            Stopping Rule
          </span>
        </div>
        <div className="metric-value text-[#EF4444] mt-1">
          <AnimatedNumber value={exhausted} />
        </div>
        <div className="metric-sublabel text-[#566782]">max retry limit enforced</div>
      </div>
    </div>
  );
}
