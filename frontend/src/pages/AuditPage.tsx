/* ── AuditPage — Full audit trail, filterable, exportable ── */

import AuditTrail from '../components/AuditTrail';

export default function AuditPage() {
  return (
    <div>
      <h1 style={{
        fontSize: 20,
        fontWeight: 600,
        marginBottom: 16,
        color: 'var(--text-primary)',
      }}>
        Audit Trail
      </h1>
      <p style={{
        fontSize: 13,
        color: 'var(--text-muted)',
        marginBottom: 20,
      }}>
        Complete log of every agent decision — signal → classification → action → outcome.
      </p>
      <AuditTrail />
    </div>
  );
}
