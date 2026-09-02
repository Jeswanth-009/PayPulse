/* ── BatchRunner — Run batch with progress + inline report ── */

import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { useBatchRun, useBatchReport, useAgentStatus } from '../api/client';
import { formatPaise } from '../types';

export default function BatchRunner() {
  const [count, setCount] = useState(100);
  const [failureRate, setFailureRate] = useState(25);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

  const batchRun = useBatchRun();
  const { data: agentStatus } = useAgentStatus();
  const { data: report } = useBatchReport(activeBatchId);

  const isRunning = agentStatus?.is_running || batchRun.isPending;
  const isComplete = report?.status === 'completed';

  const handleRun = async () => {
    try {
      const result = await batchRun.mutateAsync({
        count,
        failure_rate: failureRate / 100,
      });
      setActiveBatchId(result.batch_id);
    } catch (err) {
      console.error('Batch run failed:', err);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Batch Runner</span>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {/* Payment count */}
        <div style={{ flex: '1 1 120px' }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Payment count
          </label>
          <input
            type="number"
            className="input"
            min={10}
            max={200}
            value={count}
            onChange={(e) => setCount(Math.min(200, Math.max(10, parseInt(e.target.value) || 10)))}
            disabled={isRunning}
          />
        </div>

        {/* Failure rate */}
        <div style={{ flex: '1 1 160px' }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Failure rate: {failureRate}%
          </label>
          <input
            type="range"
            min={0}
            max={50}
            value={failureRate}
            onChange={(e) => setFailureRate(parseInt(e.target.value))}
            disabled={isRunning}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
          />
        </div>

        {/* Run button */}
        <button
          className="btn btn-primary"
          onClick={handleRun}
          disabled={isRunning}
          style={{ height: 36 }}
        >
          {isRunning ? (
            <>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Running...
            </>
          ) : (
            <>
              <Play size={14} />
              Run Batch
            </>
          )}
        </button>
      </div>

      {/* Progress bar */}
      {activeBatchId && !isComplete && (
        <div style={{ marginTop: 12 }}>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: isRunning ? '60%' : '100%',
                animation: isRunning ? 'none' : undefined,
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
            {agentStatus?.is_running
              ? `Processing... ${agentStatus.queue_size} remaining`
              : 'Seeding payments...'}
          </div>
        </div>
      )}

      {/* Batch Report */}
      {report && isComplete && (
        <div className="batch-report">
          <div className="report-big-number" style={{ color: 'var(--status-recovered)' }}>
            {report.recovery_rate}
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Recovery Rate · {formatPaise(report.money_recovered_paise)} recovered of {formatPaise(report.money_at_risk_paise)} at risk
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--status-recovered)' }}>
                {report.recovered}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Recovered</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--status-escalated)' }}>
                {report.escalated}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Escalated</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--status-exhausted)' }}>
                {report.exhausted}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Exhausted</div>
            </div>
          </div>

          {/* Failure breakdown */}
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Failure Types
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              <span>SOFT: {report.failure_breakdown.SOFT}</span>
              <span>HARD: {report.failure_breakdown.HARD}</span>
              <span>UPI_HANDOFF: {report.failure_breakdown.UPI_HANDOFF}</span>
              <span>SESSION_TIMEOUT: {report.failure_breakdown.SESSION_TIMEOUT}</span>
            </div>
          </div>
        </div>
      )}

      {/* Spinner keyframes */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
