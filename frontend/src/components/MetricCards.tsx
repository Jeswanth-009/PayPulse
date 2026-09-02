/* ── MetricCards — 4 key metrics with counter animation ── */

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
    <div className="metrics-grid">
      {/* Total Failures */}
      <div className="metric-card">
        <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={14} style={{ color: 'var(--status-exhausted)' }} />
          Failures Detected
        </div>
        <div className="metric-value" style={{ color: 'var(--text-primary)' }}>
          <AnimatedNumber value={totalFailures} />
        </div>
        <div className="metric-sublabel">{formatPaise(moneyAtRisk)} at risk</div>
      </div>

      {/* Recovered */}
      <div className="metric-card">
        <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={14} style={{ color: 'var(--status-recovered)' }} />
          Recovered
        </div>
        <div className="metric-value" style={{ color: 'var(--status-recovered)' }}>
          <AnimatedNumber value={recovered} />
        </div>
        <div className="metric-sublabel">{formatPaise(moneyRecovered)} saved · {recoveryRate}</div>
      </div>

      {/* Escalated */}
      <div className="metric-card">
        <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14} style={{ color: 'var(--status-escalated)' }} />
          Escalated
        </div>
        <div className="metric-value" style={{ color: 'var(--status-escalated)' }}>
          <AnimatedNumber value={escalated} />
        </div>
        <div className="metric-sublabel">flagged for review</div>
      </div>

      {/* Exhausted */}
      <div className="metric-card">
        <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <XCircle size={14} style={{ color: 'var(--status-exhausted)' }} />
          Exhausted
        </div>
        <div className="metric-value" style={{ color: 'var(--status-exhausted)' }}>
          <AnimatedNumber value={exhausted} />
        </div>
        <div className="metric-sublabel">recovery stopped</div>
      </div>
    </div>
  );
}
