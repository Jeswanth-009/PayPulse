/* ── StorefrontModal v3.0 — Ultra-Modern Interactive Storefront & Autonomous Recovery Demo ── */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  ShoppingBag,
  CreditCard,
  Smartphone,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Star,
  Truck,
  RotateCcw,
  QrCode,
  Zap,
  Check,
} from 'lucide-react';
import { useStudioFire, useSimulatePay } from '../api/client';

interface Product {
  id: string;
  name: string;
  tagline: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  badge: string;
  category: string;
  color: string;
  features: string[];
}

const DEMO_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Titanium Apex Smartwatch Pro',
    tagline: 'Military-Grade Titanium · 1.96" AMOLED · Dual GPS',
    price: 2499,
    originalPrice: 4999,
    rating: 4.9,
    reviews: 1420,
    badge: 'Best Seller',
    category: 'Flagship Wearable',
    color: 'Space Black',
    features: ['14-Day Battery', 'Sapphire Glass', '5ATM Waterproof'],
  },
  {
    id: 'prod_2',
    name: 'SonicPro Spatial ANC Headphones',
    tagline: 'Lossless Audio · 45dB Active Noise Cancellation',
    price: 4999,
    originalPrice: 9999,
    rating: 4.8,
    reviews: 890,
    badge: 'Editor Choice',
    category: 'Studio Acoustics',
    color: 'Midnight Silver',
    features: ['Spatial Audio', '40mm Beryllium Drivers', '60hr Playtime'],
  },
  {
    id: 'prod_3',
    name: 'UrbanCraft Nomad Backpack',
    tagline: 'Waterproof Cordura® · Integrated TSA Lock · 28L',
    price: 1499,
    originalPrice: 2999,
    rating: 4.9,
    reviews: 2310,
    badge: 'Trending',
    category: 'Travel & Tech',
    color: 'Matte Obsidian',
    features: ['16" Laptop Sleeve', 'USB Charging Port', 'Ergonomic AirMesh'],
  },
];

interface StorefrontModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSimulator?: (paymentId: string) => void;
}

