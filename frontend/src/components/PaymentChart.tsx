/* ── PaymentChart v3.0 — Time-series of agent actions with smooth area gradients ── */

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { AuditLogEntry } from '../types';
import { Activity } from 'lucide-react';

interface PaymentChartProps {
  entries: AuditLogEntry[];
}

export default function PaymentChart({ entries }: PaymentChartProps) {
  const chartData = useMemo(() => {
    if (!entries.length) return [];

    // Group by minute
    const groups = new Map<string, { recovered: number; escalated: number; exhausted: number }>();

    for (const entry of entries) {
      if (!entry.created_at) continue;
      const cleanStr = entry.created_at.includes('T') ? entry.created_at : entry.created_at.replace(' ', 'T');
      const date = new Date(cleanStr.endsWith('Z') ? cleanStr : cleanStr + 'Z');
      if (isNaN(date.getTime())) continue;

      const key = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

      if (!groups.has(key)) {
        groups.set(key, { recovered: 0, escalated: 0, exhausted: 0 });
      }
      const g = groups.get(key)!;

      if (entry.outcome === 'dispatched' || entry.outcome === 'recovered') g.recovered++;
      else if (entry.outcome === 'escalated') g.escalated++;
      else if (entry.outcome === 'exhausted') g.exhausted++;
    }

    return Array.from(groups.entries())
      .map(([time, counts]) => ({ time, ...counts }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [entries]);

  return (
    <div className="bg-[#101623] border border-[#222F46] rounded-[12px] p-4.5 flex flex-col justify-between shadow-xl">
      <div className="flex items-center justify-between border-b border-[#1A2538] pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-[#38BDF8]" />
          <span className="text-[13px] font-bold text-[#F0F6FC]">
            Recovery Velocity Timeline
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-[#10B981]">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Recovered
          </span>
          <span className="flex items-center gap-1 text-[#F59E0B]">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Escalated
          </span>
          <span className="flex items-center gap-1 text-[#EF4444]">
            <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> Exhausted
          </span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-[180px] flex items-center justify-center text-[#566782] text-[12px] font-mono">
          No live stream activity recorded yet. Run a batch to populate velocity data.
        </div>
      ) : (
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="escGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="exhGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
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
              />
              <Area
                type="monotone"
                dataKey="recovered"
                stackId="1"
                stroke="#10B981"
                fill="url(#recGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="escalated"
                stackId="1"
                stroke="#F59E0B"
                fill="url(#escGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="exhausted"
                stackId="1"
                stroke="#EF4444"
                fill="url(#exhGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
