/* ── BatchRunner — Run batch with progress + inline report ── */

import { useState } from 'react';
import { Play, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useBatchRun, useBatchReport, useAgentStatus } from '../api/client';
import { formatPaise } from '../types';

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

  return (
    <div className="card relative overflow-hidden">
      <div className="card-header mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#38BDF8]" />
          <span className="card-title text-[13px] font-bold text-[#F0F6FC]">
            Autonomous Batch Recovery Engine
          </span>
        </div>
        {activeBatchId && (
          <span className="text-[11px] font-mono text-[#94A3B8] bg-[#182234] px-2 py-0.5 rounded-[4px] border border-[#222F46]">
            Batch: {activeBatchId}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Order Count Input + Quick Select Pills */}
        <div className="md:col-span-4 space-y-1.5">
          <div className="flex justify-between items-center text-[12px]">
            <label className="text-[#94A3B8] font-medium">Orders to Seed</label>
            <span className="font-mono text-[#F0F6FC] font-bold">{count} orders</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[10, 25, 50, 100].map((c) => (
              <button
                key={c}
                type="button"
                disabled={isRunning}
                onClick={() => setCount(c)}
                className={`flex-1 py-1.5 text-[11px] font-mono font-medium rounded-[4px] border transition-all ${
                  count === c
                    ? 'bg-[#38BDF8] border-[#38BDF8] text-white'
                    : 'bg-[#182234] border-[#222F46] text-[#94A3B8] hover:text-[#F0F6FC]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Failure Rate Slider + Preset Chips */}
        <div className="md:col-span-5 space-y-1.5">
          <div className="flex justify-between items-center text-[12px]">
            <label className="text-[#94A3B8] font-medium">Simulated Failure Rate</label>
            <span className="font-mono text-[#F59E0B] font-bold">{failureRate}% failures</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={10}
              max={50}
              step={5}
              value={failureRate}
              onChange={(e) => setFailureRate(parseInt(e.target.value))}
              disabled={isRunning}
              className="w-full h-2 bg-[#182234] rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
            />
            <span className="text-[11px] font-mono text-[#566782] min-w-[36px]">
              {Math.round((count * failureRate) / 100)} fails
            </span>
          </div>
        </div>

        {/* Run Batch Action Button */}
        <div className="md:col-span-3">
          <button
            type="button"
            className="w-full btn btn-primary py-2 text-[13px] flex items-center justify-center gap-2"
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Agent Running...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Execute Batch</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dynamic Animated Progress Bar */}
      {activeBatchId && !isComplete && (
        <div className="mt-4 pt-3 border-t border-[#1A2538] space-y-1.5">
          <div className="w-full h-2 bg-[#182234] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-[#38BDF8] to-[#10B981] transition-all duration-500 rounded-full"
              style={{
                width: isRunning ? '75%' : '100%',
                animation: isRunning ? 'pulse 1.5s infinite' : undefined,
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-[#94A3B8] font-mono">
            <span>
              {agentStatus?.is_running
                ? `Agent classifying & minting Razorpay links... (${agentStatus.queue_size || 0} left in queue)`
                : 'Seeding test orders in Razorpay...'}
            </span>
            <span className="text-[#38BDF8] animate-pulse">Live Telemetry Active</span>
          </div>
        </div>
      )}

      {/* Completed Batch Inline Summary Report */}
      {report && isComplete && (
        <div className="mt-4 pt-4 border-t border-[#222F46] bg-[#090D16]/60 -mx-4 -mb-4 p-4 rounded-b-[10px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              <span className="text-[#F0F6FC] text-[13px] font-bold">
                Batch #{report.batch_id} Complete
              </span>
            </div>
            <span className="text-[#10B981] font-mono font-bold text-[14px]">
              {report.recovery_rate} Recovery Rate
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="bg-[#101623] border border-[#222F46] p-2.5 rounded-[6px]">
              <div className="text-[18px] font-mono font-bold text-[#10B981]">
                {report.recovered}
              </div>
              <div className="text-[10px] text-[#94A3B8] uppercase">Recovered</div>
            </div>
            <div className="bg-[#101623] border border-[#222F46] p-2.5 rounded-[6px]">
              <div className="text-[18px] font-mono font-bold text-[#F59E0B]">
                {report.escalated}
              </div>
              <div className="text-[10px] text-[#94A3B8] uppercase">Escalated</div>
            </div>
            <div className="bg-[#101623] border border-[#222F46] p-2.5 rounded-[6px]">
              <div className="text-[18px] font-mono font-bold text-[#EF4444]">
                {report.exhausted}
              </div>
              <div className="text-[10px] text-[#94A3B8] uppercase">Exhausted</div>
            </div>
            <div className="bg-[#101623] border border-[#222F46] p-2.5 rounded-[6px]">
              <div className="text-[16px] font-mono font-bold text-[#38BDF8]">
                {formatPaise(report.money_recovered_paise)}
              </div>
              <div className="text-[10px] text-[#94A3B8] uppercase">Money Saved</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
