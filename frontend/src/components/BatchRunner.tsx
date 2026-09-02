/* ── BatchRunner v3.0 — Interactive Autonomous Recovery Pipeline with Multi-Step Stepper ── */

import { useState } from 'react';
import { Play, Loader2, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useBatchRun, useBatchReport, useAgentStatus } from '../api/client';

export default function BatchRunner() {
  const [count, setCount] = useState(25);
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

  const calculatedFails = Math.round((count * failureRate) / 100);

  return (
    <div className="card relative overflow-hidden bg-[#101623] border border-[#222F46] shadow-xl p-5 space-y-4">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1A2538] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#F0F6FC] text-[14px] font-bold">
                Autonomous Batch Recovery Engine
              </span>
              <span className="text-[10px] font-mono font-bold bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 px-2 py-0.5 rounded-[4px]">
                v3.0 Pipeline
              </span>
            </div>
            <span className="text-[#94A3B8] text-[11px]">
              Inject high-volume simulated checkout failures and evaluate end-to-end recovery performance.
            </span>
          </div>
        </div>

        {activeBatchId && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#94A3B8] bg-[#182234] px-2.5 py-1 rounded-[6px] border border-[#222F46]">
              Batch: <span className="text-[#F0F6FC] font-bold">{activeBatchId}</span>
            </span>
          </div>
        )}
      </div>

      {/* Control Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
        {/* Order Count Input + Quick Segmented Pills */}
        <div className="lg:col-span-4 space-y-1.5">
          <div className="flex justify-between items-center text-[12px]">
            <label className="text-[#94A3B8] font-medium flex items-center gap-1.5">
              <span>Orders to Seed</span>
              <span className="text-[10px] font-mono text-[#566782]">(Razorpay Testnet)</span>
            </label>
            <span className="font-mono text-[#F0F6FC] font-bold">{count} Orders</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#182234] p-1 rounded-[8px] border border-[#222F46]">
            {[10, 25, 50, 100].map((c) => (
              <button
                key={c}
                type="button"
                disabled={isRunning}
                onClick={() => setCount(c)}
                className={`flex-1 py-1.5 text-[11px] font-mono font-bold rounded-[6px] transition-all cursor-pointer ${
                  count === c
                    ? 'bg-[#38BDF8] text-white shadow-md shadow-[#38BDF8]/20'
                    : 'text-[#94A3B8] hover:text-[#F0F6FC] hover:bg-[#202D44]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Simulated Failure Rate Slider + Calculated Breakdown */}
        <div className="lg:col-span-5 space-y-1.5">
          <div className="flex justify-between items-center text-[12px]">
            <label className="text-[#94A3B8] font-medium flex items-center gap-1.5">
              <ShieldAlert size={13} className="text-[#F59E0B]" />
              <span>Simulated Failure Rate</span>
            </label>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[#F59E0B] font-bold">{failureRate}%</span>
              <span className="text-[11px] font-mono text-[#566782]">
                (~{calculatedFails} failed orders)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#182234] p-2.5 rounded-[8px] border border-[#222F46]">
            <input
              type="range"
              min={10}
              max={50}
              step={5}
              value={failureRate}
              onChange={(e) => setFailureRate(parseInt(e.target.value))}
              disabled={isRunning}
              className="w-full h-2 bg-[#101623] rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
            />
            <span className="text-[10px] font-mono text-[#94A3B8] min-w-[55px] text-right">
              {failureRate}% rate
            </span>
          </div>
        </div>

        {/* Execute Action CTA */}
        <div className="lg:col-span-3">
          <button
            type="button"
            className="w-full btn btn-primary py-2.5 text-[13px] flex items-center justify-center gap-2 shadow-lg shadow-[#38BDF8]/25"
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Execute Autonomous Batch</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Pipeline Stepper during Execution */}
      {activeBatchId && !isComplete && (
        <div className="pt-3 border-t border-[#1A2538] space-y-3">
          <div className="w-full h-2 bg-[#182234] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-[#38BDF8] via-[#10B981] to-[#38BDF8] transition-all duration-500 rounded-full"
              style={{
                width: isRunning ? '80%' : '100%',
                animation: isRunning ? 'pulse 1.2s infinite' : undefined,
              }}
            />
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-mono">
            <div className="bg-[#182234] border border-[#38BDF8]/40 p-2 rounded-[6px] text-[#38BDF8] font-bold">
              ✓ 1. Orders Seeded
            </div>
            <div className="bg-[#182234] border border-[#38BDF8]/40 p-2 rounded-[6px] text-[#38BDF8] font-bold">
              ✓ 2. Failures Flagged
            </div>
            <div className={`p-2 rounded-[6px] border ${isRunning ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-white animate-pulse font-bold' : 'bg-[#182234] border-[#222F46] text-[#566782]'}`}>
              3. AI Diagnosis (M3)
            </div>
            <div className={`p-2 rounded-[6px] border ${isComplete ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981] font-bold' : 'bg-[#182234] border-[#222F46] text-[#566782]'}`}>
              4. Links Dispatched
            </div>
          </div>
        </div>
      )}

      {/* Batch Performance Summary Report */}
      {report && isComplete && (
        <div className="mt-4 pt-4 border-t border-[#1A2538] bg-[#090D16]/50 rounded-[10px] p-4 border border-[#222F46] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1A2538] pb-3">
            <div className="flex items-center gap-2 text-[#10B981] font-bold text-[13px]">
              <CheckCircle2 size={16} />
              <span>Batch Execution Completed Successfully</span>
            </div>
            <span className="text-[11px] font-mono text-[#566782]">
              Batch ID: {report.batch_id}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
            <div className="bg-[#182234] p-2.5 rounded-[6px] border border-[#222F46]">
              <span className="text-[#94A3B8] text-[11px] block">Total Orders</span>
              <span className="font-mono text-[#F0F6FC] font-bold text-[15px]">
                {report.total_payments}
              </span>
            </div>
            <div className="bg-[#182234] p-2.5 rounded-[6px] border border-[#222F46]">
              <span className="text-[#94A3B8] text-[11px] block">Failures Intercepted</span>
              <span className="font-mono text-[#EF4444] font-bold text-[15px]">
                {report.total_failures}
              </span>
            </div>
            <div className="bg-[#182234] p-2.5 rounded-[6px] border border-[#10B981]/40">
              <span className="text-[#10B981] text-[11px] font-bold block">Autonomous Recoveries</span>
              <span className="font-mono text-[#10B981] font-bold text-[15px]">
                {report.recovered} / {report.total_failures}
              </span>
            </div>
            <div className="bg-[#182234] p-2.5 rounded-[6px] border border-[#38BDF8]/40">
              <span className="text-[#38BDF8] text-[11px] font-bold block">Recovery Conversion</span>
              <span className="font-mono text-[#38BDF8] font-bold text-[15px]">
                {report.recovery_rate}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
