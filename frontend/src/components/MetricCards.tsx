/* ── MetricCards v3.0 — 4 key metrics with live recovery progress & glowing accents ── */

import { useEffect, useRef, useState } from 'react';
import { TrendingUp, AlertTriangle, Zap, ShieldCheck, ArrowUpRight } from 'lucide-react';
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

function AnimatedNumber({ value, duration = 450 }: { value: number; duration?: number }) {
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
  const recoveryPct = totalFailures > 0 ? (recovered / totalFailures) * 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Failures Intercepted */}
      <div className="metric-card relative bg-[#101623] border border-[#222F46] rounded-[12px] p-5 flex flex-col justify-between overflow-hidden shadow-xl hover:border-[#38BDF8]/50 transition-all group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
              <Zap size={16} />
            </div>
            <div>
              <span className="text-[#94A3B8] text-[12px] font-semibold block">Failures Intercepted</span>
              <span className="text-[10px] font-mono text-[#566782]">Real-time stream</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-0.5 rounded-[4px] border border-[#38BDF8]/20 font-bold">
            100% Tracked
          </span>
        </div>

        <div className="my-1">
          <div className="text-[32px] font-extrabold font-mono text-[#F0F6FC] tracking-tight flex items-baseline gap-1">
            <AnimatedNumber value={totalFailures} />
            <span className="text-[13px] text-[#94A3B8] font-normal">dropouts</span>
          </div>
        </div>

        <div className="pt-2 border-t border-[#1A2538] flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#94A3B8]">Gross at risk:</span>
          <span className="text-[#EF4444] font-bold">{formatPaise(moneyAtRisk)}</span>
        </div>
      </div>

      {/* 2. Money Recovered */}
      <div className="metric-card relative bg-[#101623] border border-[#10B981]/40 rounded-[12px] p-5 flex flex-col justify-between overflow-hidden shadow-xl shadow-[#10B981]/5 hover:border-[#10B981] transition-all group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#10B981] via-[#38BDF8] to-[#10B981]" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981]">
              <TrendingUp size={16} />
            </div>
            <div>
              <span className="text-[#10B981] text-[12px] font-bold block">Money Recovered</span>
              <span className="text-[10px] font-mono text-[#566782]">Autonomous capture</span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[#10B981] bg-[#10B981]/20 px-2 py-0.5 rounded-[4px] border border-[#10B981]/40 font-extrabold flex items-center gap-0.5">
            <ArrowUpRight size={12} />
            {recoveryRate}
          </span>
        </div>

        <div className="my-1">
          <div className="text-[32px] font-extrabold font-mono text-[#10B981] tracking-tight flex items-baseline gap-1">
            <AnimatedNumber value={recovered} />
            <span className="text-[13px] text-[#94A3B8] font-normal">saved</span>
          </div>
        </div>

        {/* Mini progress bar */}
        <div className="pt-2 border-t border-[#1A2538] space-y-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-[#94A3B8]">Total GMV saved:</span>
            <span className="text-[#10B981] font-bold">{formatPaise(moneyRecovered)}</span>
          </div>
          <div className="w-full h-1 bg-[#182234] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#10B981] to-[#38BDF8] transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, recoveryPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Escalated (VIP / Human Review) */}
      <div className="metric-card relative bg-[#101623] border border-[#222F46] rounded-[12px] p-5 flex flex-col justify-between overflow-hidden shadow-xl hover:border-[#F59E0B]/50 transition-all group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
              <AlertTriangle size={16} />
            </div>
            <div>
              <span className="text-[#94A3B8] text-[12px] font-semibold block">VIP Escalations</span>
              <span className="text-[10px] font-mono text-[#566782]">Human review queue</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded-[4px] border border-[#F59E0B]/20 font-bold">
            Policy Flagged
          </span>
        </div>

        <div className="my-1">
          <div className="text-[32px] font-extrabold font-mono text-[#F59E0B] tracking-tight flex items-baseline gap-1">
            <AnimatedNumber value={escalated} />
            <span className="text-[13px] text-[#94A3B8] font-normal">cases</span>
          </div>
        </div>

        <div className="pt-2 border-t border-[#1A2538] flex items-center justify-between text-[11px] font-mono text-[#566782]">
          <span>Threshold:</span>
          <span className="text-[#F0F6FC]">&gt;₹10,000 Basket</span>
        </div>
      </div>

      {/* 4. Exhausted (Stopping Rule) */}
      <div className="metric-card relative bg-[#101623] border border-[#222F46] rounded-[12px] p-5 flex flex-col justify-between overflow-hidden shadow-xl hover:border-[#EF4444]/50 transition-all group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#EF4444] to-transparent" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444]">
              <ShieldCheck size={16} />
            </div>
            <div>
              <span className="text-[#94A3B8] text-[12px] font-semibold block">Stopping Rule Enforced</span>
              <span className="text-[10px] font-mono text-[#566782]">Customer safeguard</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded-[4px] border border-[#EF4444]/20 font-bold">
            Fatigue Safe
          </span>
        </div>

        <div className="my-1">
          <div className="text-[32px] font-extrabold font-mono text-[#EF4444] tracking-tight flex items-baseline gap-1">
            <AnimatedNumber value={exhausted} />
            <span className="text-[13px] text-[#94A3B8] font-normal">halted</span>
          </div>
        </div>

        <div className="pt-2 border-t border-[#1A2538] flex items-center justify-between text-[11px] font-mono text-[#566782]">
          <span>Protection:</span>
          <span className="text-[#EF4444] font-semibold">Max 2 Retries</span>
        </div>
      </div>
    </div>
  );
}
