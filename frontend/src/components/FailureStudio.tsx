import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical,
  X,
  Loader2,
  Copy,
  Check,
  Zap,
  CreditCard,
  Smartphone,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { useStudioFire, type StudioFireResponse } from '../api/client';

interface FailureStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPayment?: (paymentId: string) => void;
}

const PRESET_CARDS = [
  {
    key: 'bank_timeout',
    label: 'Bank Timeout',
    amount_rupees: 2499,
    method: 'netbanking',
    icon: Clock,
    color: '#58A6FF',
    description: 'Payment processing failed due to bank server timeout.',
  },
  {
    key: 'upi_dropped',
    label: 'UPI PSP Dropped',
    amount_rupees: 799,
    method: 'upi',
    icon: Smartphone,
    color: '#D29922',
    description: 'UPI collect request expired without customer response.',
  },
  {
    key: 'hard_decline',
    label: 'Card Declined',
    amount_rupees: 4999,
    method: 'card',
    icon: CreditCard,
    color: '#F85149',
    description: 'Payment declined by card issuer. Use alternate card.',
  },
  {
    key: 'otp_timeout_highvalue',
    label: 'OTP Timeout (High)',
    amount_rupees: 15000,
    method: 'card',
    icon: Zap,
    color: '#8B949E',
    description: 'High-value OTP expired. Triggers escalation guardrail.',
  },
];

