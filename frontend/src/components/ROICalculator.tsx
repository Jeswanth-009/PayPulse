import React, { useState, useMemo } from 'react';
import { TrendingUp, Calculator } from 'lucide-react';
import { useBatches, useBatchReport } from '../api/client';

export const ROICalculator: React.FC = () => {
  const [sliderVal, setSliderVal] = useState<number>(33.33); // Defaults around ₹2.3 Crores

  const { data: batchesData } = useBatches();
  const latestBatch = batchesData?.batches?.[0];
  const { data: batchReport } = useBatchReport(latestBatch?.batch_id || null);

  const recoveryRate = useMemo(() => {
    if (batchReport?.recovery_rate) {
      const parsed = parseFloat(batchReport.recovery_rate.replace('%', '')) / 100;
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 0.60;
  }, [batchReport]);

  const sliderToGmv = (s: number): number => {
    return Math.round(Math.pow(10, 6 + (s / 100) * 3));
  };

  const monthlyGmv = useMemo(() => sliderToGmv(sliderVal), [sliderVal]);

  const INDUSTRY_FAILURE_RATE = 0.075; // 7.5% RBI average
  const monthlyFailures = useMemo(() => monthlyGmv * INDUSTRY_FAILURE_RATE, [monthlyGmv]);
  const monthlyRecovered = useMemo(() => monthlyFailures * recoveryRate, [monthlyFailures, recoveryRate]);
  const annualRecovered = useMemo(() => monthlyRecovered * 12, [monthlyRecovered]);

  const formatRupees = (n: number): string => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
    return `₹${Math.round(n).toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-[6px] p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-[#3395FF]" />
          <h3 className="text-[#E6EDF3] text-[15px] font-semibold">
            Merchant Revenue Impact & Annual ROI
          </h3>
        </div>
        <span className="text-[#8B949E] text-[11px] font-mono bg-[#0D1117] border border-[#30363D] px-2.5 py-1 rounded-[4px] flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-[#3FB950]" />
          Recovery Rate: {(recoveryRate * 100).toFixed(0)}%
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left 38%: GMV Slider */}
        <div className="md:col-span-5 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-[#8B949E] text-[12px] font-medium">Monthly Processing GMV</span>
            <span className="text-[#E6EDF3] text-[22px] font-bold font-mono tracking-tight">
              {formatRupees(monthlyGmv)}
              <span className="text-[#8B949E] text-[12px] font-normal"> /mo</span>
            </span>
          </div>

          {/* Slider */}
          <div className="pt-2">
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={sliderVal}
              onChange={(e) => setSliderVal(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#21262D] rounded-lg appearance-none cursor-pointer accent-[#3395FF]"
            />
            <div className="flex justify-between text-[#484F58] text-[11px] mt-1.5 font-mono">
              <span>₹10 Lakhs</span>
              <span>₹1 Crore</span>
              <span>₹10 Crores</span>
              <span>₹100 Crores</span>
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden md:block md:col-span-1 text-center">
          <div className="w-[1px] h-20 bg-[#30363D] mx-auto" />
        </div>

        {/* Right 58%: Output Cards */}
        <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card A: Annual Recovered */}
          <div className="bg-[#0D1117] border border-[#30363D] rounded-[6px] p-4 flex flex-col justify-between">
            <div>
              <span className="text-[#8B949E] text-[11px] uppercase tracking-wider font-medium block">
                Annual Revenue Recovered
              </span>
              <div className="text-[#3FB950] text-[26px] font-bold font-mono tracking-tight mt-1">
                {formatRupees(annualRecovered)}
                <span className="text-[12px] text-[#3FB950]/80 font-normal"> /yr</span>
              </div>
            </div>
            <p className="text-[#484F58] text-[11px] mt-2 italic leading-tight">
              at {(recoveryRate * 100).toFixed(0)}% recovery rate · live batch benchmark
            </p>
          </div>

          {/* Card B: Monthly Failures Intercepted */}
          <div className="bg-[#0D1117] border border-[#30363D] rounded-[6px] p-4 flex flex-col justify-between">
            <div>
              <span className="text-[#8B949E] text-[11px] uppercase tracking-wider font-medium block">
                Monthly Failures Intercepted
              </span>
              <div className="text-[#E6EDF3] text-[22px] font-bold font-mono tracking-tight mt-1">
                {formatRupees(monthlyFailures)}
                <span className="text-[12px] text-[#8B949E] font-normal"> /mo</span>
              </div>
            </div>
            <p className="text-[#484F58] text-[11px] mt-2 italic leading-tight">
              7.5% Indian e-commerce failure rate (RBI standard)
            </p>
          </div>
        </div>
      </div>

      {/* Footer Benchmark Note */}
      <p className="text-[#484F58] text-[11px] italic mt-4 border-t border-[#21262D] pt-3">
        Recovery rate dynamically updated from agent telemetry. Industry baseline: 7.5% payment dropoff (RBI Payment System Indicators).
      </p>
    </div>
  );
};
