import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Check,
  Sparkles,
  ShieldCheck,
  Clock,
  DollarSign,
  Cpu,
} from 'lucide-react';
import { useMerchantConfig, useUpdateConfig, type MerchantConfigItem } from '../api/client';

interface PresetProfile {
  name: string;
  badge: string;
  description: string;
  icon: string;
  values: {
    max_retry_attempts: string;
    escalation_threshold: string;
    agent_poll_interval: string;
    llm_provider: string;
  };
}

const PRESET_PROFILES: PresetProfile[] = [
  {
    name: 'Balanced E-Commerce',
    badge: 'Recommended',
    description: 'Optimal balance between recovery conversion and customer reassurance.',
    icon: '⚖️',
    values: {
      max_retry_attempts: '2',
      escalation_threshold: '10000',
      agent_poll_interval: '15',
      llm_provider: 'openrouter/minimax',
    },
  },
  {
    name: 'High-Velocity Blitz',
    badge: 'Flash Sales',
    description: 'Ultra-fast 10s polling with aggressive alternative method generation for high volume.',
    icon: '⚡',
    values: {
      max_retry_attempts: '3',
      escalation_threshold: '25000',
      agent_poll_interval: '10',
      llm_provider: 'openrouter/minimax',
    },
  },
  {
    name: 'VIP Conservative',
    badge: 'Enterprise',
    description: 'Strict limits with rapid human escalation for luxury or high-ticket stores.',
    icon: '🛡️',
    values: {
      max_retry_attempts: '1',
      escalation_threshold: '5000',
      agent_poll_interval: '30',
      llm_provider: 'claude-sonnet-4-6',
    },
  },
];