export const FailureStudio: React.FC<FailureStudioProps> = ({
  isOpen,
  onClose,
  onSelectPayment,
}) => {
  const fireMutation = useStudioFire();
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, StudioFireResponse>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Custom mode state
  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('2499');
  const [customMethod, setCustomMethod] = useState('upi');
  const [customErrorDesc, setCustomErrorDesc] = useState('Payment timed out on customer bank app');
  const [customCustomerName, setCustomCustomerName] = useState('Rahul Verma');
  const [customErrorCode, setCustomErrorCode] = useState('BAD_REQUEST_ERROR');
  const [customResult, setCustomResult] = useState<StudioFireResponse | null>(null);

  const handleFirePreset = async (key: string) => {
    try {
      setActivePreset(key);
      setErrors((prev) => ({ ...prev, [key]: '' }));
      const res = await fireMutation.mutateAsync({ preset: key });
      setResults((prev) => ({ ...prev, [key]: res }));
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        [key]: err.response?.data?.detail || 'Execution failed. Check backend logs.',
      }));
    } finally {
      setActivePreset(null);
    }
  };

  const handleFireCustom = async () => {
    try {
      setActivePreset('custom');
      const res = await fireMutation.mutateAsync({
        custom: {
          amount_rupees: parseFloat(customAmount) || 1000,
          method: customMethod,
          error_code: customErrorCode,
          error_description: customErrorDesc,
          customer_name: customCustomerName,
          language_hint: 'hi',
        },
      });
      setCustomResult(res);
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        custom: err.response?.data?.detail || 'Custom execution failed.',
      }));
    } finally {
      setActivePreset(null);
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 1500);
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'dispatched':
        return 'bg-[#3FB950]/15 text-[#3FB950] border-[#3FB950]/30';
      case 'escalated':
        return 'bg-[#D29922]/15 text-[#D29922] border-[#D29922]/30';
      case 'exhausted':
        return 'bg-[#F85149]/15 text-[#F85149] border-[#F85149]/30';
      default:
        return 'bg-[#58A6FF]/15 text-[#58A6FF] border-[#58A6FF]/30';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0D1117] z-50 backdrop-blur-xs"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed right-0 top-0 h-screen w-full max-w-[420px] bg-[#161B22] border-l border-[#30363D] z-50 flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#30363D]">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-[#3395FF]" />
                <h2 className="text-[#E6EDF3] text-[16px] font-semibold">Failure Studio</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-[#8B949E] hover:text-[#E6EDF3] p-1 rounded-[4px] hover:bg-[#21262D] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Subtitle */}
            <div className="px-4 py-3 bg-[#0D1117]/60 border-b border-[#30363D]/60">
              <p className="text-[#8B949E] text-[12px] leading-relaxed">
                Fire any failure scenario directly through the full agent pipeline in real time.
              </p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Preset 2x2 Grid */}
              <div className="grid grid-cols-2 gap-3">
                {PRESET_CARDS.map((card) => {
                  const Icon = card.icon;
                  const error = errors[card.key];
                  const hasSucceeded = !!results[card.key];
                  const isFiring = activePreset === card.key;

                  return (
                    <div
                      key={card.key}
                      className={`bg-[#0D1117] border ${
                        hasSucceeded ? 'border-[#3FB950]/50' : 'border-[#30363D]'
                      } rounded-[6px] p-3 flex flex-col justify-between transition-colors hover:border-[#484F58]`}
                    >
                      <div>
                        {/* Top row */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: card.color }} />
                            <span className="text-[#E6EDF3] text-[12px] font-semibold truncate">
                              {card.label}
                            </span>
                          </div>
                          <span className="bg-[#21262D] text-[#8B949E] text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] shrink-0">
                            ₹{card.amount_rupees}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-[#8B949E] text-[11px] leading-snug line-clamp-2">
                          {card.description}
                        </p>
                      </div>

                      {/* Fire Button */}
                      <div className="mt-3">
                        <button
                          type="button"
                          disabled={isFiring || !!activePreset}
                          onClick={() => handleFirePreset(card.key)}
                          className="w-full bg-[#3395FF] hover:bg-[#2277CC] disabled:opacity-60 text-white text-[11px] font-medium py-1.5 px-2 rounded-[4px] flex items-center justify-center gap-1.5 transition-colors"
                        >
                          {isFiring ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Running...</span>
                            </>
                          ) : (
                            <span>Fire</span>
                          )}
                        </button>
                      </div>

                      {/* Error Message */}
                      {error && (
                        <p className="text-[#F85149] text-[10px] mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span className="truncate">{error}</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Active Results Display Area */}
              {Object.keys(results).length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-[#8B949E] text-[11px] font-medium uppercase tracking-wider">
                    Recent Studio Executions
                  </span>
                  {Object.entries(results)
                    .reverse()
                    .map(([presetKey, res]) => (
                      <motion.div
                        key={res.payment_id}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0D1117] border border-[#30363D] rounded-[4px] p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between border-b border-[#21262D] pb-2">
                          <span className="text-[#E6EDF3] text-[12px] font-medium">
                            {PRESET_CARDS.find((p) => p.key === presetKey)?.label || presetKey}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-[4px] border uppercase ${getOutcomeBadge(
                              res.outcome
                            )}`}
                          >
                            {res.outcome}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-[#8B949E] block text-[10px]">Classification</span>
                            <span className="text-[#E6EDF3] font-mono font-medium">
                              {res.classification.failure_type}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#8B949E] block text-[10px]">Confidence</span>
                            <span className="text-[#58A6FF] font-mono font-medium">
                              {(res.classification.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[#8B949E] block text-[10px]">Action</span>
                            <span className="text-[#E6EDF3] font-mono font-medium">
                              {res.action_taken}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#8B949E] block text-[10px]">Payment ID</span>
                            <button
                              type="button"
                              onClick={() => onSelectPayment?.(res.payment_id)}
                              className="text-[#3395FF] hover:underline font-mono text-[10px] text-left truncate block w-full"
                            >
                              {res.payment_id}
                            </button>
                          </div>
                        </div>

                        <p className="text-[#8B949E] text-[11px] italic leading-relaxed border-l-2 border-[#3395FF] pl-2 py-0.5 bg-[#161B22]/50">
                          &quot;{res.classification.reasoning}&quot;
                        </p>

                        {res.payment_link_url && (
                          <div className="pt-1">
                            <span className="text-[#8B949E] text-[10px] block mb-1">
                              Payment Link
                            </span>
                            <div className="flex items-center gap-1.5 bg-[#161B22] border border-[#30363D] rounded-[4px] px-2 py-1">
                              <span className="text-[#58A6FF] font-mono text-[11px] truncate flex-1">
                                {res.payment_link_url}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(res.payment_link_url!)}
                                className="text-[#8B949E] hover:text-[#E6EDF3] p-1 transition-colors"
                              >
                                {copiedLink === res.payment_link_url ? (
                                  <Check className="w-3.5 h-3.5 text-[#3FB950]" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                </div>
              )}

              {/* Custom Mode Divider & Collapsible */}
              <div className="pt-2">
                <hr className="border-[#30363D] mb-3" />
                <button
                  type="button"
                  onClick={() => setShowCustom(!showCustom)}
                  className="flex items-center justify-between w-full text-left text-[#8B949E] hover:text-[#E6EDF3] text-[12px] font-medium py-1 transition-colors"
                >
                  <span>Custom failure scenario</span>
                  {showCustom ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                  {showCustom && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 pt-3 overflow-hidden"
                    >
                      {/* Amount */}
                      <div>
                        <label className="text-[#8B949E] text-[11px] block mb-1">Amount (₹)</label>
                        <div className="relative flex items-center">
                          <span className="absolute left-2.5 text-[#8B949E] text-[12px]">₹</span>
                          <input
                            type="number"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            placeholder="2499"
                            className="w-full bg-[#0D1117] border border-[#30363D] text-[#E6EDF3] text-[12px] pl-6 pr-2 py-1.5 rounded-[4px] font-mono focus:outline-none focus:border-[#3395FF]"
                          />
                        </div>
                      </div>

                      {/* Method Segmented Buttons */}
                      <div>
                        <label className="text-[#8B949E] text-[11px] block mb-1">
                          Payment Method
                        </label>
                        <div className="grid grid-cols-4 gap-1">
                          {['upi', 'card', 'netbanking', 'wallet'].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setCustomMethod(m)}
                              className={`py-1 text-[11px] capitalize rounded-[4px] border ${
                                customMethod === m
                                  ? 'bg-[#3395FF] border-[#3395FF] text-white font-medium'
                                  : 'bg-[#0D1117] border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3]'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Error Code & Description */}
                      <div>
                        <label className="text-[#8B949E] text-[11px] block mb-1">Error Code</label>
                        <select
                          value={customErrorCode}
                          onChange={(e) => setCustomErrorCode(e.target.value)}
                          className="w-full bg-[#0D1117] border border-[#30363D] text-[#E6EDF3] text-[12px] px-2 py-1.5 rounded-[4px] font-mono focus:outline-none focus:border-[#3395FF]"
                        >
                          <option value="BAD_REQUEST_ERROR">BAD_REQUEST_ERROR</option>
                          <option value="GATEWAY_ERROR">GATEWAY_ERROR</option>
                          <option value="SERVER_ERROR">SERVER_ERROR</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[#8B949E] text-[11px] block mb-1">
                          Error Description
                        </label>
                        <textarea
                          rows={2}
                          value={customErrorDesc}
                          onChange={(e) => setCustomErrorDesc(e.target.value)}
                          placeholder="Describe the payment failure..."
                          className="w-full bg-[#0D1117] border border-[#30363D] text-[#E6EDF3] text-[12px] p-2 rounded-[4px] focus:outline-none focus:border-[#3395FF] resize-none"
                        />
                      </div>

                      {/* Customer Name */}
                      <div>
                        <label className="text-[#8B949E] text-[11px] block mb-1">
                          Customer Name
                        </label>
                        <input
                          type="text"
                          value={customCustomerName}
                          onChange={(e) => setCustomCustomerName(e.target.value)}
                          placeholder="Customer Name"
                          className="w-full bg-[#0D1117] border border-[#30363D] text-[#E6EDF3] text-[12px] px-2 py-1.5 rounded-[4px] focus:outline-none focus:border-[#3395FF]"
                        />
                      </div>

                      {/* Fire Custom Button */}
                      <button
                        type="button"
                        disabled={activePreset === 'custom'}
                        onClick={handleFireCustom}
                        className="w-full bg-[#3395FF] hover:bg-[#2277CC] disabled:opacity-60 text-white text-[12px] font-medium py-2 rounded-[4px] flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {activePreset === 'custom' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Firing Custom...</span>
                          </>
                        ) : (
                          <span>Fire Custom Scenario</span>
                        )}
                      </button>

                      {/* Custom Result */}
                      {customResult && (
                        <div className="bg-[#0D1117] border border-[#30363D] rounded-[4px] p-3 text-[11px] space-y-2 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[#E6EDF3] font-medium">Custom Result</span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-[4px] border uppercase ${getOutcomeBadge(
                                customResult.outcome
                              )}`}
                            >
                              {customResult.outcome}
                            </span>
                          </div>
                          <p className="text-[#8B949E] italic border-l-2 border-[#3395FF] pl-2">
                            {customResult.classification.reasoning}
                          </p>
                          {customResult.payment_link_url && (
                            <div className="flex items-center gap-1 bg-[#161B22] p-1.5 rounded-[4px]">
                              <span className="text-[#58A6FF] font-mono text-[10px] truncate flex-1">
                                {customResult.payment_link_url}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(customResult.payment_link_url!)}
                                className="text-[#8B949E] p-1 hover:text-[#E6EDF3]"
                              >
                                {copiedLink === customResult.payment_link_url ? (
                                  <Check className="w-3 h-3 text-[#3FB950]" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
