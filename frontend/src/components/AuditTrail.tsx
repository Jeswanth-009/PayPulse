/* ── AuditTrail — Full-width filterable table with row expansion ── */

import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';
import { useAuditLog, exportAuditCSV } from '../api/client';
import { formatPaise, getOutcomeBadgeClass } from '../types';

export default function AuditTrail() {
  const [page, setPage] = useState(1);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [paymentIdFilter, setPaymentIdFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading } = useAuditLog({
    event_type: eventTypeFilter || undefined,
    outcome: outcomeFilter || undefined,
    payment_id: paymentIdFilter || undefined,
    page,
    limit: 50,
  });

  const entries = data?.entries || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 50);

  return (
    <div>
      {/* Filter bar */}
      <div className="filter-bar">
        <input
          className="input"
          placeholder="Filter by payment ID..."
          value={paymentIdFilter}
          onChange={(e) => { setPaymentIdFilter(e.target.value); setPage(1); }}
          style={{ maxWidth: 200, fontFamily: 'var(--font-mono)', fontSize: 12 }}
        />
        <select
          className="select"
          value={eventTypeFilter}
          onChange={(e) => { setEventTypeFilter(e.target.value); setPage(1); }}
        >
          <option value="">All events</option>
          <option value="failure_detected">Failure Detected</option>
          <option value="classified">Classified</option>
          <option value="action_taken">Action Taken</option>
          <option value="outcome">Outcome</option>
        </select>
        <select
          className="select"
          value={outcomeFilter}
          onChange={(e) => { setOutcomeFilter(e.target.value); setPage(1); }}
        >
          <option value="">All outcomes</option>
          <option value="dispatched">Dispatched</option>
          <option value="recovered">Recovered</option>
          <option value="escalated">Escalated</option>
          <option value="exhausted">Exhausted</option>
          <option value="pending">Pending</option>
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {total} entries
        </span>
        <button className="btn btn-sm" onClick={exportAuditCSV}>
          <Download size={12} />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 28 }} />
                <th>Timestamp</th>
                <th>Payment ID</th>
                <th>Order ID</th>
                <th>Amount</th>
                <th>Event</th>
                <th>Failure Type</th>
                <th>Confidence</th>
                <th>Action</th>
                <th>Outcome</th>
                <th>Attempt</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    Loading...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    No audit entries found
                  </td>
                </tr>
              ) : entries.map((entry) => (
                <>
                  <tr
                    key={entry.id}
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    style={{ cursor: 'pointer' }}
                    className={expandedId === entry.id ? 'expanded-row' : ''}
                  >
                    <td>
                      {expandedId === entry.id
                        ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                        : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {entry.created_at
                        ? format(new Date(entry.created_at + 'Z'), 'MMM dd HH:mm:ss')
                        : '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{entry.payment_id}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{entry.order_id}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {entry.amount_paise ? formatPaise(entry.amount_paise) : '—'}
                    </td>
                    <td>
                      <span className="badge badge-pending" style={{ fontSize: 10 }}>
                        {entry.event_type}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {entry.failure_type || '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {entry.confidence != null ? entry.confidence.toFixed(2) : '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>
                      {entry.action_taken || '—'}
                    </td>
                    <td>
                      {entry.outcome ? (
                        <span className={`badge ${getOutcomeBadgeClass(entry.outcome)}`}>
                          {entry.outcome.toUpperCase()}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'center' }}>
                      {entry.recovery_attempt_number ?? '—'}
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {expandedId === entry.id && (
                    <tr key={`${entry.id}-detail`}>
                      <td colSpan={11} style={{ padding: 0 }}>
                        <div className="expanded-detail">
                          {entry.llm_reasoning && (
                            <div className="detail-section">
                              <div className="detail-label">LLM Reasoning</div>
                              <div className="detail-code">{entry.llm_reasoning}</div>
                            </div>
                          )}
                          {entry.action_payload && (
                            <div className="detail-section">
                              <div className="detail-label">Action Payload (sent to Razorpay)</div>
                              <div className="detail-code">
                                {typeof entry.action_payload === 'string'
                                  ? entry.action_payload
                                  : JSON.stringify(entry.action_payload, null, 2)}
                              </div>
                            </div>
                          )}
                          {entry.razorpay_response && (
                            <div className="detail-section">
                              <div className="detail-label">Razorpay API Response</div>
                              <div className="detail-code">
                                {typeof entry.razorpay_response === 'string'
                                  ? entry.razorpay_response
                                  : JSON.stringify(entry.razorpay_response, null, 2)}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
            padding: '12px 16px', borderTop: '1px solid var(--border)',
          }}>
            <button
              className="btn btn-sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {page} / {totalPages}
            </span>
            <button
              className="btn btn-sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
