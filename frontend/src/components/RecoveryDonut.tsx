/* ── RecoveryDonut — Donut chart of recovered / escalated / exhausted ── */

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface RecoveryDonutProps {
  recovered: number;
  escalated: number;
  exhausted: number;
}

const COLORS = {
  recovered: '#3FB950',
  escalated: '#D29922',
  exhausted: '#F85149',
};

export default function RecoveryDonut({ recovered, escalated, exhausted }: RecoveryDonutProps) {
  const total = recovered + escalated + exhausted;

  const data = [
    { name: 'Recovered', value: recovered, color: COLORS.recovered },
    { name: 'Escalated', value: escalated, color: COLORS.escalated },
    { name: 'Exhausted', value: exhausted, color: COLORS.exhausted },
  ].filter(d => d.value > 0);

  if (total === 0) {
    return (
      <div className="card" style={{ height: '100%' }}>
        <div className="card-header"><span className="card-title">Recovery Outcomes</span></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', fontSize: 13 }}>
          No data yet
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header"><span className="card-title">Recovery Outcomes</span></div>
      <div style={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
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
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {total}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>total</div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
        {data.map((d) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
            {d.name} ({d.value})
          </div>
        ))}
      </div>
    </div>
  );
}