export const PolicyStudioPage: React.FC = () => {
  const { data: configs, isLoading } = useMerchantConfig();
  const updateMutation = useUpdateConfig();

  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (configs) {
      const initial: Record<string, string> = {};
      configs.forEach((c) => {
        initial[c.key] = c.value;
      });
      setLocalValues(initial);
    }
  }, [configs]);

  const handleSave = async (key: string, value: string) => {
    try {
      await updateMutation.mutateAsync({ key, value });
      setLocalValues((prev) => ({ ...prev, [key]: value }));
      setSaveSuccess((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setSaveSuccess((prev) => ({ ...prev, [key]: false }));
      }, 1500);
    } catch (err: any) {
      console.error('Failed to update config:', err);
    }
  };

  const applyPreset = async (preset: PresetProfile) => {
    for (const [key, val] of Object.entries(preset.values)) {
      await handleSave(key, val);
    }
  };

  const getConfig = (key: string): MerchantConfigItem | undefined => {
    return configs?.find((c) => c.key === key);
  };

  return (
    <div className="max-w-[1080px] mx-auto py-6 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222F46] pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <h1 className="text-[#F0F6FC] text-[22px] font-bold tracking-tight">
              Merchant Policy & Guardrails Studio
            </h1>
            <span className="text-[10px] font-mono font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 px-2 py-0.5 rounded-[4px]">
              Active Governance
            </span>
          </div>
          <p className="text-[#94A3B8] text-[13px] max-w-[680px]">
            Define the rules of engagement for PayPulse. Adjust retry thresholds, polling velocity, and escalation guardrails with instant live synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#566782]">
            Runtime Sync: <span className="text-[#10B981] font-bold">Instant</span>
          </span>
        </div>
      </div>

      {/* Preset Profiles Showcase */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#94A3B8]">
          <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>One-Click Policy Templates</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRESET_PROFILES.map((preset) => {
            const isMatch =
              localValues['max_retry_attempts'] === preset.values.max_retry_attempts &&
              localValues['agent_poll_interval'] === preset.values.agent_poll_interval;

            return (
              <div
                key={preset.name}
                className={`p-4 rounded-[10px] border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isMatch
                    ? 'bg-[#182234] border-[#38BDF8] shadow-lg shadow-[#38BDF8]/10 ring-1 ring-[#38BDF8]'
                    : 'bg-[#101623] border-[#222F46] hover:border-[#566782] hover:bg-[#182234]/40'
                }`}
                onClick={() => applyPreset(preset)}
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{preset.icon}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[4px] border ${
                        isMatch
                          ? 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/40'
                          : 'bg-[#182234] text-[#94A3B8] border-[#222F46]'
                      }`}
                    >
                      {isMatch ? '✓ Active' : preset.badge}
                    </span>
                  </div>
                  <h3 className="text-[#F0F6FC] text-[14px] font-bold">{preset.name}</h3>
                  <p className="text-[#94A3B8] text-[12px] mt-1 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#222F46] flex items-center justify-between text-[11px] font-mono text-[#566782]">
                  <span>{preset.values.agent_poll_interval}s stream</span>
                  <span>Max {preset.values.max_retry_attempts} retries</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Settings Form */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-[#101623] border border-[#222F46] rounded-[10px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <span className="text-[#94A3B8] text-[12px] font-bold uppercase tracking-wider block">
            Granular Policy Parameters
          </span>

          {/* 1. Stream Polling Interval */}
          <div className="bg-[#101623] border border-[#222F46] rounded-[10px] p-5 space-y-3 transition-all hover:border-[#38BDF8]/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#38BDF8]" />
                <span className="text-[#F0F6FC] text-[14px] font-bold">
                  {getConfig('agent_poll_interval')?.label || 'Agent Stream Polling Interval'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#38BDF8] font-mono font-bold text-[14px] bg-[#38BDF8]/10 px-2.5 py-0.5 rounded-[4px] border border-[#38BDF8]/20">
                  {localValues['agent_poll_interval'] || '30'} seconds
                </span>
                {saveSuccess['agent_poll_interval'] && (
                  <span className="text-[#10B981] text-[11px] font-mono flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>
            </div>

            <p className="text-[#94A3B8] text-[12px]">
              How often PayPulse queries the Razorpay payment stream to detect dropouts. Faster intervals provide immediate recoveries during high traffic.
            </p>

            <div className="flex items-center gap-4 pt-1">
              <input
                type="range"
                min={10}
                max={120}
                step={5}
                value={parseInt(localValues['agent_poll_interval'] || '30')}
                onChange={(e) => {
                  setLocalValues({ ...localValues, agent_poll_interval: e.target.value });
                }}
                onMouseUp={(e) => handleSave('agent_poll_interval', (e.target as HTMLInputElement).value)}
                onTouchEnd={(e) => handleSave('agent_poll_interval', (e.target as HTMLInputElement).value)}
                className="w-full h-2 bg-[#182234] rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
              />
              <div className="flex items-center gap-1 text-[11px] font-mono text-[#566782] min-w-[75px] justify-end">
                <span>10s</span>
                <span>···</span>
                <span>120s</span>
              </div>
            </div>
          </div>

          {/* 2. Max Retry Attempts (Stopping Rule) */}
          <div className="bg-[#101623] border border-[#222F46] rounded-[10px] p-5 space-y-3 transition-all hover:border-[#10B981]/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <span className="text-[#F0F6FC] text-[14px] font-bold">
                  {getConfig('max_retry_attempts')?.label || 'Max Recovery Attempts (Stopping Rule)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#10B981] font-mono font-bold text-[14px] bg-[#10B981]/10 px-2.5 py-0.5 rounded-[4px] border border-[#10B981]/20">
                  {localValues['max_retry_attempts'] || '2'} Attempts Max
                </span>
                {saveSuccess['max_retry_attempts'] && (
                  <span className="text-[#10B981] text-[11px] font-mono flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>
            </div>

            <p className="text-[#94A3B8] text-[12px]">
              Strictly prevents customer fatigue. If a customer fails twice, the agent halts recovery and flags the order as EXHAUSTED.
            </p>

            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleSave('max_retry_attempts', String(val))}
                  className={`flex-1 py-2 text-[12px] font-mono font-bold rounded-[6px] border transition-all ${
                    localValues['max_retry_attempts'] === String(val)
                      ? 'bg-[#10B981] border-[#10B981] text-white shadow-md shadow-[#10B981]/20'
                      : 'bg-[#182234] border-[#222F46] text-[#94A3B8] hover:text-[#F0F6FC]'
                  }`}
                >
                  {val} Attempt{val > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Human Escalation Threshold */}
          <div className="bg-[#101623] border border-[#222F46] rounded-[10px] p-5 space-y-3 transition-all hover:border-[#F59E0B]/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#F59E0B]" />
                <span className="text-[#F0F6FC] text-[14px] font-bold">
                  {getConfig('escalation_threshold')?.label || 'VIP Escalation Amount Threshold'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#F59E0B] font-mono font-bold text-[14px] bg-[#F59E0B]/10 px-2.5 py-0.5 rounded-[4px] border border-[#F59E0B]/20">
                  ₹{Number(localValues['escalation_threshold'] || 10000).toLocaleString('en-IN')}
                </span>
                {saveSuccess['escalation_threshold'] && (
                  <span className="text-[#10B981] text-[11px] font-mono flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>
            </div>

            <p className="text-[#94A3B8] text-[12px]">
              Transactions exceeding this amount trigger an automated ESCALATE action for personalized VIP merchant support.
            </p>

            <div className="flex items-center gap-4 pt-1">
              <input
                type="range"
                min={1000}
                max={50000}
                step={1000}
                value={parseInt(localValues['escalation_threshold'] || '10000')}
                onChange={(e) => {
                  setLocalValues({ ...localValues, escalation_threshold: e.target.value });
                }}
                onMouseUp={(e) => handleSave('escalation_threshold', (e.target as HTMLInputElement).value)}
                onTouchEnd={(e) => handleSave('escalation_threshold', (e.target as HTMLInputElement).value)}
                className="w-full h-2 bg-[#182234] rounded-lg appearance-none cursor-pointer accent-[#F59E0B]"
              />
              <div className="flex items-center gap-1 text-[11px] font-mono text-[#566782] min-w-[75px] justify-end">
                <span>₹1k</span>
                <span>···</span>
                <span>₹50k</span>
              </div>
            </div>
          </div>

          {/* 4. AI LLM Model Selection */}
          <div className="bg-[#101623] border border-[#222F46] rounded-[10px] p-5 space-y-3 transition-all hover:border-[#38BDF8]/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#38BDF8]" />
                <span className="text-[#F0F6FC] text-[14px] font-bold">
                  {getConfig('llm_provider')?.label || 'Diagnostic AI LLM Engine'}
                </span>
              </div>
              {saveSuccess['llm_provider'] && (
                <span className="text-[#10B981] text-[11px] font-mono flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>

            <p className="text-[#94A3B8] text-[12px]">
              Select which AI intelligence model powers root-cause failure classification and personalized copy generation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {[
                { id: 'openrouter/minimax', name: 'MiniMax M3 (Free)', desc: 'High-speed reasoning via OpenRouter' },
                { id: 'claude-sonnet-4-6', name: 'Claude 3.5 Sonnet', desc: 'Deep nuanced contextual classification' },
                { id: 'gemini-pro', name: 'Gemini 1.5 Pro', desc: 'Multilingual Hinglish specialist' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSave('llm_provider', m.id)}
                  className={`p-3 rounded-[8px] text-left border transition-all ${
                    localValues['llm_provider'] === m.id
                      ? 'bg-[#38BDF8]/15 border-[#38BDF8] text-[#F0F6FC]'
                      : 'bg-[#182234] border-[#222F46] text-[#94A3B8] hover:text-[#F0F6FC]'
                  }`}
                >
                  <span className="font-bold text-[12px] block text-[#F0F6FC]">{m.name}</span>
                  <span className="text-[10px] text-[#566782] block mt-0.5">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
