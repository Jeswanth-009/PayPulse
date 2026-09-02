/* ── PaymentChart — Time-series of agent actions ── */

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { AuditLogEntry } from '../types';

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
      const date = new Date(entry.created_at + 'Z');
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
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header"><span className="card-title">Agent Activity Timeline</span></div>
      {chartData.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', fontSize: 13 }}>
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: '#484F58', fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: '#30363D' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#484F58', fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: '#21262D',
                border: '1px solid #30363D',
                borderRadius: 4,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}
              itemStyle={{ color: '#E6EDF3' }}
            />
            <Area
              type="monotone"
              dataKey="recovered"
              stackId="1"
              stroke="#3FB950"
              fill="rgba(63, 185, 80, 0.2)"
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="escalated"
              stackId="1"
              stroke="#D29922"
              fill="rgba(210, 153, 34, 0.2)"
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="exhausted"
              stackId="1"
              stroke="#F85149"
              fill="rgba(248, 81, 73, 0.2)"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
