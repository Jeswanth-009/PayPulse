/* ── API Client + React Query hooks ── */

import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  PaymentListResponse,
  AuditListResponse,
  AgentStatus,
  BatchReport,
  BatchRunRequest,
  BatchListResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

/* ── Payments ── */
export function usePayments(params?: {
  status?: string;
  failure_type?: string;
  batch_id?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery<PaymentListResponse>({
    queryKey: ['payments', params],
    queryFn: () => api.get('/api/v1/payments', { params }).then(r => r.data),
    refetchInterval: 5000,
  });
}

export function usePayment(paymentId: string) {
  return useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => api.get(`/api/v1/payments/${paymentId}`).then(r => r.data),
    enabled: !!paymentId,
  });
}

/* ── Agent ── */
export function useAgentStatus() {
  return useQuery<AgentStatus>({
    queryKey: ['agentStatus'],
    queryFn: () => api.get('/api/v1/agent/status').then(r => r.data),
    refetchInterval: 3000,
  });
}

export function useAgentRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/api/v1/agent/run').then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentStatus'] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

/* ── Batch ── */
export function useBatchRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: BatchRunRequest) =>
      api.post('/api/v1/batch/run', req).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['agentStatus'] });
    },
  });
}

export function useBatchReport(batchId: string | null) {
  return useQuery<BatchReport>({
    queryKey: ['batchReport', batchId],
    queryFn: () => api.get(`/api/v1/batch/${batchId}/report`).then(r => r.data),
    enabled: !!batchId,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'completed' ? false : 3000;
    },
  });
}

export function useBatches() {
  return useQuery<BatchListResponse>({
    queryKey: ['batches'],
    queryFn: () => api.get('/api/v1/batch').then(r => r.data),
    refetchInterval: 5000,
  });
}

/* ── Audit ── */
export function useAuditLog(params?: {
  payment_id?: string;
  event_type?: string;
  outcome?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery<AuditListResponse>({
    queryKey: ['audit', params],
    queryFn: () => api.get('/api/v1/audit', { params }).then(r => r.data),
    refetchInterval: 5000,
  });
}

export function useAuditFeed() {
  return useQuery<AuditListResponse>({
    queryKey: ['auditFeed'],
    queryFn: () =>
      api
        .get('/api/v1/audit', {
          params: { event_type: 'action_taken', limit: 50, page: 1 },
        })
        .then(r => r.data),
    refetchInterval: 3000,
  });
}

export function exportAuditCSV() {
  window.open(`${API_BASE}/api/v1/audit/export`, '_blank');
}
