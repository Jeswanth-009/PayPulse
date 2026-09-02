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
} from 'lucide-react';
import { useStudioFire, useSimulatePay } from '../api/client';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  badge: string;
  category: string;
}

const DEMO_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Titanium Apex Smartwatch Pro',
    price: 2499,
    originalPrice: 4999,
    image: '⌚',
    badge: 'Best Seller',
    category: 'Wearables',
  },
  {
    id: 'prod_2',
    name: 'SonicPro Hybrid ANC Headphones',
    price: 4999,
    originalPrice: 9999,
    image: '🎧',
    badge: 'Popular',
    category: 'Audio',
  },
  {
    id: 'prod_3',
    name: 'UrbanCraft Tech Commuter Pack',
    price: 1499,
    originalPrice: 2999,
    image: '🎒',
    badge: 'Trending',
    category: 'Accessories',
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
  const [customerContact, setCustomerContact] = useState('+919876543210');
  const [step, setStep] = useState<'catalog' | 'checkout' | 'failure' | 'recovered'>('catalog');
  const [interceptedResult, setInterceptedResult] = useState<any | null>(null);

  const studioFire = useStudioFire();
  const simulatePay = useSimulatePay();

  if (!isOpen) return null;

  const handleTriggerFailure = async (presetKey: string) => {
    setStep('failure');

    try {
      const result = await studioFire.mutateAsync({
        preset: presetKey,
      });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[#101623] border border-[#222F46] rounded-[14px] w-full max-w-[860px] max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-[#222F46] bg-[#090D16]/50">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#38BDF8]/15 border border-[#38BDF8]/30 p-2 rounded-[8px]">
              <ShoppingBag className="w-5 h-5 text-[#38BDF8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[#F0F6FC] text-[16px] font-bold">
                  Interactive Merchant Storefront Demo
                </span>
                <span className="text-[10px] font-mono font-bold bg-[#10B981]/15 text-[#10B981] px-2 py-0.5 rounded-[4px] border border-[#10B981]/30">
                  Live End-to-End Flow
                </span>
              </div>
              <span className="text-[#94A3B8] text-[12px]">
                Simulate a real checkout dropout and experience PayPulse recover it in under 3 seconds.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#566782] hover:text-[#F0F6FC] p-1.5 rounded-[6px] hover:bg-[#182234] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* STEP 1: CATALOG VIEW */}
          {step === 'catalog' && (
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-[#94A3B8] text-[12px] font-bold uppercase tracking-wider">
                  Select a Product to Checkout
                </span>
                <span className="text-[#38BDF8] text-[12px] font-mono">
                  Store: UrbanStore India (Demo)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DEMO_PRODUCTS.map((product) => {
                  const isSelected = selectedProduct.id === product.id;
                  return (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className={`p-4 rounded-[10px] border cursor-pointer transition-all relative ${
                        isSelected
                          ? 'bg-[#182234] border-[#38BDF8] shadow-lg shadow-[#38BDF8]/10 ring-1 ring-[#38BDF8]'
                          : 'bg-[#101623] border-[#222F46] hover:border-[#566782] hover:bg-[#182234]/40'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-4xl">{product.image}</span>
                        <span className="text-[10px] font-bold font-mono bg-[#38BDF8]/10 text-[#38BDF8] px-2 py-0.5 rounded-[4px]">
                          {product.badge}
                        </span>
                      </div>
                      <span className="text-[#566782] text-[11px] font-medium uppercase block">
                        {product.category}
                      </span>
                      <h3 className="text-[#F0F6FC] text-[14px] font-bold mt-0.5 line-clamp-1">
                        {product.name}
                      </h3>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-[#10B981] font-mono text-[16px] font-bold">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[#566782] font-mono text-[12px] line-through">
                          ₹{product.originalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Customer input row */}
              <div className="bg-[#182234] border border-[#222F46] p-4 rounded-[10px] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[#94A3B8] text-[11px] font-medium block mb-1">
                    Buyer Full Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#101623] border border-[#222F46] text-[#F0F6FC] text-[13px] px-3 py-2 rounded-[6px] focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
                <div>
                  <label className="text-[#94A3B8] text-[11px] font-medium block mb-1">
                    WhatsApp / Phone Number
                  </label>
                  <input
                    type="text"
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                    className="w-full bg-[#101623] border border-[#222F46] text-[#F0F6FC] text-[13px] px-3 py-2 rounded-[6px] font-mono focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="btn btn-primary py-2.5 px-6 text-[14px] flex items-center gap-2"
                >
                  <span>Proceed to Razorpay Checkout (₹{selectedProduct.price})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SIMULATED RAZORPAY CHECKOUT WITH FAILURE TRIGGERS */}
          {step === 'checkout' && (
            <div className="space-y-5">
              <div className="bg-[#090D16] border border-[#3395FF]/40 rounded-[12px] p-5 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#222F46] pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[14px] text-[#3395FF]">Razorpay</span>
                    <span className="text-[11px] bg-[#3395FF]/10 text-[#3395FF] px-1.5 py-0.5 rounded-[4px] font-mono">
                      Test Mode
                    </span>
                  </div>
                  <span className="text-[#F0F6FC] font-mono font-bold text-[15px]">
                    ₹{selectedProduct.price.toLocaleString('en-IN')}
                  </span>
                </div>

                <p className="text-[#94A3B8] text-[12px] mb-4">
                  Simulate how an actual checkout failure behaves. Choose a failure condition to test PayPulse&apos;s autonomous AI response:
                </p>

                {/* Failure Simulator Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    disabled={studioFire.isPending}
                    onClick={() => handleTriggerFailure('bank_timeout')}
                    className="p-3.5 rounded-[8px] bg-[#182234] border border-[#F59E0B]/40 hover:border-[#F59E0B] text-left hover:bg-[#202D44] transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-4 h-4 text-[#F59E0B]" />
                      <span className="text-[#F0F6FC] text-[12px] font-bold">
                        Bank Server Timeout
                      </span>
                    </div>
                    <span className="text-[#94A3B8] text-[11px] block leading-snug">
                      Simulates transient HDFC/SBI bank gateway failure during card verification.
                    </span>
                    <span className="text-[#F59E0B] text-[10px] font-mono font-semibold mt-2 inline-block">
                      Trigger Failure ➔
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={studioFire.isPending}
                    onClick={() => handleTriggerFailure('upi_dropped')}
                    className="p-3.5 rounded-[8px] bg-[#182234] border border-[#38BDF8]/40 hover:border-[#38BDF8] text-left hover:bg-[#202D44] transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Smartphone className="w-4 h-4 text-[#38BDF8]" />
                      <span className="text-[#F0F6FC] text-[12px] font-bold">
                        UPI PSP Dropped
                      </span>
                    </div>
                    <span className="text-[#94A3B8] text-[11px] block leading-snug">
                      Simulates GPay/PhonePe collect timeout without customer approval.
                    </span>
                    <span className="text-[#38BDF8] text-[10px] font-mono font-semibold mt-2 inline-block">
                      Trigger Failure ➔
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={studioFire.isPending}
                    onClick={() => handleTriggerFailure('card_declined')}
                    className="p-3.5 rounded-[8px] bg-[#182234] border border-[#EF4444]/40 hover:border-[#EF4444] text-left hover:bg-[#202D44] transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                      <span className="text-[#F0F6FC] text-[12px] font-bold">
                        Card Declined
                      </span>
                    </div>
                    <span className="text-[#94A3B8] text-[11px] block leading-snug">
                      Simulates hard card decline requiring alternative payment method link.
                    </span>
                    <span className="text-[#EF4444] text-[10px] font-mono font-semibold mt-2 inline-block">
                      Trigger Failure ➔
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep('catalog')}
                  className="btn btn-secondary text-[12px]"
                >
                  ← Back to Storefront
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: FAILURE INTERCEPTED & AUTONOMOUS RECOVERY */}
          {step === 'failure' && (
            <div className="space-y-4">
              {studioFire.isPending || !interceptedResult ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                  <Loader2 className="w-8 h-8 text-[#38BDF8] animate-spin" />
                  <div>
                    <h3 className="text-[#F0F6FC] text-[15px] font-bold">
                      Payment Failure Intercepted by PayPulse...
                    </h3>
                    <p className="text-[#94A3B8] text-[12px] mt-1 font-mono">
                      Diagnosing root cause with MiniMax M3 · Generating personalized WhatsApp copy · Minting recovery link
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  {/* Left: Interception Summary */}
                  <div className="bg-[#182234] border border-[#222F46] rounded-[10px] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#222F46] pb-2">
                      <span className="text-[#EF4444] text-[12px] font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        Checkout Failed
                      </span>
                      <span className="text-[#10B981] text-[11px] font-mono bg-[#10B981]/15 px-2 py-0.5 rounded-[4px] font-bold">
                        AI Agent Recovered
                      </span>
                    </div>

                    <div className="space-y-2 text-[12px]">
                      <div className="flex justify-between">
                        <span className="text-[#94A3B8]">Payment ID:</span>
                        <span className="font-mono text-[#F0F6FC]">{interceptedResult.payment_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#94A3B8]">Root Cause:</span>
                        <span className="font-mono text-[#F59E0B] font-semibold">{interceptedResult.classification.failure_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#94A3B8]">Action Taken:</span>
                        <span className="font-mono text-[#38BDF8] font-semibold">{interceptedResult.action_taken}</span>
                      </div>
                    </div>

                    <div className="bg-[#101623] border-l-2 border-[#38BDF8] p-2.5 rounded-[0_4px_4px_0] text-[11px] text-[#94A3B8] italic">
                      &quot;{interceptedResult.classification.reasoning}&quot;
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSimulator?.(interceptedResult.payment_id);
                        }}
                        className="w-full btn btn-secondary text-[12px] py-2 flex items-center justify-center gap-2"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-[#38BDF8]" />
                        <span>Inspect in Full Phone Simulator</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Right: Live Customer WhatsApp Message Preview */}
                  <div className="bg-[#075E54]/20 border border-[#128C7E]/40 rounded-[10px] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#128C7E]/30 pb-2">
                      <div className="flex items-center gap-1.5 text-[#10B981] text-[12px] font-bold">
                        <Smartphone className="w-4 h-4" />
                        <span>Customer&apos;s WhatsApp Notification</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#566782]">Delivered 10:41 AM</span>
                    </div>

                    {/* WhatsApp Chat Bubble */}
                    <div className="bg-[#1F2C34] border border-[#2A3942] rounded-[8px] p-3 text-[12px] text-[#E9EDEF] space-y-2 shadow-md">
                      <p className="whitespace-pre-line leading-relaxed">
                        {interceptedResult.customer_message?.whatsapp ||
                          `Hi ${customerName} 👋\n\nAapka ₹${selectedProduct.price} ka payment complete nahi hua — koi baat nahi!\n\nNiche diye link se retry karein:\n${interceptedResult.payment_link_url}`}
                      </p>
                    </div>

                    {/* Simulate Customer Click & Pay Button */}
                    <button
                      type="button"
                      disabled={simulatePay.isPending}
                      onClick={handleCompleteRecovery}
                      className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[13px] py-2.5 px-4 rounded-[6px] flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/25 transition-all cursor-pointer"
                    >
                      {simulatePay.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Simulating Customer Payment...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Simulate Customer Paying Recovery Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: RECOVERED SUCCESS SCREEN */}
          {step === 'recovered' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-[#10B981]/20 border border-[#10B981]/40 rounded-full flex items-center justify-center mx-auto text-[#10B981]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold text-[#10B981] uppercase tracking-wider bg-[#10B981]/15 px-2.5 py-1 rounded-[4px] border border-[#10B981]/30">
                  🎉 100% Autonomous Recovery Succeeded
                </span>
                <h2 className="text-[#F0F6FC] text-[20px] font-bold mt-2">
                  Order Successfully Paid & Recovered!
                </h2>
                <p className="text-[#94A3B8] text-[13px] max-w-[480px] mx-auto mt-1">
                  The customer paid via the autonomous recovery link. Money saved: <span className="font-mono text-[#10B981] font-bold">₹{selectedProduct.price.toLocaleString('en-IN')}</span>. Dashboard telemetry and Audit Trail updated in real time.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetFlow}
                  className="btn btn-secondary text-[13px] py-2 px-4"
                >
                  Test Another Order
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-primary text-[13px] py-2 px-5"
                >
                  View in Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
