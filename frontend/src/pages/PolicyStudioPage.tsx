import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Check, AlertCircle, Sparkles } from 'lucide-react';
import { useMerchantConfig, useUpdateConfig, type MerchantConfigItem } from '../api/client';

export const PolicyStudioPage: React.FC = () => {
  const { data: configs, isLoading } = useMerchantConfig();
  const updateMutation = useUpdateConfig();

  // Local state for inputs to allow smooth editing before save
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState<Record<string, boolean>>({});
  const [saveError, setSaveError] = useState<Record<string, string>>({});

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
      setSaveError((prev) => ({ ...prev, [key]: '' }));
      await updateMutation.mutateAsync({ key, value });
      setLocalValues((prev) => ({ ...prev, [key]: value }));
      setSaveSuccess((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setSaveSuccess((prev) => ({ ...prev, [key]: false }));
      }, 1200);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to update configuration';
      setSaveError((prev) => ({ ...prev, [key]: msg }));
      setTimeout(() => {
        setSaveError((prev) => ({ ...prev, [key]: '' }));
      }, 3000);
    }
  };

  const getConfig = (key: string): MerchantConfigItem | undefined => {
    return configs?.find((c) => c.key === key);
  };

  return (
    <div className="max-w-[640px] mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <SlidersHorizontal className="w-5 h-5 text-[#3395FF]" />
          <h1 className="text-[#E6EDF3] text-[20px] font-semibold tracking-tight">Policy Studio</h1>
        </div>
        <p className="text-[#8B949E] text-[14px]">
          Configure the agent&apos;s autonomous guardrails. Changes take effect on the next agent cycle.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-[#161B22] border border-[#30363D] rounded-[6px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* 1. Merchant Name */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-[6px] p-[16px_20px] transition-colors">
            <div className="flex justify-between items-center">
              <span className="text-[#E6EDF3] text-[14px] font-semibold">
                {getConfig('merchant_name')?.label || 'Merchant Name'}
              </span>
              <span className="text-[#484F58] text-[11px] font-mono">
                {getConfig('merchant_name')?.updated_at?.slice(0, 19) || ''}
              </span>
            </div>
            <p className="text-[#8B949E] text-[12px] mt-1">
              {getConfig('merchant_name')?.description || 'Used in customer-facing recovery messages'}
            </p>
            <div className="mt-3 relative flex items-center">
              <input
                type="text"
                value={localValues['merchant_name'] ?? ''}
                onChange={(e) => setLocalValues({ ...localValues, merchant_name: e.target.value })}
                onBlur={(e) => handleSave('merchant_name', e.target.value)}
                className={`w-full bg-[#0D1117] border ${
                  saveSuccess['merchant_name'] ? 'border-[#3FB950]' : 'border-[#30363D]'
                } text-[#E6EDF3] text-[14px] p-[8px_12px] rounded-[4px] focus:outline-none focus:border-[#3395FF] transition-colors`}
              />
              {saveSuccess['merchant_name'] && (
                <div className="absolute right-3 flex items-center gap-1 text-[#3FB950] text-[12px] transition-opacity duration-300">
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </div>
              )}
            </div>
            {saveError['merchant_name'] && (
              <p className="text-[#F85149] text-[12px] mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {saveError['merchant_name']}
              </p>
            )}
          </div>

          {/* 2. Max Recovery Attempts */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-[6px] p-[16px_20px]">
            <div className="flex justify-between items-center">
              <span className="text-[#E6EDF3] text-[14px] font-semibold">
                {getConfig('max_retry_attempts')?.label || 'Max Recovery Attempts'}
              </span>
              <div className="flex items-center gap-2">
                {saveSuccess['max_retry_attempts'] && (
                  <span className="text-[#3FB950] text-[12px] flex items-center gap-1 transition-opacity">
                    <Check className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
                <span className="text-[#484F58] text-[11px] font-mono">
                  {getConfig('max_retry_attempts')?.updated_at?.slice(0, 19) || ''}
                </span>
              </div>
            </div>
            <p className="text-[#8B949E] text-[12px] mt-1">
              {getConfig('max_retry_attempts')?.description ||
                'Maximum times the agent retries a single failed payment. Range: 1–3.'}
            </p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {['1', '2', '3'].map((n) => {
                const isActive = (localValues['max_retry_attempts'] || '2') === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleSave('max_retry_attempts', n)}
                    className={`py-2 px-3 text-[13px] font-medium rounded-[4px] border transition-all ${
                      isActive
                        ? 'bg-[#3395FF] border-[#3395FF] text-white shadow-sm'
                        : 'bg-[#21262D] border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3]'
                    }`}
                  >
                    {n} {n === '1' ? 'attempt' : 'attempts'}
                  </button>
                );
              })}
            </div>
            <p className="text-[#484F58] text-[11px] italic mt-2">
              Agent stops after {localValues['max_retry_attempts'] || 2} recovery attempt(s) per payment.
            </p>
            {saveError['max_retry_attempts'] && (
              <p className="text-[#F85149] text-[12px] mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {saveError['max_retry_attempts']}
              </p>
            )}
          </div>

          {/* 3. Escalation Threshold */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-[6px] p-[16px_20px]">
            <div className="flex justify-between items-center">
              <span className="text-[#E6EDF3] text-[14px] font-semibold">
                {getConfig('escalation_threshold')?.label || 'Escalation Threshold (₹)'}
              </span>
              <span className="text-[#484F58] text-[11px] font-mono">
                {getConfig('escalation_threshold')?.updated_at?.slice(0, 19) || ''}
              </span>
            </div>
            <p className="text-[#8B949E] text-[12px] mt-1">
              {getConfig('escalation_threshold')?.description ||
                'Payments above this rupee amount are always escalated to human review. Range: 1000–100000.'}
            </p>
            <div className="mt-3 relative flex items-center">
              <span className="absolute left-3 text-[#8B949E] text-[14px]">₹</span>
              <input
                type="number"
                min="1000"
                max="100000"
                step="500"
                value={localValues['escalation_threshold'] ?? '10000'}
                onChange={(e) => setLocalValues({ ...localValues, escalation_threshold: e.target.value })}
                onBlur={(e) => handleSave('escalation_threshold', e.target.value)}
                className={`w-full bg-[#0D1117] border ${
                  saveSuccess['escalation_threshold'] ? 'border-[#3FB950]' : 'border-[#30363D]'
                } text-[#E6EDF3] text-[14px] pl-8 pr-16 py-2 rounded-[4px] focus:outline-none focus:border-[#3395FF] font-mono transition-colors`}
              />
              {saveSuccess['escalation_threshold'] && (
                <div className="absolute right-3 flex items-center gap-1 text-[#3FB950] text-[12px]">
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </div>
              )}
            </div>
            <p className="text-[#484F58] text-[11px] italic mt-2">
              Payments above ₹
              {Number(localValues['escalation_threshold'] || 10000).toLocaleString('en-IN')} are escalated without auto-action.
            </p>
            {saveError['escalation_threshold'] && (
              <p className="text-[#F85149] text-[12px] mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {saveError['escalation_threshold']}
              </p>
            )}
          </div>

          {/* 4. LLM Provider */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-[6px] p-[16px_20px]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#58A6FF]" />
                <span className="text-[#E6EDF3] text-[14px] font-semibold">
                  {getConfig('llm_provider')?.label || 'LLM Provider'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {saveSuccess['llm_provider'] && (
                  <span className="text-[#3FB950] text-[12px] flex items-center gap-1 transition-opacity">
                    <Check className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
                <span className="text-[#484F58] text-[11px] font-mono">
                  {getConfig('llm_provider')?.updated_at?.slice(0, 19) || ''}
                </span>
              </div>
            </div>
            <p className="text-[#8B949E] text-[12px] mt-1">
              {getConfig('llm_provider')?.description || 'Primary AI model used for failure classification.'}
            </p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: 'MiniMax M3', value: 'openrouter/minimax' },
                { label: 'Claude Sonnet', value: 'claude-sonnet-4-6' },
                { label: 'Gemini Pro', value: 'gemini-pro' },
              ].map((p) => {
                const isActive = (localValues['llm_provider'] || 'openrouter/minimax') === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handleSave('llm_provider', p.value)}
                    className={`py-2 px-2 text-[12px] font-medium rounded-[4px] border transition-all ${
                      isActive
                        ? 'bg-[#3395FF] border-[#3395FF] text-white shadow-sm'
                        : 'bg-[#21262D] border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3]'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            {saveError['llm_provider'] && (
              <p className="text-[#F85149] text-[12px] mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {saveError['llm_provider']}
              </p>
            )}
          </div>

          {/* 5. Agent Poll Interval */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-[6px] p-[16px_20px]">
            <div className="flex justify-between items-center">
              <span className="text-[#E6EDF3] text-[14px] font-semibold">
                {getConfig('agent_poll_interval')?.label || 'Agent Poll Interval (sec)'}
              </span>
              <span className="text-[#484F58] text-[11px] font-mono">
                {getConfig('agent_poll_interval')?.updated_at?.slice(0, 19) || ''}
              </span>
            </div>
            <p className="text-[#8B949E] text-[12px] mt-1">
              {getConfig('agent_poll_interval')?.description ||
                'How often the background agent scans for new failures. Range: 10–120.'}
            </p>
            <div className="mt-3 relative flex items-center">
              <input
                type="number"
                min="10"
                max="120"
                step="5"
                value={localValues['agent_poll_interval'] ?? '30'}
                onChange={(e) => setLocalValues({ ...localValues, agent_poll_interval: e.target.value })}
                onBlur={(e) => handleSave('agent_poll_interval', e.target.value)}
                className={`w-full bg-[#0D1117] border ${
                  saveSuccess['agent_poll_interval'] ? 'border-[#3FB950]' : 'border-[#30363D]'
                } text-[#E6EDF3] text-[14px] p-[8px_12px] rounded-[4px] focus:outline-none focus:border-[#3395FF] font-mono transition-colors`}
              />
              {saveSuccess['agent_poll_interval'] && (
                <div className="absolute right-3 flex items-center gap-1 text-[#3FB950] text-[12px]">
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </div>
              )}
            </div>
            <p className="text-[#484F58] text-[11px] italic mt-2">
              Agent scans for new failures every {localValues['agent_poll_interval'] || 30} seconds.
            </p>
            {saveError['agent_poll_interval'] && (
              <p className="text-[#F85149] text-[12px] mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {saveError['agent_poll_interval']}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