export const StorefrontModal: React.FC<StorefrontModalProps> = ({
  isOpen,
  onClose,
  onOpenSimulator,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product>(DEMO_PRODUCTS[0]);
  const [customerName, setCustomerName] = useState('Priya Sharma');
  const [customerContact, setCustomerContact] = useState('+91 98765 43210');
  const [checkoutMethod, setCheckoutMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [step, setStep] = useState<'catalog' | 'checkout' | 'failure' | 'recovered'>('catalog');
  const [interceptedResult, setInterceptedResult] = useState<any | null>(null);

  const studioFire = useStudioFire();
  const simulatePay = useSimulatePay();

  if (!isOpen) return null;

  const handleTriggerFailure = async (presetKey: string) => {
    setStep('failure');
    try {
      const result = await studioFire.mutateAsync({ preset: presetKey });
      setInterceptedResult(result);
    } catch (err) {
      console.error('Failed to trigger failure:', err);
    }
  };

  const handleCompleteRecovery = async () => {
    if (!interceptedResult?.payment_id) return;
    try {
      await simulatePay.mutateAsync(interceptedResult.payment_id);
      setStep('recovered');
    } catch (err) {
      console.error('Failed to simulate pay:', err);
    }
  };

  const resetFlow = () => {
    setStep('catalog');
    setInterceptedResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="bg-[#090D16] border border-[#222F46] rounded-[18px] w-full max-w-[940px] max-h-[92vh] overflow-y-auto shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col relative"
      >
        {/* Top Navbar */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-[#1A2538] bg-[#0E1524]/90 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-tr from-[#38BDF8] to-[#3B82F6] flex items-center justify-center shadow-lg shadow-[#38BDF8]/20">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[#F0F6FC] text-[15px] font-bold tracking-tight">
                  LUMEN AUDIO & TECH STORE
                </span>
                <span className="text-[10px] font-mono font-bold bg-[#10B981]/15 text-[#10B981] px-2 py-0.5 rounded-[4px] border border-[#10B981]/30">
                  Interactive Demo
                </span>
              </div>
              <span className="text-[#94A3B8] text-[11px] block">
                Razorpay Checkout Sandbox · Powered by PayPulse Autonomous Recovery
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#F0F6FC] p-2 rounded-[8px] hover:bg-[#182234] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* STEP 1: PREMIUM STOREFRONT CATALOG */}
          {step === 'catalog' && (
            <div className="space-y-6">
              {/* Promo Banner */}
              <div className="bg-gradient-to-r from-[#182234] via-[#101E35] to-[#182234] border border-[#38BDF8]/30 rounded-[12px] p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-[#38BDF8] text-black px-2 py-0.5 rounded-[3px] uppercase">
                      Flash Sale
                    </span>
                    <span className="text-[#F0F6FC] font-bold text-[13px]">
                      50% OFF All Flagship Gear
                    </span>
                  </div>
                  <p className="text-[#94A3B8] text-[11px]">
                    Select an item below to simulate a real-time checkout failure and watch PayPulse recover it instantly.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-[#566782]">
                  <span className="flex items-center gap-1 text-[#10B981]">
                    <Truck size={13} /> Free Express Delivery
                  </span>
                </div>
              </div>

              {/* Product Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DEMO_PRODUCTS.map((prod) => {
                  const isSelected = selectedProduct.id === prod.id;
                  return (
                    <div
                      key={prod.id}
                      onClick={() => setSelectedProduct(prod)}
                      className={`p-5 rounded-[14px] border cursor-pointer transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#101A2D] border-[#38BDF8] shadow-xl shadow-[#38BDF8]/15 ring-2 ring-[#38BDF8]'
                          : 'bg-[#101623] border-[#222F46] hover:border-[#566782] hover:bg-[#141D2E]'
                      }`}
                    >
                      <div>
                        {/* Badge & Rating */}
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-mono font-bold bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 px-2 py-0.5 rounded-[4px]">
                            {prod.badge}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] font-mono text-[#F59E0B]">
                            <Star size={12} className="fill-[#F59E0B]" />
                            <span className="font-bold">{prod.rating}</span>
                            <span className="text-[#566782]">({prod.reviews})</span>
                          </div>
                        </div>

                        {/* Title & Tagline */}
                        <span className="text-[#566782] text-[10px] font-mono uppercase font-bold tracking-wider block">
                          {prod.category}
                        </span>
                        <h3 className="text-[#F0F6FC] text-[15px] font-bold mt-0.5 leading-snug">
                          {prod.name}
                        </h3>
                        <p className="text-[#94A3B8] text-[11px] mt-1 line-clamp-2 leading-relaxed">
                          {prod.tagline}
                        </p>

                        {/* Feature Pills */}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {prod.features.map((f) => (
                            <span
                              key={f}
                              className="text-[10px] font-mono bg-[#182234] text-[#94A3B8] px-2 py-0.5 rounded-[4px] border border-[#222F46]"
                            >
                              ✓ {f}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Pricing & Selection Strip */}
                      <div className="mt-5 pt-3 border-t border-[#1A2538] flex items-center justify-between">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[#10B981] font-mono text-[18px] font-extrabold">
                              ₹{prod.price.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[#566782] font-mono text-[12px] line-through">
                              ₹{prod.originalPrice.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#10B981] font-mono">Inclusive of GST</span>
                        </div>

                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-[#38BDF8] border-[#38BDF8] text-white shadow-md'
                              : 'border-[#222F46] bg-[#182234]'
                          }`}
                        >
                          {isSelected && <Check size={14} className="text-black font-bold" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Customer Checkout Form */}
              <div className="bg-[#101623] border border-[#222F46] rounded-[12px] p-5 space-y-4">
                <span className="text-[#94A3B8] text-[12px] font-bold uppercase tracking-wider block">
                  Customer Shipping & WhatsApp Recovery Destination
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[#94A3B8] text-[11px] font-medium block mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-[#182234] border border-[#222F46] text-[#F0F6FC] text-[13px] px-3.5 py-2.5 rounded-[8px] focus:outline-none focus:border-[#38BDF8] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[#94A3B8] text-[11px] font-medium block mb-1.5">
                      WhatsApp Phone Number (For Instant AI Recovery)
                    </label>
                    <input
                      type="text"
                      value={customerContact}
                      onChange={(e) => setCustomerContact(e.target.value)}
                      className="w-full bg-[#182234] border border-[#222F46] text-[#F0F6FC] text-[13px] px-3.5 py-2.5 rounded-[8px] font-mono focus:outline-none focus:border-[#38BDF8] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Proceed to Razorpay Checkout CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 text-[11px] text-[#566782] font-mono">
                  <ShieldCheck size={14} className="text-[#10B981]" />
                  <span>256-Bit SSL Encrypted Razorpay Sandbox Checkout</span>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="btn btn-primary py-3 px-8 text-[14px] flex items-center justify-center gap-2 shadow-xl shadow-[#38BDF8]/25 cursor-pointer"
                >
                  <span>Proceed to Razorpay Checkout (₹{selectedProduct.price.toLocaleString('en-IN')})</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SIMULATED RAZORPAY PAYMENT SHEET */}
          {step === 'checkout' && (
            <div className="space-y-6 max-w-[680px] mx-auto">
              <div className="bg-[#090D16] border-2 border-[#3395FF]/60 rounded-[16px] shadow-2xl overflow-hidden">
                {/* Razorpay Brand Header */}
                <div className="bg-[#0C1527] p-4 px-6 border-b border-[#1A2538] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[6px] bg-[#3395FF] flex items-center justify-center font-extrabold text-white text-[14px]">
                      R
                    </div>
                    <div>
                      <span className="font-bold text-[#F0F6FC] text-[14px] block leading-none">
                        Razorpay Standard Checkout
                      </span>
                      <span className="text-[10px] font-mono text-[#3395FF]">Testnet Environment</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[#94A3B8] text-[10px] block">Amount Due</span>
                    <span className="text-[#F0F6FC] font-mono font-extrabold text-[16px]">
                      ₹{selectedProduct.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Simulated Payment Methods Strip */}
                <div className="p-5 space-y-5">
                  <div className="flex border-b border-[#222F46] gap-2 pb-2">
                    <button
                      type="button"
                      onClick={() => setCheckoutMethod('upi')}
                      className={`pb-2 px-3 text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        checkoutMethod === 'upi'
                          ? 'text-[#38BDF8] border-b-2 border-[#38BDF8]'
                          : 'text-[#94A3B8] hover:text-[#F0F6FC]'
                      }`}
                    >
                      <Smartphone size={14} /> UPI / QR Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutMethod('card')}
                      className={`pb-2 px-3 text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        checkoutMethod === 'card'
                          ? 'text-[#38BDF8] border-b-2 border-[#38BDF8]'
                          : 'text-[#94A3B8] hover:text-[#F0F6FC]'
                      }`}
                    >
                      <CreditCard size={14} /> Cards
                    </button>
                  </div>

                  {/* Payment Simulator Box */}
                  <div className="bg-[#101623] border border-[#222F46] rounded-[10px] p-4 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center mx-auto text-[#38BDF8]">
                      <QrCode size={24} />
                    </div>
                    <div>
                      <h4 className="text-[#F0F6FC] font-bold text-[14px]">
                        Scan to Pay or Authorize via App
                      </h4>
                      <p className="text-[#94A3B8] text-[11px] max-w-[340px] mx-auto mt-0.5">
                        Order #{Math.floor(100000 + Math.random() * 900000)} · Paying to Lumen Tech Store
                      </p>
                    </div>
                  </div>

                  {/* FAILURE INJECTION TESTER BAR */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#F59E0B] text-[12px] font-bold flex items-center gap-1.5">
                        <Zap size={14} />
                        Simulate Payment Dropout Condition:
                      </span>
                      <span className="text-[10px] font-mono text-[#566782]">Choose 1 to test</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        disabled={studioFire.isPending}
                        onClick={() => handleTriggerFailure('bank_timeout')}
                        className="p-3.5 rounded-[10px] bg-[#182234] border border-[#F59E0B]/40 hover:border-[#F59E0B] text-left hover:bg-[#202D44] transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 text-[#F59E0B] font-bold text-[12px] mb-1">
                          <CreditCard size={14} />
                          <span>Bank Timeout</span>
                        </div>
                        <p className="text-[#94A3B8] text-[11px] leading-snug">
                          HDFC/SBI server timeout during OTP auth.
                        </p>
                        <span className="text-[#F59E0B] text-[10px] font-mono font-bold mt-2 inline-block group-hover:translate-x-1 transition-transform">
                          Trigger Timeout ➔
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={studioFire.isPending}
                        onClick={() => handleTriggerFailure('upi_dropped')}
                        className="p-3.5 rounded-[10px] bg-[#182234] border border-[#38BDF8]/40 hover:border-[#38BDF8] text-left hover:bg-[#202D44] transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 text-[#38BDF8] font-bold text-[12px] mb-1">
                          <Smartphone size={14} />
                          <span>UPI Dropped</span>
                        </div>
                        <p className="text-[#94A3B8] text-[11px] leading-snug">
                          GPay/PhonePe collect timeout without approval.
                        </p>
                        <span className="text-[#38BDF8] text-[10px] font-mono font-bold mt-2 inline-block group-hover:translate-x-1 transition-transform">
                          Trigger Drop ➔
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={studioFire.isPending}
                        onClick={() => handleTriggerFailure('card_declined')}
                        className="p-3.5 rounded-[10px] bg-[#182234] border border-[#EF4444]/40 hover:border-[#EF4444] text-left hover:bg-[#202D44] transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 text-[#EF4444] font-bold text-[12px] mb-1">
                          <AlertTriangle size={14} />
                          <span>Card Declined</span>
                        </div>
                        <p className="text-[#94A3B8] text-[11px] leading-snug">
                          Hard limit decline triggering alternate method.
                        </p>
                        <span className="text-[#EF4444] text-[10px] font-mono font-bold mt-2 inline-block group-hover:translate-x-1 transition-transform">
                          Trigger Decline ➔
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep('catalog')}
                  className="btn btn-secondary text-[12px] py-2 px-4 cursor-pointer"
                >
                  ← Back to Storefront
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: FAILURE INTERCEPTED & INSTANT AI RECOVERY */}
          {step === 'failure' && (
            <div className="space-y-5">
              {studioFire.isPending || !interceptedResult ? (
                <div className="py-14 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-[#38BDF8] animate-spin" />
                    <Sparkles className="w-5 h-5 text-[#10B981] absolute -top-1 -right-1 animate-ping" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[#F0F6FC] text-[17px] font-bold">
                      Payment Failure Intercepted by PayPulse Autonomous Engine...
                    </h3>
                    <p className="text-[#94A3B8] text-[12px] font-mono max-w-[480px] mx-auto">
                      MiniMax M3 diagnosing root cause · Minting single-click Razorpay payment recovery link · Generating Hinglish customer reassurance
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  {/* Left: AI Diagnosis & Recovery Blueprint */}
                  <div className="bg-[#101623] border border-[#222F46] rounded-[14px] p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-[#1A2538] pb-3">
                      <span className="text-[#EF4444] text-[13px] font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        Dropout Intercepted
                      </span>
                      <span className="text-[#10B981] text-[11px] font-mono bg-[#10B981]/15 border border-[#10B981]/30 px-2.5 py-0.5 rounded-[4px] font-bold">
                        ⚡ AI Dispatched (&lt;1.8s)
                      </span>
                    </div>

                    <div className="space-y-2.5 text-[12px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-[#94A3B8]">Payment ID:</span>
                        <span className="text-[#F0F6FC] font-bold">{interceptedResult.payment_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#94A3B8]">Classified Type:</span>
                        <span className="text-[#F59E0B] font-bold">{interceptedResult.classification.failure_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#94A3B8]">Autonomous Action:</span>
                        <span className="text-[#38BDF8] font-bold">{interceptedResult.action_taken}</span>
                      </div>
                    </div>

                    <div className="bg-[#182234] border-l-2 border-[#38BDF8] p-3 rounded-[0_6px_6px_0] text-[12px] text-[#94A3B8] italic leading-relaxed">
                      &quot;{interceptedResult.classification.reasoning}&quot;
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSimulator?.(interceptedResult.payment_id);
                        }}
                        className="w-full btn btn-secondary text-[12px] py-2.5 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4 text-[#38BDF8]" />
                        <span>Inspect in Customer Phone Simulator</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Right: Customer Live WhatsApp Notification */}
                  <div className="bg-[#0B141A] border border-[#128C7E]/40 rounded-[14px] p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-[#2A3942] pb-3">
                      <div className="flex items-center gap-2 text-[#25D366] text-[13px] font-bold">
                        <Smartphone className="w-4 h-4" />
                        <span>Customer&apos;s WhatsApp Notification</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8696A0]">Just Now</span>
                    </div>

                    {/* WhatsApp Chat Bubble */}
                    <div className="bg-[#202C33] border border-[#2A3942] rounded-[12px_12px_12px_2px] p-3.5 text-[12px] text-[#E9EDEF] space-y-2 shadow-md">
                      <p className="whitespace-pre-line leading-relaxed font-sans">
                        {interceptedResult.customer_message?.whatsapp ||
                          `Hi ${customerName} 👋\n\nAapka ₹${selectedProduct.price} ka payment nahi ho paya — koi baat nahi!\n\nNiche diye link se 1-click me complete karein:\n${interceptedResult.payment_link_url}`}
                      </p>
                      <div className="text-right text-[#8696A0] text-[9px] font-mono">
                        10:42 AM · <span className="text-[#53BDEB] font-bold">✓✓</span>
                      </div>
                    </div>

                    {/* 1-Click Customer Payment Resolution */}
                    <button
                      type="button"
                      disabled={simulatePay.isPending}
                      onClick={handleCompleteRecovery}
                      className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-bold text-[13px] py-3 px-4 rounded-[8px] flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/25 transition-all cursor-pointer"
                    >
                      {simulatePay.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Capturing Payment in Razorpay...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-white" />
                          <span>Simulate Customer Paying Recovery Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: RECOVERED SUCCESS CELEBRATION */}
          {step === 'recovered' && (
            <div className="py-8 text-center space-y-5 max-w-[540px] mx-auto">
              <div className="w-16 h-16 bg-[#10B981]/20 border-2 border-[#10B981] rounded-full flex items-center justify-center mx-auto text-[#10B981] shadow-xl shadow-[#10B981]/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold text-[#10B981] uppercase tracking-wider bg-[#10B981]/15 px-3 py-1 rounded-[4px] border border-[#10B981]/30">
                  🎉 100% Autonomous Closed-Loop Recovery
                </span>
                <h2 className="text-[#F0F6FC] text-[22px] font-bold pt-2">
                  Order Successfully Captured & Recovered!
                </h2>
                <p className="text-[#94A3B8] text-[13px] leading-relaxed">
                  The customer paid via the recovery link. Reclaimed revenue: <strong className="font-mono text-[#10B981]">₹{selectedProduct.price.toLocaleString('en-IN')}</strong>. Live dashboard metrics, revenue projections, and the Audit Trail were updated in real time.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={resetFlow}
                  className="btn btn-secondary text-[13px] py-2.5 px-5 cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>Test Another Order</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-primary text-[13px] py-2.5 px-6 cursor-pointer"
                >
                  <span>View in Command Center</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
