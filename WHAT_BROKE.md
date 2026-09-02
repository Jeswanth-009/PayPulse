# What Broke (and What I Did About It)

> Running notes from the PayPulse build — genuine engineering debugging sessions and real fixes.

---

## Issue #1: Razorpay Payment Links API `reference_id` Character Length Limit

**What I was trying to do:**
Create recovery payment links via Razorpay Payment Links API using formatted reference IDs such as `retry_pay_sim_batch_5d9f3eac3188_19_1_1788308519` to track the exact payment, batch, attempt number, and timestamp.

**What actually happened:**
The Razorpay API returned a 400 error:
```json
{"error": "reference_id: the length must be no more than 40."}
```
The composite reference string was 48 characters long, exceeding Razorpay's hard 40-character limit for `reference_id`.

**How long it took to diagnose:**
2 minutes (inspected API response in `audit_log.razorpay_response`).

**What fixed it:**
Changed the reference generator in `RecoveryExecutor` to use a compact, collision-resistant format with truncated UUIDs:
```python
reference_id = f"ret_{attempt_number}_{uuid.uuid4().hex[:16]}"  # 22 characters total
```
This is well within the 40-char limit while remaining globally unique across batches and retries.

---

## Issue #2: Razorpay Disallowing Repeating Phone Numbers (`+919999999999`)

**What I was trying to do:**
Use standard placeholder phone numbers (`+919999999999`) for simulated customer contacts during test-mode payment link creation.

**What actually happened:**
Razorpay Payment Links API rejected the request with:
```
Failed to create payment link: Recurring digits in customer contact are disallowed
```

**How long it took to diagnose:**
1 minute (from direct Python test invocation).

**What fixed it:**
Updated all customer generation fixtures and default fallback contacts in `backend/services/razorpay_client.py` and `backend/services/executor.py` to realistic Indian mobile numbers with varying digits, e.g., `+919876543210`, `+919876543211`, `+919876543212`.

---

## Issue #3: Pydantic v2 Type Coercion Error on JSON Fields from SQLite

**What I was trying to do:**
Return the audit trail via `GET /api/v1/audit`. In `AuditLogger`, raw JSON strings stored in SQLite for `action_payload` and `razorpay_response` were deserialized via `json.loads(...)` to provide native JSON objects to the frontend.

**What actually happened:**
FastAPI responded with 500 / 422 errors because `AuditLogEntry` defined `action_payload: Optional[str]` and `razorpay_response: Optional[str]`. Passing Python `dict`s to a model expecting `str` caused Pydantic v2 validation errors:
```
Input should be a valid string [type=string_type, input_value={'amount_paise': ...}]
```

**How long it took to diagnose:**
3 minutes (checked uvicorn task logs).

**What fixed it:**
Updated `AuditLogEntry` and `AuditLogCreate` models in `backend/models/audit.py` to allow `Optional[Any] = None` (accepting `dict`, `list`, or `str`), enabling seamless JSON rendering on the client side without manual re-serialization.

---

## Issue #4: Razorpay Test-Mode Rate Limiting on Rapid Sequential Link Creation

**What I was trying to do:**
Process all failed payments in a batch loop consecutively.

**What actually happened:**
When 5+ failures were processed in immediate succession, subsequent calls to Razorpay Payment Links API returned `{"error": "Too many requests"}` due to test-mode burst rate limits.

**How long it took to diagnose:**
2 minutes (observed `Too many requests` in the audit log).

**What fixed it:**
Added an asynchronous 400ms pause (`await asyncio.sleep(0.4)`) between payment processing iterations in `PaymentMonitor._process_payment`, smoothly pacing requests within Razorpay's test-mode rate limits.

---

## Issue #5: APScheduler Polling Loop Reprocessing Already Dispatched Payments

**What I was trying to do:**
Run the APScheduler background monitor on a 30-second interval to catch unhandled failures.

**What actually happened:**
The SQL query was filtering out only `outcome IN ('exhausted', 'escalated')`. Because initial link generation has `outcome = 'dispatched'`, the scheduler re-selected the same payments 30 seconds later and triggered a second recovery attempt before the customer had time to interact with the first link.

**How long it took to diagnose:**
2 minutes (analyzed audit log event timestamps).

**What fixed it:**
Updated the monitor query to exclude `dispatched` payments (`outcome IN ('exhausted', 'escalated', 'dispatched')`), ensuring each failure gets exactly one autonomous recovery action per failure cycle unless explicitly re-triggered or updated with a new failure event.
