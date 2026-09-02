"""
Payment Classifier — calls LLM (OpenRouter / MiniMax / Claude) to classify failures and recommend recovery actions.
Falls back to rule-based classification if LLM API fails.
"""

import json
import re
import logging
import httpx
from typing import Optional
from backend.config import settings
from backend.models.agent import Classification

logger = logging.getLogger(__name__)

# Lazy import for anthropic
_anthropic_client = None


def _get_anthropic_client():
    global _anthropic_client
    if _anthropic_client is None:
        try:
            import anthropic
            _anthropic_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        except Exception as e:
            logger.error("Failed to initialize Anthropic client: %s", e)
            return None
    return _anthropic_client


SYSTEM_PROMPT = """You are a payment failure analyst for an Indian fintech merchant using Razorpay.
Given a failed payment's metadata, classify the failure and recommend one recovery action.

Failure types:
- SOFT: Temporary infrastructure issue (bank timeout, network jitter, gateway overload).
        Retry immediately is appropriate.
- HARD: Definitive customer-side failure (insufficient funds, card blocked, invalid card).
        Immediate retry will not work. Delayed outreach or escalation needed.
- UPI_HANDOFF: UPI deep-link or callback lost. Customer likely still has intent.
               Alternative method link is appropriate.
- SESSION_TIMEOUT: Customer took too long; OTP or session expired.
                   Fresh payment link is appropriate.

Recovery actions:
- IMMEDIATE_RETRY: Create and dispatch a fresh payment link now.
- DELAYED_LINK: Create a payment link with 24-hour expiry, mark for follow-up.
- ALT_METHOD: Create a payment link without UPI, prompting card/wallet.
- ESCALATE: Flag for human review. Used for ambiguous or high-value failures.
- STOP: Do not retry. Log as unrecoverable. Used when attempts are exhausted
        or the failure is definitively unrecoverable (e.g., fraudulent card flag).

Rules:
- Never recommend IMMEDIATE_RETRY for HARD failures.
- Never recommend any action for a payment with 2+ prior recovery attempts. Return STOP.
- When confidence is below 0.6, recommend ESCALATE rather than acting.
- Amount above ₹10,000 and HARD failure: always ESCALATE, never auto-act.

Respond only in this exact JSON schema. No preamble. No markdown code blocks.
{
  "failure_type": "SOFT|HARD|UPI_HANDOFF|SESSION_TIMEOUT",
  "confidence": 0.95,
  "reasoning": "One sentence explaining why this classification was chosen.",
  "recommended_action": "IMMEDIATE_RETRY|DELAYED_LINK|ALT_METHOD|ESCALATE|STOP",
  "recovery_message_hint": "Short customer-facing recovery hint"
}"""


def _parse_llm_json(response_text: str) -> Optional[dict]:
    """Extract and parse JSON from LLM response safely, handling markdown formatting."""
    cleaned = response_text.strip()
    # Remove markdown code blocks if present
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Regex search for first JSON object
        match = re.search(r"\{[\s\S]*\}", response_text)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
    return None


