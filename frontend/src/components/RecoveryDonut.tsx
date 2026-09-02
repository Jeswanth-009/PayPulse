/* ── RecoveryDonut v3.0 — Donut chart of recovered / escalated / exhausted outcomes ── */

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

interface RecoveryDonutProps {
  recovered: number;
  escalated: number;
  exhausted: number;
}

const COLORS = {
  recovered: '#10B981',
  escalated: '#F59E0B',
  exhausted: '#EF4444',
};

export default function RecoveryDonut({ recovered, escalated, exhausted }: RecoveryDonutProps) {
  const total = recovered + escalated + exhausted;

  const data = [
    { name: 'Recovered', value: recovered, color: COLORS.recovered },
    { name: 'Escalated', value: escalated, color: COLORS.escalated },
    { name: 'Exhausted', value: exhausted, color: COLORS.exhausted },
  ].filter((d) => d.value > 0);

  return (
    <div className="bg-[#101623] border border-[#222F46] rounded-[12px] p-4 flex flex-col justify-between shadow-xl">
      <div className="flex items-center justify-between border-b border-[#1A2538] pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <PieIcon size={14} className="text-[#10B981]" />
          <span className="text-[13px] font-bold text-[#F0F6FC]">Resolution Outcomes</span>
        </div>
        <span className="text-[10px] font-mono text-[#566782]">
          {total} Total
        </span>
      </div>

      {total === 0 ? (
        <div className="h-[150px] flex items-center justify-center text-[#566782] text-[11px] font-mono">
          No recovery outcomes yet
        </div>
      ) : (
        <div className="h-[150px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
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
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Centered Total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[16px] font-mono font-extrabold text-[#F0F6FC] leading-none">
              {total}
            </span>
            <span className="text-[9px] font-mono text-[#94A3B8] mt-0.5">cases</span>
          </div>
        </div>
      )}
    </div>
  );
}
