/* ── TypeScript types matching backend Pydantic models ── */

export interface Payment {
  id: number;
  payment_id: string;
  order_id: string;
  batch_id: string | null;
  amount_paise: number;
  currency: string;
  method: string | null;
  status: string;
  error_code: string | null;
  error_description: string | null;
  error_source: string | null;
  attempts: number;
  recovery_attempts: number;
  failure_type: string | null;
  customer_email: string | null;
  customer_contact: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: number;
  payment_id: string;
  order_id: string;
  event_type: string;
  failure_type: string | null;
  confidence: number | null;
  llm_reasoning: string | null;
  action_taken: string | null;
  action_payload: Record<string, unknown> | string | null;
  razorpay_response: Record<string, unknown> | string | null;
  recovery_attempt_number: number | null;
  outcome: string | null;
  amount_paise: number | null;
  created_at: string;
}

export interface PaymentListResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditListResponse {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface AgentStatus {
  is_running: boolean;
  last_run_at: string | null;
  queue_size: number;
  total_processed: number;
  current_batch_id: string | null;
  uptime_seconds: number;
  poll_interval_seconds?: number;
}

export interface BatchRunRequest {
  count: number;
  failure_rate: number;
}

export interface FailureBreakdown {
  SOFT: number;
  HARD: number;
  UPI_HANDOFF: number;
  SESSION_TIMEOUT: number;
}

export interface BatchReport {
  batch_id: string;
  total_payments: number;
  total_failures: number;
  recovery_attempted: number;
  recovered: number;
  escalated: number;
  exhausted: number;
  recovery_rate: string;
  money_at_risk_paise: number;
  money_recovered_paise: number;
  failure_breakdown: FailureBreakdown;
  false_positive_count: number;
  exceptions: unknown[];
  status: string;
  created_at: string | null;
  completed_at: string | null;
}

export interface BatchListResponse {
  batches: BatchRecord[];
  total: number;
}

export interface BatchRecord {
  batch_id: string;
  total_payments: number;
  total_failures: number;
  failure_rate: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export type OutcomeType = 'recovered' | 'dispatched' | 'escalated' | 'exhausted' | 'pending' | 'error';

export function getOutcomeBadgeClass(outcome: string | null): string {
  switch (outcome) {
    case 'recovered':
    case 'dispatched':
      return 'badge-dispatched';
    case 'escalated':
      return 'badge-escalated';
    case 'exhausted':
      return 'badge-exhausted';
    case 'pending':
      return 'badge-pending';
    case 'error':
      return 'badge-error';
    default:
      return 'badge-pending';
  }
}

export function getOutcomeStatusClass(outcome: string | null): string {
  switch (outcome) {
    case 'recovered':
    case 'dispatched':
      return 'status-recovered';
    case 'escalated':
      return 'status-escalated';
    case 'exhausted':
      return 'status-exhausted';
    case 'pending':
      return 'status-progress';
    default:
      return 'status-stopped';
  }
}

export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPaiseShort(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`;
  return `₹${rupees.toLocaleString('en-IN')}`;
}
