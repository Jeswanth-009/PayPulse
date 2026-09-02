import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { usePayment, useRecoveryMessage, useSimulatePay } from '../api/client';
import { PhoneSimulator } from './PhoneSimulator';

interface PaymentDetailDrawerProps {
  paymentId: string | null;
  initialTab?: 'classification' | 'recovery' | 'message';
  onClose: () => void;
}

export const PaymentDetailDrawer: React.FC<PaymentDetailDrawerProps> = ({
  paymentId,
  initialTab = 'message',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'classification' | 'recovery' | 'message'>(initialTab);
  const [copiedLink, setCopiedLink] = useState(false);
  const simulatePay = useSimulatePay();

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, paymentId]);

  const { data: detailData, isLoading: isPaymentLoading } = usePayment(paymentId || '');
  const { data: messageData, isLoading: isMessageLoading } = useRecoveryMessage(paymentId);

  if (!paymentId) return null;

  const payment = detailData?.payment;
  const auditEntries = detailData?.audit_entries || [];

  // Find classification and action audit records
  const classifiedEntry = auditEntries.find((e: any) => e.event_type === 'classified');
  const actionEntry = auditEntries.find((e: any) => e.event_type === 'action_taken');

  const failureType = payment?.failure_type || classifiedEntry?.failure_type || 'UNKNOWN';
  const confidence = classifiedEntry?.confidence ? Math.round(classifiedEntry.confidence * 100) : 90;
  const actionTaken = actionEntry?.action_taken || classifiedEntry?.action_taken || 'PENDING';
  const outcome = actionEntry?.outcome || 'pending';
  const reasoning = classifiedEntry?.llm_reasoning || actionEntry?.llm_reasoning || 'No reasoning available';

  // Razorpay response data from actionEntry
  let razorpayResponse = actionEntry?.razorpay_response;
  if (typeof razorpayResponse === 'string') {
    try {
      razorpayResponse = JSON.parse(razorpayResponse);
    } catch {
      // keep raw string
    }
  }

  let actionPayload = actionEntry?.action_payload;
  if (typeof actionPayload === 'string') {
    try {
      actionPayload = JSON.parse(actionPayload);
    } catch {
      // keep raw
    }
  }

  const paymentLinkUrl =
    razorpayResponse?.short_url ||
    messageData?.payment_link_url ||
    (actionPayload?.notes?.original_payment_id ? `https://rzp.io/rzp/ret_${paymentId.slice(-8)}` : null);

  const handleCopyLink = () => {
    if (paymentLinkUrl) {
      navigator.clipboard.writeText(paymentLinkUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    }
  };

  const getFailureBadgeColor = (type: string) => {
    switch (type) {
      case 'SOFT':
        return 'bg-[#58A6FF]/15 text-[#58A6FF] border-[#58A6FF]/30';
      case 'HARD':
        return 'bg-[#F85149]/15 text-[#F85149] border-[#F85149]/30';
      case 'UPI_HANDOFF':
        return 'bg-[#D29922]/15 text-[#D29922] border-[#D29922]/30';
      case 'SESSION_TIMEOUT':
        return 'bg-[#A371F7]/15 text-[#A371F7] border-[#A371F7]/30';
      default:
        return 'bg-[#8B949E]/15 text-[#8B949E] border-[#8B949E]/30';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0D1117] backdrop-blur-xs"
        />

        {/* Drawer Container */}
        <motion.div
          initial={{ x: 480 }}
          animate={{ x: 0 }}
          exit={{ x: 480 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed right-0 top-0 h-screen w-full max-w-[480px] bg-[#161B22] border-l border-[#30363D] shadow-2xl flex flex-col z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#30363D]">
            <div className="flex items-center gap-2">
              <span className="text-[#E6EDF3] text-[16px] font-semibold">Payment Inspector</span>
              <span className="text-[#8B949E] text-[12px] font-mono">#{paymentId}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[#8B949E] hover:text-[#E6EDF3] p-1 rounded-[4px] hover:bg-[#21262D] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-[#161B22] border-b border-[#30363D] px-4">
            <button
              type="button"
              onClick={() => setActiveTab('classification')}
              className={`py-3 px-3 text-[13px] font-medium border-b-2 transition-colors ${
                activeTab === 'classification'
                  ? 'text-[#E6EDF3] border-[#3395FF]'
                  : 'text-[#8B949E] border-transparent hover:text-[#E6EDF3]'
              }`}
            >
              Classification
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('recovery')}
              className={`py-3 px-3 text-[13px] font-medium border-b-2 transition-colors ${
                activeTab === 'recovery'
                  ? 'text-[#E6EDF3] border-[#3395FF]'
                  : 'text-[#8B949E] border-transparent hover:text-[#E6EDF3]'
              }`}
            >
              Recovery Action
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('message')}
              className={`py-3 px-3 text-[13px] font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'message'
                  ? 'text-[#E6EDF3] border-[#3395FF]'
                  : 'text-[#8B949E] border-transparent hover:text-[#E6EDF3]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Customer Experience</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isPaymentLoading ? (
              <div className="space-y-3">
                <div className="h-24 bg-[#0D1117] rounded-[6px] animate-pulse" />
                <div className="h-32 bg-[#0D1117] rounded-[6px] animate-pulse" />
              </div>
            ) : (
              <>
                {/* TAB 1: CLASSIFICATION */}
                {activeTab === 'classification' && (
                  <div className="space-y-4">
                    {/* Summary Card */}
                    <div className="bg-[#0D1117] border border-[#30363D] rounded-[6px] p-4 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[#8B949E] text-[11px] block">Failure Type</span>
                          <span
                            className={`inline-block mt-1 text-[11px] font-mono px-2 py-0.5 rounded-[4px] border font-semibold ${getFailureBadgeColor(
                              failureType
                            )}`}
                          >
                            {failureType}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#8B949E] text-[11px] block">Confidence</span>
                          <span className="text-[#58A6FF] text-[15px] font-mono font-semibold block mt-0.5">
                            {confidence}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[#8B949E] text-[11px] block">Action</span>
                          <span className="text-[#E6EDF3] text-[12px] font-mono font-medium block mt-1">
                            {actionTaken}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* LLM Reasoning Block */}
                    <div>
                      <span className="text-[#8B949E] text-[11px] font-medium uppercase tracking-wider block mb-1.5">
                        AI Reasoning & Hypothesis
                      </span>
                      <div className="bg-[#21262D] border-l-2 border-[#3395FF] p-3.5 rounded-[0_6px_6px_0]">
                        <p className="text-[#8B949E] italic text-[13px] leading-relaxed">
                          &quot;{reasoning}&quot;
                        </p>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div>
                      <span className="text-[#8B949E] text-[11px] font-medium uppercase tracking-wider block mb-2">
                        Payment Attributes
                      </span>
                      <div className="bg-[#0D1117] border border-[#30363D] rounded-[6px] divide-y divide-[#21262D] text-[12px]">
                        <div className="flex justify-between p-2.5">
                          <span className="text-[#484F58]">Payment ID</span>
                          <span className="text-[#E6EDF3] font-mono">{payment?.payment_id}</span>
                        </div>
                        <div className="flex justify-between p-2.5">
                          <span className="text-[#484F58]">Order ID</span>
                          <span className="text-[#E6EDF3] font-mono">{payment?.order_id}</span>
                        </div>
                        <div className="flex justify-between p-2.5">
                          <span className="text-[#484F58]">Amount</span>
                          <span className="text-[#3FB950] font-mono font-semibold">
                            ₹{((payment?.amount_paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between p-2.5">
                          <span className="text-[#484F58]">Method</span>
                          <span className="text-[#E6EDF3] uppercase font-mono">{payment?.method || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between p-2.5">
                          <span className="text-[#484F58]">Error Code</span>
                          <span className="text-[#F85149] font-mono">{payment?.error_code || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between p-2.5">
                          <span className="text-[#484F58]">Customer</span>
                          <span className="text-[#E6EDF3]">
                            {payment?.customer_name || payment?.customer_email || 'Customer'}
                          </span>
                        </div>
                        <div className="flex justify-between p-2.5">
                          <span className="text-[#484F58]">Attempts</span>
                          <span className="text-[#E6EDF3] font-mono">{payment?.attempts ?? 1}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: RECOVERY */}
                {activeTab === 'recovery' && (
                  <div className="space-y-4">
                    {outcome === 'dispatched' && (
                      <div className="space-y-4">
                        <div className="bg-[#0D1117] border border-[#30363D] rounded-[6px] p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[#8B949E] text-[12px]">Recovery Status</span>
                            <span className="bg-[#3FB950]/15 text-[#3FB950] border border-[#3FB950]/30 text-[11px] font-mono px-2 py-0.5 rounded-[4px] uppercase font-semibold">
                              Link Dispatched
                            </span>
                          </div>

                          {paymentLinkUrl && (
                            <div>
                              <span className="text-[#8B949E] text-[11px] block mb-1">
                                Razorpay Payment Link
                              </span>
                              <div className="flex items-center gap-2 bg-[#161B22] border border-[#30363D] rounded-[4px] p-2">
                                <span className="text-[#58A6FF] font-mono text-[12px] truncate flex-1">
                                  {paymentLinkUrl}
                                </span>
                                <button
                                  type="button"
                                  onClick={handleCopyLink}
                                  className="text-[#8B949E] hover:text-[#E6EDF3] p-1 transition-colors"
                                >
                                  {copiedLink ? (
                                    <Check className="w-4 h-4 text-[#3FB950]" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                                <a
                                  href={paymentLinkUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#8B949E] hover:text-[#E6EDF3] p-1"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>

                              {/* Simulate Payment Resolution Button */}
                              <div className="mt-3">
                                <button
                                  type="button"
                                  disabled={simulatePay.isPending}
                                  onClick={() => simulatePay.mutate(paymentId)}
                                  className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[12px] py-2 px-3 rounded-[4px] flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#10B981]/20 cursor-pointer"
                                >
                                  <Zap className="w-3.5 h-3.5" />
                                  <span>
                                    {simulatePay.isPending
                                      ? 'Capturing Payment...'
                                      : '⚡ Simulate Customer Paying Link (Mark Recovered)'}
                                  </span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Razorpay API Logs */}
                        <div className="space-y-2">
                          <span className="text-[#8B949E] text-[11px] font-medium uppercase tracking-wider block">
                            Razorpay API Payload
                          </span>
                          <div className="bg-[#0D1117] border border-[#30363D] rounded-[4px] p-3 overflow-x-auto">
                            <pre className="text-[#8B949E] text-[11px] font-mono leading-tight">
                              {JSON.stringify(actionPayload || {}, null, 2)}
                            </pre>
                          </div>
                        </div>

                        {razorpayResponse && (
                          <div className="space-y-2">
                            <span className="text-[#8B949E] text-[11px] font-medium uppercase tracking-wider block">
                              Razorpay API Response
                            </span>
                            <div className="bg-[#0D1117] border border-[#30363D] rounded-[4px] p-3 overflow-x-auto max-h-[220px]">
                              <pre className="text-[#8B949E] text-[11px] font-mono leading-tight">
                                {JSON.stringify(razorpayResponse, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {outcome === 'escalated' && (
                      <div className="bg-[#0D1117] border border-[#D29922]/30 rounded-[6px] p-5 text-center space-y-3">
                        <AlertTriangle className="w-8 h-8 text-[#D29922] mx-auto" />
                        <h4 className="text-[#E6EDF3] text-[14px] font-semibold">Flagged for Human Review</h4>
                        <p className="text-[#8B949E] text-[12px] leading-relaxed max-w-[320px] mx-auto">
                          Order exceeded the escalation threshold. The autonomous agent withheld automated
                          link creation to safeguard merchant margin.
                        </p>
                      </div>
                    )}

                    {(outcome === 'exhausted' || outcome === 'stop') && (
                      <div className="bg-[#0D1117] border border-[#30363D] rounded-[6px] p-5 text-center space-y-3">
                        <ShieldCheck className="w-8 h-8 text-[#8B949E] mx-auto" />
                        <h4 className="text-[#E6EDF3] text-[14px] font-semibold">Stopping Rule Enforced</h4>
                        <p className="text-[#8B949E] text-[12px] leading-relaxed max-w-[320px] mx-auto">
                          Stopping rule triggered. This payment had reached the maximum retry limit or is
                          unrecoverable. No further action taken.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: CUSTOMER MESSAGE (PHONE SIMULATOR) */}
                {activeTab === 'message' && (
                  <div>
                    {isMessageLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center space-y-3">
                        <div className="w-[280px] h-[460px] rounded-[36px] border-2 border-[#30363D] bg-[#0D1117] animate-pulse" />
                        <span className="text-[#8B949E] text-[12px]">Loading simulator...</span>
                      </div>
                    ) : messageData ? (
                      <PhoneSimulator messageData={messageData} />
                    ) : (
                      <div className="py-16 text-center space-y-2">
                        <MessageSquare className="w-8 h-8 text-[#484F58] mx-auto" />
                        <p className="text-[#8B949E] text-[13px]">
                          No customer message generated
                        </p>
                        <p className="text-[#484F58] text-[11px] max-w-[280px] mx-auto">
                          STOP and ESCALATE actions do not send automated recovery messages to customers.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
