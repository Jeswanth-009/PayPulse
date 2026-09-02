import React, { useState } from 'react';
import {
  Smartphone,
  Sparkles,
  Search,
  Zap,
  CreditCard,
  Clock,
  ShoppingBag,
  Send,
} from 'lucide-react';
import { PhoneSimulator } from '../components/PhoneSimulator';
import { useRecoveryMessage, useAuditLog, type RecoveryMessage } from '../api/client';

const DEMO_SCENARIOS: RecoveryMessage[] = [
  {
    id: 1,
    payment_id: 'pay_demo_upi_01',
    order_id: 'order_demo_upi_01',
    customer_name: 'Priya Nair',
    amount_rupees: 799,
    tone: 'hinglish',
    source: 'llm',
    payment_link_url: 'https://rzp.io/rzp/upi_retry_92a',
    whatsapp_message: 'Hi Priya 👋\n\nAapka ₹799 ka UPI payment nahi ho paya — koi baat nahi!\n\nNiche diye link se 1-click me complete karein:\n\nhttps://rzp.io/rzp/upi_retry_92a\n\n— PayPulse Store',
    sms_message: 'Hi Priya, aapka Rs.799 UPI payment complete nahi hua. Yahan se retry karein: https://rzp.io/rzp/upi_retry_92a — PayPulse',
    personalization_note: 'Warm Hinglish phrasing for UPI dropout. Assures customer their order is safe with a single-click recovery link.',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    payment_id: 'pay_demo_bank_02',
    order_id: 'order_demo_bank_02',
    customer_name: 'Arjun Mehta',
    amount_rupees: 2499,
    tone: 'hinglish',
    source: 'llm',
    payment_link_url: 'https://rzp.io/rzp/bank_retry_48f',
    whatsapp_message: 'Namaste Arjun 🙏\n\nBank server timeout ki wajah se aapka ₹2,499 payment nahi hua. Naya link active hai:\n\nhttps://rzp.io/rzp/bank_retry_48f\n\n— PayPulse Store',
    sms_message: 'Arjun, Rs.2499 bank timeout retry link: https://rzp.io/rzp/bank_retry_48f. Valid for 24h. — PayPulse',
    personalization_note: 'Soft decline messaging acknowledging bank infrastructure delay without blaming the customer.',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    payment_id: 'pay_demo_card_03',
    order_id: 'order_demo_card_03',
    customer_name: 'Sneha Kapoor',
    amount_rupees: 4999,
    tone: 'english',
    source: 'llm',
    payment_link_url: 'https://rzp.io/rzp/card_alt_71c',
    whatsapp_message: 'Hi Sneha 👋\n\nYour ₹4,999 payment was declined by your bank. You can quickly retry using UPI, another card, or Netbanking here:\n\nhttps://rzp.io/rzp/card_alt_71c\n\n— PayPulse Store',
    sms_message: 'Sneha, your Rs.4999 payment failed. Try alternative payment methods: https://rzp.io/rzp/card_alt_71c — PayPulse',
    personalization_note: 'English conversational tone encouraging alternative payment rails for hard card declines.',
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    payment_id: 'pay_demo_high_04',
    order_id: 'order_demo_high_04',
    customer_name: 'Vikram Joshi',
    amount_rupees: 18500,
    tone: 'english',
    source: 'llm',
    payment_link_url: 'https://rzp.io/rzp/highval_33b',
    whatsapp_message: 'Hi Vikram,\n\nWe noticed your transaction of ₹18,500 timed out during OTP verification. Your items are reserved:\n\nhttps://rzp.io/rzp/highval_33b\n\n— PayPulse Store',
    sms_message: 'Hi Vikram, your Rs.18500 order timed out. Items reserved. Complete order: https://rzp.io/rzp/highval_33b',
    personalization_note: 'High-value basket reassurance highlighting cart reservation to prevent customer churn.',
    created_at: new Date().toISOString(),
  },
];

