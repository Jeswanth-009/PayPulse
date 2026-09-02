/* ── ROICalculator v3.0 — Interactive Projected Revenue Recovery & Annual ROI Model ── */

import React, { useState, useMemo } from 'react';
import { TrendingUp, Calculator, ArrowUpRight, Zap } from 'lucide-react';
import { useBatches, useBatchReport } from '../api/client';

export const ROICalculator: React.FC = () => {
  const [sliderVal, setSliderVal] = useState<number>(33.33); // Defaults around ₹2.3 Crores GMV

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

  const INDUSTRY_FAILURE_RATE = 0.075; // 7.5% RBI average dropout rate
  const monthlyFailures = useMemo(() => monthlyGmv * INDUSTRY_FAILURE_RATE, [monthlyGmv]);
  const monthlyRecovered = useMemo(() => monthlyFailures * recoveryRate, [monthlyFailures, recoveryRate]);
  const annualRecovered = useMemo(() => monthlyRecovered * 12, [monthlyRecovered]);

  const formatRupees = (n: number): string => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
    return `₹${Math.round(n).toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-[#101623] border border-[#222F46] rounded-[12px] p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1A2538] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[#F0F6FC] text-[15px] font-bold">
              Merchant Revenue Impact & Annual ROI Projection
            </h3>
            <p className="text-[#94A3B8] text-[11px]">
              Estimate reclaimed top-line revenue based on autonomous dropout conversion.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#94A3B8] text-[11px] font-mono bg-[#182234] border border-[#222F46] px-3 py-1 rounded-[6px] flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Agent Conversion: <strong className="text-[#10B981]">{(recoveryRate * 100).toFixed(0)}%</strong></span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left (5 cols): GMV Range Slider */}
        <div className="lg:col-span-5 space-y-3 bg-[#182234] p-4.5 rounded-[10px] border border-[#222F46]">
          <div className="flex justify-between items-baseline">
            <span className="text-[#94A3B8] text-[12px] font-medium">Monthly Processing GMV</span>
            <span className="text-[#F0F6FC] text-[22px] font-bold font-mono tracking-tight text-[#38BDF8]">
              {formatRupees(monthlyGmv)}
              <span className="text-[#94A3B8] text-[12px] font-normal"> /mo</span>
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
              className="w-full h-2 bg-[#101623] rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
            />
            <div className="flex justify-between text-[#566782] text-[10px] mt-1.5 font-mono">
              <span>₹10 L</span>
              <span>₹1 Cr</span>
              <span>₹10 Cr</span>
              <span>₹100 Cr</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-[#566782] pt-1">
            *Assumes RBI average 7.5% payment failure rate
          </div>
        </div>

        {/* Right (7 cols): Projection Output Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Annual Reclaimed */}
          <div className="bg-[#182234] border border-[#10B981]/40 rounded-[10px] p-4.5 flex flex-col justify-between shadow-lg shadow-[#10B981]/5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#94A3B8] text-[11px] uppercase tracking-wider font-bold block">
                Annual Projected Recovery
              </span>
              <span className="text-[#10B981]">
                <ArrowUpRight size={14} />
              </span>
            </div>

            <div className="text-[#10B981] text-[28px] font-extrabold font-mono tracking-tight my-1">
              {formatRupees(annualRecovered)}
              <span className="text-[12px] text-[#10B981]/80 font-normal"> /year</span>
            </div>

            <span className="text-[11px] text-[#566782] font-mono">
              Net reclaimed revenue directly into merchant bank
            </span>
          </div>

          {/* Card 2: Monthly Recovered */}
          <div className="bg-[#182234] border border-[#38BDF8]/40 rounded-[10px] p-4.5 flex flex-col justify-between shadow-lg shadow-[#38BDF8]/5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#94A3B8] text-[11px] uppercase tracking-wider font-bold block">
                Monthly Saved GMV
              </span>
              <span className="text-[#38BDF8]">
                <Zap size={14} />
              </span>
            </div>

            <div className="text-[#38BDF8] text-[28px] font-extrabold font-mono tracking-tight my-1">
              {formatRupees(monthlyRecovered)}
              <span className="text-[12px] text-[#38BDF8]/80 font-normal"> /month</span>
            </div>

            <span className="text-[11px] text-[#566782] font-mono">
              ~{Math.round((monthlyRecovered / (monthlyGmv || 1)) * 100 * 10) / 10}% top-line GMV boost
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
