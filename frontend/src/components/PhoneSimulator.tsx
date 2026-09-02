import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Signal, Wifi, Battery, Sparkles, AlertTriangle, Zap, Loader2, Check } from 'lucide-react';
import { useSimulatePay, type RecoveryMessage } from '../api/client';

interface PhoneSimulatorProps {
  messageData: RecoveryMessage;
}

export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({ messageData }) => {
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [isPaid, setIsPaid] = useState(false);
  const simulatePay = useSimulatePay();
  const isPaying = simulatePay.isPending;

  const handleSimulatePay = async () => {
    if (!messageData.payment_id) return;
    try {
      await simulatePay.mutateAsync(messageData.payment_id);
      setIsPaid(true);
    } catch (err) {
      console.error('Failed to simulate pay:', err);
    }
  };

  const parseMessageWithUrl = (text: string, isWhatsApp: boolean) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        if (isWhatsApp) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="block my-2 p-2.5 bg-[#1D282F] border-l-2 border-[#53BDEB] rounded-[4px] text-[#53BDEB] text-[11px] font-mono underline break-all hover:bg-[#25323A] transition-colors"
            >
              <span className="block font-bold text-white mb-0.5 text-[10px]">💳 Complete Order Securely</span>
              <span>{part}</span>
            </a>
          );
        } else {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#38BDF8] underline break-all block my-1 font-mono text-[11px]"
            >
              {part}
            </a>
          );
        }
      }
      return <span key={i} className="whitespace-pre-line">{part}</span>;
    });
  };

  return (
    <div className="flex flex-col items-center justify-center py-1">
      {/* Channel Toggle */}
      <div className="flex bg-[#101623] border border-[#222F46] p-1 rounded-[8px] mb-4 shadow-md">
        <button
          type="button"
          onClick={() => setChannel('whatsapp')}
          className={`px-4 py-1.5 text-[12px] font-bold rounded-[6px] transition-all cursor-pointer ${
            channel === 'whatsapp'
              ? 'bg-[#128C7E] text-white shadow-md shadow-[#128C7E]/20'
              : 'text-[#94A3B8] hover:text-[#F0F6FC]'
          }`}
        >
          WhatsApp (Hinglish)
        </button>
        <button
          type="button"
          onClick={() => setChannel('sms')}
          className={`px-4 py-1.5 text-[12px] font-bold rounded-[6px] transition-all cursor-pointer ${
            channel === 'sms'
              ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20'
              : 'text-[#94A3B8] hover:text-[#F0F6FC]'
          }`}
        >
          iOS SMS (English)
        </button>
      </div>

      {/* Phone Outer Frame (iPhone 16 Pro Style) */}
      <motion.div
        initial={{ boxShadow: '0 0 0px rgba(56,189,248,0)' }}
        animate={{ boxShadow: '0 0 35px rgba(56,189,248,0.18)' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-[290px] rounded-[40px] border-[3px] border-[#2E3C52] bg-[#090D16] overflow-hidden flex flex-col shadow-2xl relative"
      >
        {/* Dynamic Island Notch Pill */}
        <div className="w-[88px] h-[18px] bg-black rounded-full mx-auto mt-2.5 shrink-0 flex items-center justify-between px-2.5 shadow-inner">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-6 pt-1 pb-2 text-[10px] font-mono text-[#94A3B8] shrink-0 select-none">
          <span className="font-bold text-white">10:41</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3 h-3 text-[#94A3B8]" />
            <Wifi className="w-3 h-3 text-[#94A3B8]" />
            <Battery className="w-3.5 h-3.5 text-[#94A3B8]" />
          </div>
        </div>

        {/* Screen Content Container with Cross-Fade */}
        <div className="h-[380px] flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            {channel === 'whatsapp' ? (
              <motion.div
                key="whatsapp"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col h-full bg-[#0B141A]"
              >
                {/* WhatsApp App Bar */}
                <div className="bg-[#202C33] px-3.5 py-2.5 flex items-center gap-2.5 border-b border-[#2A3942] shrink-0 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#128C7E] to-[#25D366] flex items-center justify-center text-white font-bold text-[13px] shrink-0 shadow-md">
                    P
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <h4 className="text-white text-[12px] font-bold leading-tight truncate">
                        PayPulse Verified Store
                      </h4>
                      <span className="text-[#25D366] text-[10px]">✓</span>
                    </div>
                    <p className="text-[#25D366] text-[9px] leading-tight font-mono">Business Account · Active</p>
                  </div>
                </div>

                {/* WhatsApp Chat Area */}
                <div className="flex-1 p-3 overflow-y-auto flex flex-col justify-end space-y-2">
                  {/* Timestamp chip */}
                  <div className="flex justify-center mb-1">
                    <span className="bg-[#182229] text-[#8696A0] text-[9px] px-2.5 py-0.5 rounded-full shadow-xs font-mono">
                      Today, 10:41 AM
                    </span>
                  </div>

                  {/* Message bubble */}
                  <div className="bg-[#202C33] text-[#E9EDF0] text-[12px] leading-relaxed p-3 rounded-[12px_12px_12px_2px] max-w-[94%] shadow-md self-start border border-[#2A3942]">
                    {parseMessageWithUrl(messageData.whatsapp_message, true)}
                    <div className="text-right text-[#8696A0] text-[9px] mt-1.5 flex items-center justify-end gap-1 select-none font-mono">
                      <span>10:41</span>
                      <span className="text-[#53BDEB] font-bold">✓✓</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="sms"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col h-full bg-[#1C1C1E]"
              >
                {/* SMS App Bar */}
                <div className="bg-[#2C2C2E] h-[44px] px-4 flex items-center justify-between border-b border-[#38383A] shrink-0">
                  <div className="flex items-center gap-1 text-[#38BDF8] text-[12px] font-medium">
                    <span>‹ Back</span>
                  </div>
                  <span className="text-white text-[13px] font-bold">PayPulse Order</span>
                  <div className="w-4" />
                </div>

                {/* SMS Chat Area */}
                <div className="flex-1 p-3 overflow-y-auto flex flex-col justify-end space-y-2">
                  <div className="bg-[#3A3A3C] text-white text-[12px] leading-relaxed px-3.5 py-2.5 rounded-[18px] max-w-[90%] self-start shadow-md">
                    {parseMessageWithUrl(messageData.sms_message, false)}
                  </div>
                  <span className="text-[#636366] text-[9px] pl-1 font-mono">Delivered · 10:41 AM</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Home Bar */}
        <div className="w-[100px] h-[4px] bg-[#384860] rounded-full mx-auto my-3 shrink-0" />
      </motion.div>

      {/* Metadata & 1-Click Action Below Phone */}
      <div className="mt-4 text-center space-y-2 max-w-[280px]">
        <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-[#94A3B8]">
          {messageData.source === 'llm' ? (
            <span className="text-[#38BDF8] flex items-center gap-1 font-bold">
              <Sparkles className="w-3 h-3" />
              <span>✦ MiniMax M3 Copy</span>
            </span>
          ) : (
            <span className="text-[#F59E0B] flex items-center gap-1 font-bold">
              <AlertTriangle className="w-3 h-3" />
              <span>Template Fallback</span>
            </span>
          )}
          <span>·</span>
          <span className="capitalize text-[#F0F6FC]">{messageData.tone}</span>
        </div>

        {/* Simulate Customer Payment 1-Click Resolution */}
        {messageData.payment_id && (
          <button
            type="button"
            disabled={isPaying || isPaid}
            onClick={handleSimulatePay}
            className={`w-full text-[12px] font-bold py-2.5 px-3.5 rounded-[8px] flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer ${
              isPaid
                ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/50'
                : 'bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white shadow-[#10B981]/25'
            }`}
          >
            {isPaid ? (
              <>
                <Check className="w-4 h-4" />
                <span>Payment Recovered & Captured!</span>
              </>
            ) : isPaying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Capturing Payment in Razorpay...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Simulate Customer Paying Link</span>
              </>
            )}
          </button>
        )}

        <p className="text-[#566782] text-[10px]">
          Interactive Simulation · Razorpay Test Sandbox
        </p>
      </div>
    </div>
  );
};