class PaymentClassifier:
    """
    Calls LLM (OpenRouter / Claude) to classify a failed payment and recommend a recovery action.
    Falls back to rule-based classification if LLM call fails.
    """

    async def classify(
        self,
        payment_id: str,
        order_id: str,
        error_code: Optional[str],
        error_description: Optional[str],
        method: Optional[str],
        amount_paise: int,
        attempts: int,
        time_since_created_minutes: float,
        recovery_attempts: int = 0,
    ) -> Classification:
        """
        Classify a failed payment using LLM, with rule-based fallback.
        """
        # Pre-check stopping rule (defense in depth — also in executor)
        if recovery_attempts >= settings.MAX_RECOVERY_ATTEMPTS:
            return Classification(
                failure_type="HARD",
                confidence=1.0,
                reasoning=f"Stopping rule: {recovery_attempts} prior recovery attempts. No further action.",
                recommended_action="STOP",
                recovery_message_hint="",
            )

        # 1. Try OpenRouter (MiniMax M3 Free / configured model)
        if settings.OPENROUTER_API_KEY and not settings.OPENROUTER_API_KEY.startswith("sk-or-v1-xxxx"):
            try:
                result = await self._classify_with_openrouter(
                    payment_id=payment_id,
                    order_id=order_id,
                    error_code=error_code,
                    error_description=error_description,
                    method=method,
                    amount_paise=amount_paise,
                    attempts=attempts,
                    time_since_created_minutes=time_since_created_minutes,
                    recovery_attempts=recovery_attempts,
                )
                if result is not None:
                    return result
            except Exception as e:
                logger.warning("OpenRouter classification failed: %s", e)

        # 2. Try Anthropic Claude if configured
        if settings.ANTHROPIC_API_KEY and not settings.ANTHROPIC_API_KEY.startswith("sk-ant-xxxx"):
            try:
                result = await self._classify_with_claude(
                    payment_id=payment_id,
                    order_id=order_id,
                    error_code=error_code,
                    error_description=error_description,
                    method=method,
                    amount_paise=amount_paise,
                    attempts=attempts,
                    time_since_created_minutes=time_since_created_minutes,
                    recovery_attempts=recovery_attempts,
                )
                if result is not None:
                    return result
            except Exception as e:
                logger.warning("Claude classification failed: %s", e)

        # 3. Fallback to rule-based classification
        return self._classify_with_rules(
            error_code=error_code,
            error_description=error_description,
            method=method,
            amount_paise=amount_paise,
            time_since_created_minutes=time_since_created_minutes,
        )

    async def _classify_with_openrouter(
        self,
        payment_id: str,
        order_id: str,
        error_code: Optional[str],
        error_description: Optional[str],
        method: Optional[str],
        amount_paise: int,
        attempts: int,
        time_since_created_minutes: float,
        recovery_attempts: int,
    ) -> Optional[Classification]:
        """Call OpenRouter API (MiniMax M3 Free / custom model)."""
        user_prompt = f"""Classify this failed payment:

Payment ID: {payment_id}
Order ID: {order_id}
Error Code: {error_code or 'unknown'}
Error Description: {error_description or 'No description available'}
Payment Method: {method or 'unknown'}
Amount: ₹{amount_paise / 100:,.2f} ({amount_paise} paise)
Payment Attempts: {attempts}
Recovery Attempts So Far: {recovery_attempts}
Time Since Order Created: {time_since_created_minutes:.1f} minutes"""

        headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "PayPulse",
        }

        payload = {
            "model": settings.OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.1,
            "max_tokens": 500,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
            )

            if response.status_code != 200:
                logger.warning("OpenRouter returned status %d: %s", response.status_code, response.text[:200])
                return None

            data = response.json()
            content = data["choices"][0]["message"]["content"]
            parsed = _parse_llm_json(content)

            if not parsed:
                logger.warning("Failed to parse JSON from OpenRouter output: %s", content[:200])
                return None

            # Validate fields
            failure_type = parsed.get("failure_type", "SOFT")
            if failure_type not in ("SOFT", "HARD", "UPI_HANDOFF", "SESSION_TIMEOUT"):
                failure_type = "SOFT"

            recommended_action = parsed.get("recommended_action", "IMMEDIATE_RETRY")
            if recommended_action not in ("IMMEDIATE_RETRY", "DELAYED_LINK", "ALT_METHOD", "ESCALATE", "STOP"):
                recommended_action = "ESCALATE"

            confidence = float(parsed.get("confidence", 0.90))

            return Classification(
                failure_type=failure_type,
                confidence=min(1.0, max(0.0, confidence)),
                reasoning=f"[{settings.OPENROUTER_MODEL}] {parsed.get('reasoning', '')}",
                recommended_action=recommended_action,
                recovery_message_hint=parsed.get("recovery_message_hint", ""),
            )

    async def _classify_with_claude(
        self,
        payment_id: str,
        order_id: str,
        error_code: Optional[str],
        error_description: Optional[str],
        method: Optional[str],
        amount_paise: int,
        attempts: int,
        time_since_created_minutes: float,
        recovery_attempts: int,
    ) -> Optional[Classification]:
        """Call Claude API for classification."""
        client = _get_anthropic_client()
        if client is None:
            return None

        user_prompt = f"""Classify this failed payment:

Payment ID: {payment_id}
Order ID: {order_id}
Error Code: {error_code or 'unknown'}
Error Description: {error_description or 'No description available'}
Payment Method: {method or 'unknown'}
Amount: ₹{amount_paise / 100:,.2f} ({amount_paise} paise)
Payment Attempts: {attempts}
Recovery Attempts So Far: {recovery_attempts}
Time Since Order Created: {time_since_created_minutes:.1f} minutes"""

        try:
            message = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=500,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_prompt}],
            )

            response_text = message.content[0].text.strip()
            data = _parse_llm_json(response_text)
            if not data:
                return None

            return Classification(
                failure_type=data["failure_type"],
                confidence=float(data["confidence"]),
                reasoning=f"[Claude] {data['reasoning']}",
                recommended_action=data["recommended_action"],
                recovery_message_hint=data.get("recovery_message_hint", ""),
            )

        except Exception as e:
            logger.warning("Claude API call failed: %s", e)
            return None

    def _classify_with_rules(
        self,
        error_code: Optional[str],
        error_description: Optional[str],
        method: Optional[str],
        amount_paise: int,
        time_since_created_minutes: float,
    ) -> Classification:
        """
        Deterministic fallback classifier based on Razorpay error codes.
        Used when LLM API is unavailable.
        """
        desc = (error_description or "").lower()
        code = (error_code or "").upper()

        # UPI-specific failures
        if method and method.lower() == "upi":
            if "timeout" in desc or "expired" in desc:
                return Classification(
                    failure_type="SESSION_TIMEOUT",
                    confidence=0.0,
                    reasoning="LLM unavailable — rule-based fallback used. UPI timeout detected.",
                    recommended_action="DELAYED_LINK",
                    recovery_message_hint="Your UPI session expired. Here's a fresh payment link.",
                )
            return Classification(
                failure_type="UPI_HANDOFF",
                confidence=0.0,
                reasoning="LLM unavailable — rule-based fallback used. UPI failure detected.",
                recommended_action="ALT_METHOD",
                recovery_message_hint="UPI payment failed. Try paying with card or wallet instead.",
            )

        # Gateway errors — typically transient
        if code == "GATEWAY_ERROR" or "gateway" in desc or "bank server" in desc or "timeout" in desc:
            return Classification(
                failure_type="SOFT",
                confidence=0.0,
                reasoning="LLM unavailable — rule-based fallback used. Gateway/transient error detected.",
                recommended_action="IMMEDIATE_RETRY",
                recovery_message_hint="There was a temporary issue. Please try again.",
            )

        # Session timeout
        if time_since_created_minutes > settings.PAYMENT_STALE_THRESHOLD_MINUTES:
            return Classification(
                failure_type="SESSION_TIMEOUT",
                confidence=0.0,
                reasoning="LLM unavailable — rule-based fallback used. Payment stale (exceeded threshold).",
                recommended_action="DELAYED_LINK",
                recovery_message_hint="Your payment session expired. Here's a new link.",
            )

        # Bad request / hard failures
        if code == "BAD_REQUEST_ERROR" or "invalid" in desc or "insufficient" in desc or "blocked" in desc:
            if amount_paise > 1000000:  # > ₹10,000
                return Classification(
                    failure_type="HARD",
                    confidence=0.0,
                    reasoning="LLM unavailable — rule-based fallback used. High-value hard failure → escalated.",
                    recommended_action="ESCALATE",
                    recovery_message_hint="",
                )
            return Classification(
                failure_type="HARD",
                confidence=0.0,
                reasoning="LLM unavailable — rule-based fallback used. Hard failure detected.",
                recommended_action="DELAYED_LINK",
                recovery_message_hint="Your payment couldn't be processed. Please try with a different method.",
            )

        # Server errors
        if code == "SERVER_ERROR" or "server" in desc:
            return Classification(
                failure_type="SOFT",
                confidence=0.0,
                reasoning="LLM unavailable — rule-based fallback used. Server error detected.",
                recommended_action="IMMEDIATE_RETRY",
                recovery_message_hint="We experienced a temporary issue. Please retry.",
            )

        # Default: escalate unknown failures
        return Classification(
            failure_type="HARD",
            confidence=0.0,
            reasoning="LLM unavailable — rule-based fallback used. Unknown failure type, escalating.",
            recommended_action="ESCALATE",
            recovery_message_hint="",
        )


# Singleton instance
payment_classifier = PaymentClassifier()
