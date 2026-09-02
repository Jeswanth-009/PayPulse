import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Signal, Wifi, Battery, ChevronLeft, MoreHorizontal, Sparkles, AlertTriangle } from 'lucide-react';
import type { RecoveryMessage } from '../api/client';

interface PhoneSimulatorProps {
  messageData: RecoveryMessage;
}

export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({ messageData }) => {
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');

  const parseMessageWithUrl = (text: string, isWhatsApp: boolean) => {
    // Regex to match URLs
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
              className="block my-2 p-2 bg-[#1D282F] border-l-2 border-[#53BDEB] rounded-[2px] text-[#53BDEB] text-[12px] font-mono underline break-all hover:opacity-80 transition-opacity"
            >
              {part}
            </a>
          );
        } else {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3395FF] underline break-all block my-1"
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
    <div className="flex flex-col items-center justify-center py-2">
      {/* Channel Toggle */}
      <div className="flex bg-[#161B22] border border-[#30363D] p-0.5 rounded-[6px] mb-5 shadow-xs">
        <button
          type="button"
          onClick={() => setChannel('whatsapp')}
          className={`px-4 py-1.5 text-[12px] font-medium rounded-[4px] transition-all ${
            channel === 'whatsapp'
              ? 'bg-[#128C7E] text-white shadow-xs'
              : 'text-[#8B949E] hover:text-[#E6EDF3]'
          }`}
        >
          WhatsApp
        </button>
        <button
          type="button"
          onClick={() => setChannel('sms')}
          className={`px-4 py-1.5 text-[12px] font-medium rounded-[4px] transition-all ${
            channel === 'sms'
              ? 'bg-[#3A3A3C] text-white shadow-xs'
              : 'text-[#8B949E] hover:text-[#E6EDF3]'
          }`}
        >
          SMS
        </button>
      </div>

      {/* Phone Outer Frame */}
      <motion.div
        initial={{ boxShadow: '0 0 0px rgba(51,149,255,0)' }}
        animate={{ boxShadow: '0 0 28px rgba(51,149,255,0.14)' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-[280px] rounded-[36px] border-2 border-[#30363D] bg-[#0D1117] overflow-hidden flex flex-col shadow-2xl relative"
      >
        {/* Notch */}
        <div className="w-[80px] h-[16px] bg-[#161B22] rounded-[8px] mx-auto mt-2.5 shrink-0" />

        {/* Status Bar */}
        <div className="flex items-center justify-between px-5 pt-1.5 pb-2 text-[11px] text-[#8B949E] shrink-0 select-none">
          <span className="font-semibold text-white">10:41</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3 h-3 text-[#8B949E]" />
            <Wifi className="w-3 h-3 text-[#8B949E]" />
            <Battery className="w-3.5 h-3.5 text-[#8B949E]" />
          </div>
        </div>

        {/* Screen Content Container with Cross-Fade */}
        <div className="h-[360px] flex flex-col overflow-hidden relative">
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
                <div className="bg-[#202C33] px-3 py-2 flex items-center gap-2 border-b border-[#30363D]/30 shrink-0">
                  <div className="w-7 h-7 rounded-full bg-[#128C7E] flex items-center justify-center text-white font-bold text-[12px] shrink-0">
                    P
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-white text-[12px] font-semibold leading-tight truncate">
                      PayPulse Store
                    </h4>
                    <p className="text-[#8696A0] text-[9px] leading-tight">online</p>
                  </div>
                </div>

                {/* WhatsApp Chat Area */}
                <div className="flex-1 p-3 overflow-y-auto flex flex-col justify-end space-y-2">
                  {/* Timestamp chip */}
                  <div className="flex justify-center mb-1">
                    <span className="bg-[#182229] text-[#8696A0] text-[9px] px-2 py-0.5 rounded-[4px] shadow-xs">
                      Today, 10:41 AM
                    </span>
                  </div>

                  {/* Message bubble */}
                  <div className="bg-[#202C33] text-[#E9EDF0] text-[12px] leading-relaxed p-2.5 rounded-[12px_12px_12px_2px] max-w-[92%] shadow-sm self-start">
                    {parseMessageWithUrl(messageData.whatsapp_message, true)}
                    <div className="text-right text-[#8696A0] text-[9px] mt-1 flex items-center justify-end gap-1 select-none">
                      <span>10:41</span>
                      <span className="text-[#53BDEB]">✓✓</span>
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
                <div className="bg-[#2C2C2E] h-[40px] px-3 flex items-center justify-between border-b border-[#38383A] shrink-0">
                  <ChevronLeft className="w-4 h-4 text-[#3395FF]" />
                  <span className="text-white text-[13px] font-semibold">Messages</span>
                  <MoreHorizontal className="w-4 h-4 text-[#8E8E93]" />
                </div>

                {/* Contact Subtitle */}
                <div className="text-center py-1 text-[#8E8E93] text-[11px] shrink-0">
                  PayPulse Store
                </div>

                {/* SMS Chat Area */}
                <div className="flex-1 p-3 overflow-y-auto flex flex-col justify-end space-y-1">
                  {/* Bubble */}
                  <div className="bg-[#3A3A3C] text-white text-[12px] leading-relaxed px-3 py-2 rounded-[16px] max-w-[88%] self-start shadow-xs">
                    {parseMessageWithUrl(messageData.sms_message, false)}
                  </div>
                  <span className="text-[#636366] text-[9px] pl-1">10:41 AM</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Home Bar */}
        <div className="w-[96px] h-[4px] bg-[#30363D] rounded-[2px] mx-auto my-2.5 shrink-0" />
      </motion.div>

      {/* Metadata Below Phone */}
      <div className="mt-4 text-center space-y-1 max-w-[260px]">
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-[#8B949E]">
          {messageData.source === 'llm' ? (
            <>
              <Sparkles className="w-3 h-3 text-[#58A6FF]" />
              <span className="text-[#58A6FF]">✦ AI generated</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3 h-3 text-[#D29922]" />
              <span className="text-[#D29922]">⚠ Template fallback</span>
            </>
          )}
          <span>·</span>
          <span className="capitalize">{messageData.tone}</span>
        </div>

        {messageData.personalization_note && (
          <p className="text-[#8B949E] text-[11px] italic leading-relaxed">
            &quot;{messageData.personalization_note}&quot;
          </p>
        )}

        <p className="text-[#484F58] text-[10px] pt-1">
          Simulation only · Test mode · Not dispatched
        </p>
      </div>
    </div>
  );
};
