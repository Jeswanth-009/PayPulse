"""
message_generator.py
Generates personalized WhatsApp + SMS recovery messages using LLM.
Called by executor.py after any action that produces a Payment Link.
"""

import json
import re
import logging
import httpx
from backend.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a customer communication specialist for an Indian fintech merchant using Razorpay.
A customer's payment just failed. The merchant's AI recovery agent has created a new payment link.
Write two messages: one for WhatsApp, one for SMS.

LANGUAGE:
- If language_hint is "hi": write in Hinglish. Natural mixed Hindi-English as Indians text.
  Example: "Aapka ₹799 ka payment nahi hua — koi baat nahi, yahan se try karein: [link]"
  Do NOT use formal Hindi. Do NOT transliterate full sentences. Mix naturally.
- If language_hint is "en": write in clear friendly English.
- Use first name only. Never "Dear". Never "Regards".
- Never say: "technical error", "gateway", "server", "system failure". These erode trust.
  Say: "payment didn't go through" / "nahi hua" / "process nahi ho paya".

TONE:
- Warm, human. Customer had intent to pay. Do not alarm them.
- Include the exact ₹ amount. Reference the payment method that failed.
- One gentle urgency nudge maximum. Do not repeat it.
- The link should feel easy, not like a second attempt at failure.

WHATSAPP RULES:
- Maximum 300 characters INCLUDING the link. Count carefully.
- One or two emoji only: ✅ 💳 🔗 📲 are fine. No celebration emoji.
- Payment link on its own line, preceded by a blank line.
- Last line: "— {merchant_name}"

SMS RULES:
- Maximum 160 characters INCLUDING the link. This is a hard limit. Count every character.
- Zero emoji.
- Link on its own line.
- Must read as a legitimate transactional SMS. No promotional language.

RESPOND ONLY IN THIS JSON. No preamble. No markdown code blocks. Nothing else.
{
  "whatsapp": "full WhatsApp message",
  "sms": "full SMS under 160 chars",
  "tone": "english or hinglish",
  "personalization_note": "one sentence: what personalization choice you made and why"
}"""


def _parse_message_json(response_text: str) -> dict | None:
    cleaned = response_text.strip()
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
        match = re.search(r"\{[\s\S]*\}", response_text)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
    return None


async def generate_recovery_message(
    payment_id: str,
    order_id: str,
    customer_name: str,
    amount_rupees: float,
    failure_type: str,
    action_taken: str,
    payment_link_url: str,
    merchant_name: str,
    order_notes: str = "",
) -> dict:

    language_hint = "hi"
    try:
        notes = json.loads(order_notes) if isinstance(order_notes, str) and order_notes.startswith("{") else order_notes
        if isinstance(notes, dict):
            language_hint = notes.get("language_hint", "hi")
    except Exception:
        pass

    method_label = "UPI" if failure_type == "UPI_HANDOFF" else "card/netbanking"
    first_name = customer_name.split()[0] if customer_name else "Customer"

    user_msg = f"""Customer: {first_name}
Amount: ₹{amount_rupees:.2f}
Payment method that failed: {method_label}
Failure category: {failure_type}
Recovery action: {action_taken}
Recovery link: {payment_link_url}
Merchant name: {merchant_name}
language_hint: {language_hint}

Write the WhatsApp and SMS messages now."""

    # 1. Try OpenRouter
    if settings.OPENROUTER_API_KEY and not settings.OPENROUTER_API_KEY.startswith("sk-or-v1-xxxx"):
        try:
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
                    {"role": "user", "content": user_msg},
                ],
                "temperature": 0.2,
                "max_tokens": 500,
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    raw = res.json()["choices"][0]["message"]["content"]
                    parsed = _parse_message_json(raw)
                    if parsed and "whatsapp" in parsed and "sms" in parsed:
                        parsed["source"] = "llm"
                        parsed["whatsapp"] = parsed["whatsapp"][:300]
                        parsed["sms"] = parsed["sms"][:160]
                        return parsed
        except Exception as e:
            logger.warning("Message generator OpenRouter call failed: %s", e)

    # 2. Try Claude if available
    if settings.ANTHROPIC_API_KEY and not settings.ANTHROPIC_API_KEY.startswith("sk-ant-xxxx"):
        try:
            import anthropic
            aclient = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            response = aclient.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=600,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_msg}],
            )
            raw = response.content[0].text.strip()
            result = _parse_message_json(raw)
            if result and "whatsapp" in result and "sms" in result:
                result["source"] = "llm"
                result["whatsapp"] = result["whatsapp"][:300]
                result["sms"] = result["sms"][:160]
                return result
        except Exception as e:
            logger.warning("Message generator Claude call failed: %s", e)

    # 3. Deterministic fallback — never crash
    if language_hint == "hi":
        wa = (f"Namaste {first_name} 🙏\n\nAapka ₹{amount_rupees:.0f} ka payment "
              f"nahi hua — koi baat nahi!\n\n{payment_link_url}\n\n— {merchant_name}")
        sms = f"{first_name}, aapka Rs.{amount_rupees:.0f} payment nahi hua. Retry: {payment_link_url}"
    else:
        wa = (f"Hi {first_name} 👋\n\nYour ₹{amount_rupees:.0f} payment didn't go through. "
              f"Tap to retry:\n\n{payment_link_url}\n\n— {merchant_name}")
        sms = f"Hi {first_name}, your Rs.{amount_rupees:.0f} payment failed. Retry: {payment_link_url}"

    return {
        "whatsapp": wa[:300],
        "sms": sms[:160],
        "tone": "hinglish" if language_hint == "hi" else "english",
        "personalization_note": "LLM unavailable — template fallback used.",
        "source": "fallback",
    }
