"""
insightsEngine/llm_extractor.py
=================================
LLM-based deep insights extraction via NVIDIA NIM API.

Changes vs original:
  - Prompt hardened: handles both English AND Indic content
  - Better JSON cleanup (markdown fence stripping, line-by-line)
  - Confidence-aware fallback
  - Configurable model via NVIDIA_MODEL env var
  - Graceful offline mode: returns structured partial result on failure
"""

from __future__ import annotations
import json
import logging
import os
import re
from pathlib import Path
from dotenv import load_dotenv
# Load root .env (three levels up from AiModule/AiModule/insightsEngine/)
load_dotenv(Path(__file__).parent.parent.parent.parent / ".env", override=False)
load_dotenv(Path(__file__).parent / ".env", override=False)  # fallback

logger = logging.getLogger(__name__)

# ── Client setup (lazy) ───────────────────────────────────────────────────────
_client = None


_PLACEHOLDER_KEYS = {"your_nvidia_api_key_here", "your_api_key_here", ""}

def _get_client():
    global _client
    if _client is None:
        api_key = os.environ.get("NVIDIA_API_KEY", "").strip()
        if not api_key or api_key in _PLACEHOLDER_KEYS:
            logger.warning("NVIDIA_API_KEY not configured — LLM extraction disabled. "
                           "Set a real key in insightsEngine/.env to enable it.")
            _client = False
            return None
        try:
            from openai import OpenAI
            _client = OpenAI(
                base_url="https://integrate.api.nvidia.com/v1",
                api_key=api_key,
            )
        except ImportError:
            logger.error("openai package not installed. Run: pip install openai")
            _client = False
    return _client if _client else None


# ── Model selection ───────────────────────────────────────────────────────────
DEFAULT_MODEL = os.environ.get("NVIDIA_MODEL", "meta/llama-3.1-8b-instruct")


# ── JSON extraction helper ────────────────────────────────────────────────────
def _extract_json(text: str) -> dict:
    """Robustly extract JSON from LLM output (handles markdown fences)."""
    # Remove ```json ... ``` or ``` ... ``` fences
    text = re.sub(r"```(?:json)?", "", text).replace("```", "").strip()
    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Find first {...} block
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    raise ValueError("No valid JSON found in LLM response")


# ── Prompt builder ────────────────────────────────────────────────────────────
SYSTEM_PROMPT = (
    "You are an expert Indian financial intelligence analyst specializing in "
    "speech transcript analysis. You extract structured financial insights from "
    "audio transcripts in Indian languages: Hindi, Tamil, Telugu, Bengali, "
    "Kannada, Malayalam, Gujarati, Punjabi, Marathi, Urdu, and Hinglish. "
    "Transcripts may contain filler words, repetitions, or informal speech — "
    "extract the core financial meaning. "
    "Output strictly valid JSON only. No explanation. No markdown fences."
)

_USER_PROMPT_TEMPLATE = """Analyze this Indian language speech transcript and extract financial intelligence.

Transcript: "{text}"
Detected Language: {lang}

Return a JSON object with EXACTLY these keys:
- "intent": primary financial intent, one of: payment_request, money_transfer, balance_inquiry, loan_query, loan_repayment, expense_tracking, investment_advice, salary_discussion, bill_payment, insurance_query, tax_query, fraud_alert, general_finance, unknown
- "domain": one of: personal_finance, business_finance, banking, insurance, investment, tax, lending, upi_payment, general
- "topics": array of specific tags from the transcript (e.g. ["upi", "emi", "gpay", "salary", "rent", "loan"])
- "summary": one clear English sentence capturing the financial meaning of the transcript
- "emotion": speaker tone, one of: neutral, urgent, worried, stressed, hopeful, angry, satisfied, confused
- "urgency": "low", "medium", or "high"
- "action_items": array of concrete English action steps (e.g. ["Transfer Rs 5000 to Rahul via UPI by tomorrow"])
- "risk_level": "low", "medium", or "high"
- "amount": monetary amount with currency symbol as string (e.g. "Rs 5000", "$200"), or null
- "parties": array of person or entity names mentioned (e.g. ["Rahul", "HDFC Bank", "PhonePe"])
- "deadline": deadline or date as string (e.g. "tomorrow", "31st March"), or null
- "code_switched": true if transcript mixes languages (Hinglish etc.), false otherwise

Return ONLY valid JSON.
"""


def extract_advanced_insights(text: str, lang: str = "en") -> dict:
    """
    Extract semantic insights from financial text using an LLM.

    Args:
        text: Cleaned English (or mixed-language) financial text.
        lang: Detected source language code (for model context).

    Returns:
        Dict with all insight fields. Never raises — returns safe defaults on failure.
    """
    _DEFAULTS = {
        "intent": "unknown",
        "domain": "finance",
        "topics": [],
        "summary": "",
        "emotion": "neutral",
        "urgency": "low",
        "action_items": [],
        "risk_level": "low",
        "amount": None,
        "parties": [],
        "deadline": None,
        "code_switched": False,
        "llm_error": None,
    }

    client = _get_client()
    if not client:
        _DEFAULTS["llm_error"] = "NVIDIA_API_KEY not configured"
        return _DEFAULTS

    prompt = _USER_PROMPT_TEMPLATE.format(
        text=text[:800],   # cap to avoid token overflow
        lang=lang,
    )

    try:
        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.05,   # near-deterministic for structured extraction
            max_tokens=600,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content.strip()
        result = _extract_json(raw)

        # Merge with defaults (handles partial LLM outputs)
        merged = {**_DEFAULTS, **result}
        merged.pop("llm_error", None)
        return merged

    except Exception as e:
        logger.error("LLM extraction error: %s", e)
        _DEFAULTS["llm_error"] = str(e)
        return _DEFAULTS