export const SimulatorPage: React.FC = () => {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number>(0);
  const [searchPaymentId, setSearchPaymentId] = useState<string>('');
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);

  const { data: auditData } = useAuditLog({ event_type: 'action_taken', limit: 20 });
  const { data: fetchedMessage } = useRecoveryMessage(activePaymentId);

  const currentMessage: RecoveryMessage = fetchedMessage || DEMO_SCENARIOS[selectedScenarioIndex];

  const handleSelectScenario = (index: number) => {
    setActivePaymentId(null);
    setSelectedScenarioIndex(index);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchPaymentId.trim()) {
      setActivePaymentId(searchPaymentId.trim());
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto py-4 px-2 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#222F46] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-5 h-5 text-[#38BDF8]" />
            <h1 className="text-[#F0F6FC] text-[20px] font-bold tracking-tight">
              Customer Recovery Simulator
            </h1>
            <span className="text-[11px] bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 px-2 py-0.5 rounded-[4px] font-mono font-semibold">
              Live Preview
            </span>
          </div>
          <p className="text-[#94A3B8] text-[13px]">
            Experience exactly what end-customers receive on WhatsApp & SMS when PayPulse autonomously recovers failed checkouts.
          </p>
        </div>

        {/* Search / Lookup input */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 text-[#566782]" />
            <input
              type="text"
              value={searchPaymentId}
              onChange={(e) => setSearchPaymentId(e.target.value)}
              placeholder="Lookup Payment ID..."
              className="bg-[#101623] border border-[#222F46] text-[#F0F6FC] text-[12px] pl-8 pr-3 py-1.5 rounded-[6px] font-mono focus:outline-none focus:border-[#38BDF8] w-[200px]"
            />
          </div>
          <button
            type="submit"
            className="btn btn-secondary text-[12px] py-1.5 px-3"
          >
            Lookup
          </button>
        </form>
      </div>

      {/* Main Grid: Left Controls / Scenarios + Right Smartphone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Cols: Interactive Scenario Selector & Telemetry */}
        <div className="lg:col-span-7 space-y-4">
          {/* Preset Scenario Cards */}
          <div>
            <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider block mb-2">
              Select Failure Scenario to Test
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_SCENARIOS.map((scenario, idx) => {
                const isSelected = activePaymentId === null && selectedScenarioIndex === idx;
                const icons = [Zap, Clock, CreditCard, ShoppingBag];
                const Icon = icons[idx % icons.length];

                return (
                  <button
                    key={scenario.payment_id}
                    type="button"
                    onClick={() => handleSelectScenario(idx)}
                    className={`text-left p-3 rounded-[8px] border transition-all ${
                      isSelected
                        ? 'bg-[#182234] border-[#38BDF8] shadow-md shadow-[#38BDF8]/10'
                        : 'bg-[#101623] border-[#222F46] hover:border-[#566782] hover:bg-[#182234]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#38BDF8]' : 'text-[#94A3B8]'}`} />
                        <span className="text-[#F0F6FC] text-[13px] font-semibold truncate">
                          {scenario.customer_name}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#10B981] font-bold">
                        ₹{scenario.amount_rupees?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-[#94A3B8] text-[11px] line-clamp-2 leading-relaxed">
                      {scenario.personalization_note}
                    </p>
                    <div className="flex items-center gap-2 mt-2 pt-1 border-t border-[#222F46]/60 text-[10px] font-mono text-[#566782]">
                      <span className="capitalize">{scenario.tone}</span>
                      <span>·</span>
                      <span className="text-[#38BDF8]">{scenario.payment_id}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Copy Breakdown & Character Gauge */}
          <div className="bg-[#101623] border border-[#222F46] rounded-[10px] p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A2538] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#38BDF8]" />
                <span className="text-[#F0F6FC] text-[13px] font-semibold">
                  AI Copy Guardrails & Telemetry
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-0.5 rounded-[4px]">
                Model: MiniMax M3 / Claude
              </span>
            </div>

            {/* WhatsApp Specs */}
            <div>
              <div className="flex justify-between items-center text-[12px] mb-1">
                <span className="text-[#94A3B8]">WhatsApp Message Length</span>
                <span className="font-mono text-[#F0F6FC]">
                  {currentMessage.whatsapp_message.length} / 300 chars
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#182234] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#128C7E] transition-all duration-300"
                  style={{ width: `${Math.min(100, (currentMessage.whatsapp_message.length / 300) * 100)}%` }}
                />
              </div>
            </div>

            {/* SMS Specs */}
            <div>
              <div className="flex justify-between items-center text-[12px] mb-1">
                <span className="text-[#94A3B8]">SMS Character Length (Hard GSM Limit)</span>
                <span className="font-mono text-[#F0F6FC]">
                  {currentMessage.sms_message.length} / 160 chars
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#182234] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3B82F6] transition-all duration-300"
                  style={{ width: `${Math.min(100, (currentMessage.sms_message.length / 160) * 100)}%` }}
                />
              </div>
            </div>

            {/* Rationale Quote */}
            <div className="bg-[#182234] border-l-2 border-[#38BDF8] p-3 rounded-[0_6px_6px_0]">
              <span className="text-[#94A3B8] text-[10px] font-mono uppercase block mb-1">
                Personalization Rationale:
              </span>
              <p className="text-[#F0F6FC] text-[12px] italic leading-relaxed">
                &quot;{currentMessage.personalization_note}&quot;
              </p>
            </div>
          </div>

          {/* Recent Live Transactions from Audit Feed */}
          {auditData?.entries && auditData.entries.length > 0 && (
            <div>
              <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider block mb-2">
                Recent Real Recoveries in Audit Log
              </span>
              <div className="bg-[#101623] border border-[#222F46] rounded-[8px] divide-y divide-[#1A2538] max-h-[160px] overflow-y-auto">
                {auditData.entries.slice(0, 5).map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setActivePaymentId(entry.payment_id)}
                    className="w-full p-2.5 flex items-center justify-between text-left hover:bg-[#182234] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#F0F6FC] font-mono text-[11px]">
                        {entry.payment_id}
                      </span>
                      <span className="text-[#94A3B8] text-[11px]">
                        {entry.failure_type}
                      </span>
                    </div>
                    <span className="text-[#38BDF8] text-[11px] font-mono flex items-center gap-1">
                      Inspect ➔
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Cols: Smartphone Device Simulator */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#101623]/80 border border-[#222F46] rounded-[14px] p-6 shadow-xl relative backdrop-blur-md">
          <div className="absolute top-3 left-4 flex items-center gap-1.5 text-[11px] font-mono text-[#566782]">
            <Send className="w-3 h-3 text-[#10B981]" />
            <span>Interactive Device View</span>
          </div>

          <PhoneSimulator messageData={currentMessage} />
        </div>
      </div>
    </div>
  );
};
