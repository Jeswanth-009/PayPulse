# PayPulse — 3-Minute Hackathon Demo & Pitch Script ⚡
### Razorpay AI Buildathon 2026 Presentation Guide

---

## 🎬 3-Minute Video / Live Presentation Outline

### **0:00 – 0:30 · The Problem (The ₹10,000 Cr Leak)**
- **Hook:** *"Over 30% of Indian e-commerce checkouts fail due to transient bank server timeouts, UPI app dropouts, and OTP expiration. That's over ₹10,000 Crores in lost GMV annually."*
- **The Core Flaw of Existing Solutions:** *"Traditional checkout systems either retry blindly—spamming customers and incurring high gateway fees—or completely abandon the buyer."*
- **Introducing PayPulse:** *"PayPulse is an autonomous AI agent built on Razorpay that detects failures in real time, diagnoses root causes with LLMs (MiniMax M3), generates localized WhatsApp recovery links, and enforces merchant policy guardrails."*

---

### **0:30 – 1:30 · The "Aha!" Moment (Live Storefront Checkout Demo)**
1. **Open Storefront Demo:**
   - Click **`🛍️ Storefront Checkout Demo`** at the top of the Dashboard.
   - Select the **Titanium Apex Smartwatch (₹2,499)** for customer **Priya Sharma**.
   - Click **"Proceed to Razorpay Checkout"**.
2. **Trigger Real Failure:**
   - Click **`Simulate Bank Timeout (GATEWAY_ERROR)`**.
   - Show the checkout failing.
3. **The Agent Intercepts (< 2 seconds):**
   - Show the live interception panel:
     - *"Root Cause: SOFT (Bank Gateway Timeout)"*
     - *"Action: IMMEDIATE_RETRY"*
     - *"AI Model: MiniMax M3"*
4. **The WhatsApp Customer Experience:**
   - Show the incoming WhatsApp preview with conversational Hinglish copy:  
     *"Hi Priya 👋, aapka ₹2,499 ka payment nahi ho paya — koi baat nahi! Niche diye link se 1-click me complete karein: https://rzp.io/..."*
5. **The Resolution:**
   - Click **`⚡ Simulate Customer Paying Link`**.
   - Watch the order transition to **"100% Recovered"**, and see the live toast appear in the top-right corner!

---

### **1:30 – 2:15 · The Merchant Command Center & Autonomous Batch Engine**
1. **Live Agent Feed & Real-Time Telemetry:**
   - Point out the active green beacon (**Agent Active**), real-time 1-second polling, and live audit entries.
2. **Failure Studio Sandbox:**
   - Open **`Failure Studio`** from the top header.
   - Fire **`UPI PSP Dropped`** or **`Card Declined (Hard Failure)`**.
   - Explain how the agent switches strategy dynamically:
     - *Hard Failures* $\rightarrow$ alternative payment methods link.
     - *VIP / High-Value Orders (>₹10,000)* $\rightarrow$ flagged for human escalation.
3. **Customer Simulator Studio (`/simulator`):**
   - Click **`📱 Phone Simulator`** in the left sidebar to showcase the high-fidelity smartphone preview, WhatsApp vs. SMS character guardrails ($\le 300$/$160$ chars), and LLM personalization rationale.

---

### **2:15 – 3:00 · Merchant ROI & Policy Governance**
1. **Merchant ROI Calculator:**
   - Scroll to the interactive ROI slider on the Dashboard.
   - Drag GMV to **₹10 Crore/month** $\rightarrow$ show **₹24.9 Lakhs saved per month** based on RBI 7.5% baseline failure rates.
2. **Policy Studio (`/policy`):**
   - Open **`Policy Studio`**.
   - Demonstrate runtime merchant control: adjust max retry limits (1–3), escalation thresholds, and LLM providers.
3. **Closing Statement:**
   - *"PayPulse turns lost checkouts into completed revenue autonomously, safely, and empathetically. Detect. Decide. Recover."*

---

## 🏆 Key Talking Points for Judges

| Evaluation Criteria | How PayPulse Wins |
| :--- | :--- |
| **Real Razorpay API Integration** | Real test orders, payment links, and HMAC-SHA256 webhook validation. |
| **AI Value-Add (Not just if/else)** | Contextual root-cause classification, stopping rule reasoning, and personalized Hinglish/English customer copy generation. |
| **Complete Closed-Loop Product** | Storefront demo $\rightarrow$ failure $\rightarrow$ agent interception $\rightarrow$ phone simulator $\rightarrow$ resolution. |
| **Merchant Safety & Governance** | Policy Studio runtime limits, stopping rules ($\le 2$ attempts), and automated escalation for high-value orders. |
| **Production-Grade Aesthetics** | Dark glassmorphic fintech design, glowing status beacons, and 17/17 automated test coverage. |
