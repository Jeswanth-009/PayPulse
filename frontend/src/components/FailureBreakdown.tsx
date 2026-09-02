/* ── FailureBreakdown — Bar chart of failure types ── */

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import type { FailureBreakdown as FailureBreakdownType } from '../types';

interface FailureBreakdownProps {
  data: FailureBreakdownType;
}

const FAILURE_COLORS: Record<string, string> = {
  SOFT: '#58A6FF',
  HARD: '#F85149',
  UPI_HANDOFF: '#D29922',
  SESSION_TIMEOUT: '#8B949E',
};

export default function FailureBreakdown({ data }: FailureBreakdownProps) {
  const chartData = [
    { name: 'SOFT', value: data.SOFT, color: FAILURE_COLORS.SOFT },
    { name: 'HARD', value: data.HARD, color: FAILURE_COLORS.HARD },
    { name: 'UPI_HANDOFF', value: data.UPI_HANDOFF, color: FAILURE_COLORS.UPI_HANDOFF },
    { name: 'TIMEOUT', value: data.SESSION_TIMEOUT, color: FAILURE_COLORS.SESSION_TIMEOUT },
  ];

  const hasData = chartData.some(d => d.value > 0);

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header"><span className="card-title">Failure Types</span></div>
      {!hasData ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', fontSize: 13 }}>
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="name"
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
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
