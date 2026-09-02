/* ── FailureBreakdown v3.0 — Modern Bar chart of failure types with clean layout ── */

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import type { FailureBreakdown as FailureBreakdownType } from '../types';
import { Layers } from 'lucide-react';

interface FailureBreakdownProps {
  data: FailureBreakdownType;
}

const FAILURE_COLORS: Record<string, string> = {
  SOFT: '#38BDF8',
  HARD: '#EF4444',
  UPI_HANDOFF: '#F59E0B',
  SESSION_TIMEOUT: '#94A3B8',
};

export default function FailureBreakdown({ data }: FailureBreakdownProps) {
  const chartData = [
    { name: 'SOFT', value: data.SOFT || 0, color: FAILURE_COLORS.SOFT },
    { name: 'HARD', value: data.HARD || 0, color: FAILURE_COLORS.HARD },
    { name: 'UPI', value: data.UPI_HANDOFF || 0, color: FAILURE_COLORS.UPI_HANDOFF },
    { name: 'TIMEOUT', value: data.SESSION_TIMEOUT || 0, color: FAILURE_COLORS.SESSION_TIMEOUT },
  ];

  const hasData = chartData.some((d) => d.value > 0);

  return (
    <div className="bg-[#101623] border border-[#222F46] rounded-[12px] p-4 flex flex-col justify-between shadow-xl">
      <div className="flex items-center justify-between border-b border-[#1A2538] pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-[#38BDF8]" />
          <span className="text-[13px] font-bold text-[#F0F6FC]">Failure Categories</span>
        </div>
        <span className="text-[10px] font-mono text-[#566782]">Root Causes</span>
      </div>

      {!hasData ? (
        <div className="h-[150px] flex items-center justify-center text-[#566782] text-[11px] font-mono">
          No failures recorded
        </div>
      ) : (
        <div className="h-[150px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#566782', fontFamily: 'var(--font-mono)' }}
                axisLine={{ stroke: '#222F46' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#566782', fontFamily: 'var(--font-mono)' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#101623',
                  border: '1px solid #222F46',
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}
                itemStyle={{ color: '#F0F6FC' }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
