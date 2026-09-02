# PayPulse ⚡
### AI-Powered Payment Failure Recovery Agent · Razorpay AI Buildathon 2026

> **Detect. Decide. Recover.**

---

## What it does

PayPulse is an AI agent that monitors a Razorpay merchant's payment stream, classifies every failure by root cause using Claude (with rule-based fallback), picks the right recovery action, executes it via Razorpay test-mode APIs, and logs a full audit trail — reporting measured money recovered across a batch.

### Key capabilities:
- **Real-time monitoring** — polls for failed/stale payments every 30 seconds
- **LLM classification** — Claude analyzes error codes, payment method, amount, and timing to classify failures as SOFT, HARD, UPI_HANDOFF, or SESSION_TIMEOUT
- **Autonomous recovery** — creates Payment Links, schedules delayed retries, suggests alternative methods, or escalates to human review
- **Stopping rule** — never retries a customer more than twice (enforced in both executor and LLM prompt)
- **Graceful fallback** — if Claude is unavailable, falls back to deterministic rule engine (logged with confidence: 0.0)
- **Full audit trail** — every decision logged: signal → classification → action → outcome

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  Razorpay Test-Mode APIs                                           │
│  Orders API · Payments API · Payment Links API · Webhooks          │
└──────────────────────┬─────────────────────────────────────────────┘
                       │ webhook events + API polling
                       ▼
┌────────────────────────────────────────────────────────────────────┐
│  FastAPI Backend  (Python)                                         │
│                                                                    │
│  ┌─────────────────┐   ┌──────────────────┐   ┌────────────────┐  │
│  │  Webhook Handler│   │  Batch Simulator │   │  REST API      │  │
│  │  /webhook/rp    │   │  (seed + poll)   │   │  /api/v1/...   │  │
│  └────────┬────────┘   └────────┬─────────┘   └───────┬────────┘  │
│           │                     │                      │            │
│           └──────────┬──────────┘                      │            │
│                      ▼                                  │            │
│          ┌───────────────────────┐                     │            │
│          │   Payment Classifier  │◄────────────────────┘            │
│          │   (calls Claude API)  │                                  │
│          └───────────┬───────────┘                                  │
│                      │ classification + reasoning                   │
│                      ▼                                              │
│          ┌───────────────────────┐                                  │
│          │   Recovery Executor   │                                  │
│          │   picks action,       │                                  │
│          │   calls Razorpay API  │                                  │
│          └───────────┬───────────┘                                  │
│                      │                                              │
│                      ▼                                              │
│          ┌───────────────────────┐                                  │
│          │   Audit Logger        │                                  │
│          │   SQLite: every       │                                  │
│          │   signal → decision   │                                  │
│          │   → action → outcome  │                                  │
│          └───────────────────────┘                                  │
└──────────────────────────────────────────────────────────────────┬─┘
                                                                   │ REST
                                                                   ▼
┌────────────────────────────────────────────────────────────────────┐
│  React Frontend                                                    │
│  Live Agent Feed · Metrics Dashboard · Audit Trail · Batch Runner  │
└────────────────────────────────────────────────────────────────────┘
```

---

## The Agent Loop

1. **Payment enters** — created by batch simulator or received via webhook
2. **Failure detected** — monitor finds `failed` or stale `created` payments
3. **LLM classifies** — Claude analyzes error code, method, amount, attempts → outputs failure type + recommended action
4. **Recovery executed** — Executor creates Payment Link / escalates / stops (stopping rule at 2 attempts)
5. **Audit logged** — every step written to SQLite: signal → classification → action → outcome
6. **Batch report** — aggregated recovery rate, money saved, failure breakdown

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Razorpay test-mode API keys (`rzp_test_*`)
- Anthropic API key (optional — falls back to rule engine)

### Setup

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/paypulse.git
cd paypulse

# Backend
pip install -r backend/requirements.txt

# Frontend
cd frontend && npm install && cd ..

# Environment
cp .env.example .env
# Edit .env with your Razorpay and Anthropic keys
```

### Running

```bash
# Terminal 1: Backend
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 1

# Terminal 2: Frontend
cd frontend && npm run dev
```

Or with Docker:
```bash
docker compose up
```

### Running the demo batch

```bash
# From the UI: Click "Run Batch" on the Dashboard
# Or via CLI:
python -m backend.scripts.seed_batch --count 100 --failure-rate 0.25

# Then trigger the agent:
curl -X POST http://localhost:8000/api/v1/agent/run
```

---

## Metrics from a 25-payment demo run

| Metric | Value |
|--------|-------|
| Total payments | 25 |
| Total failures | 6 |
| Recovery attempted | 6 |
| Recovered / Dispatched | 5 |
| Escalated | 0 |
| Exhausted | 1 |
| Recovery rate | 83.33% |
| Money at risk | ₹43,036.00 |
| Money recovered | ₹40,325.00 |

### Failure Breakdown
- **SOFT** (Gateway timeouts / transient glitches): 1
- **HARD** (Invalid card / customer account issue): 4
- **UPI_HANDOFF** (UPI collect expired / callback lost): 1
- **SESSION_TIMEOUT** (OTP expired / stale session): 0

---

## Audit trail sample

| Timestamp | Payment ID | Order ID | Amount | Event | Failure Type | Action Taken | Outcome |
|---|---|---|---|---|---|---|---|
| 00:24:35 | `pay_sim_batch_4c5220c09959_0` | `order_TWy8w1O1sS9f7P` | ₹14,967.00 | action_taken | HARD | DELAYED_LINK | `dispatched` |
| 00:24:36 | `pay_sim_batch_4c5220c09959_7` | `order_TWy8w5A9M29Fv0` | ₹3,560.00 | action_taken | SOFT | IMMEDIATE_RETRY | `dispatched` |
| 00:24:37 | `pay_sim_batch_4c5220c09959_11` | `order_TWy8w77N1b4R6v` | ₹15,529.00 | action_taken | UPI_HANDOFF | ALT_METHOD | `dispatched` |
| 00:24:38 | `pay_sim_batch_4c5220c09959_19` | `order_TWy8wA2b9vW5rL` | ₹7,207.00 | action_taken | HARD | DELAYED_LINK | `dispatched` |

---

## What broke (and what I did about it)

See [WHAT_BROKE.md](./WHAT_BROKE.md) for the full debugging journal.

---

## Trade-offs and what I'd do differently

- **Simulated failures**: Test mode doesn't allow programmatic payment failure — we simulate locally. In production, real webhooks drive the flow.
- **Payment link limits**: Test mode caps at 30 payment links. For larger demos, ESCALATE/STOP actions don't consume this quota.
- **Single worker**: APScheduler requires single uvicorn worker. Would use Celery + Redis for production scale.
- **SQLite**: Fine for demo. PostgreSQL for production.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI, aiosqlite, APScheduler |
| AI | Claude claude-sonnet-4-6 via Anthropic SDK |
| Payments | Razorpay Python SDK (test mode) |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Charts | Recharts |
| Data fetching | TanStack React Query |
| Animation | Framer Motion |
| Infrastructure | Docker Compose |
