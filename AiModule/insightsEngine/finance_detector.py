"""
insightsEngine/finance_detector.py
====================================
Multilingual finance keyword detector.

Supports:
  - English finance words
  - Hindi (Devanagari + romanised) finance terms
  - Common Indic currency symbols and UPI terms
  - Code-switched Hinglish patterns (e.g., "paisa bhej", "rupees transfer")
  - Regex for currency amounts in all scripts
"""

from __future__ import annotations
import re

# ── English finance keywords ──────────────────────────────────────────────────
FINANCE_KEYWORDS_EN = {
    "pay", "payment", "money", "rupees", "dollars", "pounds", "euro",
    "rs", "inr", "transfer", "send", "bank", "account", "credit", "debit",
    "upi", "gpay", "phonepe", "paytm", "neft", "rtgs", "imps",
    "invoice", "bill", "salary", "loan", "borrow", "lend", "emi",
    "investment", "invest", "budget", "cost", "price", "buy", "sell",
    "purchase", "fund", "deposit", "withdraw", "fee", "charge", "tax",
    "income", "expense", "profit", "loss", "balance", "transaction",
    "cheque", "check", "cashback", "refund", "reimbursement",
    "interest", "rate", "finance", "financial", "stock", "share",
    "mutual", "insurance", "premium", "emi", "installment",
}

# ── Hindi romanised finance keywords (Hinglish) ───────────────────────────────
FINANCE_KEYWORDS_HI_ROMAN = {
    "paisa", "paisay", "paise", "rupaya", "rupaye", "rup",
    "bhej", "bhejo", "bheja", "dena", "lena", "de", "lo",
    "khata", "kharcha", "kamayi", "bachat", "udhar", "karz",
    "jama", "nikal", "transfer", "payment", "fees",
}

# ── Devanagari finance terms ──────────────────────────────────────────────────
FINANCE_KEYWORDS_DEVANAGARI = {
    "पैसा", "पैसे", "रुपया", "रुपये", "भुगतान", "खाता",
    "ऋण", "कर्ज", "जमा", "निकासी", "ट्रांसफर", "निवेश",
    "बजट", "खर्च", "आय", "लाभ", "हानि", "शुल्क",
    "बीमा", "प्रीमियम", "किश्त", "ब्याज",
}

# ── Tamil ─────────────────────────────────────────────────────────────────────
FINANCE_KEYWORDS_TAMIL = {
    "பணம்", "கட்டணம்", "கடன்", "வங்கி", "பரிமாற்றம்",
    "முதலீடு", "வருமானம்", "செலவு", "தொகை",
}

# ── Telugu ────────────────────────────────────────────────────────────────────
FINANCE_KEYWORDS_TELUGU = {
    "డబ్బు", "చెల్లింపు", "రుణం", "బ్యాంకు", "బదిలీ",
    "పెట్టుబడి", "ఆదాయం", "ఖర్చు",
}

# ── Bengali ───────────────────────────────────────────────────────────────────
FINANCE_KEYWORDS_BENGALI = {
    "টাকা", "পেমেন্ট", "ঋণ", "ব্যাংক", "স্থানান্তর",
    "বিনিয়োগ", "আয়", "ব্যয়",
}

# ── Gujarati ──────────────────────────────────────────────────────────────────
FINANCE_KEYWORDS_GUJARATI = {
    "પૈસા", "ચૂકવણી", "લોન", "બેંક", "ટ્રાન્સફર",
    "રોકાણ", "આવક", "ખર્ચ",
}

# ── Kannada ───────────────────────────────────────────────────────────────────
FINANCE_KEYWORDS_KANNADA = {
    "ಹಣ", "ಪಾವತಿ", "ಸಾಲ", "ಬ್ಯಾಂಕ್", "ವರ್ಗಾವಣೆ",
    "ಹೂಡಿಕೆ", "ಆದಾಯ", "ವೆಚ್ಚ",
}

# ── Malayalam ─────────────────────────────────────────────────────────────────
FINANCE_KEYWORDS_MALAYALAM = {
    "പണം", "പേയ്‌മെന്റ്", "വായ്പ", "ബാങ്ക്", "കൈമാറ്റം",
    "നിക്ഷേപം", "വരുമാനം", "ചെലവ്",
}

# ── Punjabi ───────────────────────────────────────────────────────────────────
FINANCE_KEYWORDS_PUNJABI = {
    "ਪੈਸਾ", "ਭੁਗਤਾਨ", "ਕਰਜ਼", "ਬੈਂਕ", "ਤਬਾਦਲਾ",
    "ਨਿਵੇਸ਼", "ਆਮਦਨ", "ਖਰਚ",
}

# ── Urdu ──────────────────────────────────────────────────────────────────────
FINANCE_KEYWORDS_URDU = {
    "پیسے", "ادائیگی", "قرض", "بینک", "منتقلی",
    "سرمایہ", "آمدنی", "خرچ",
}

# ── Combined set ─────────────────────────────────────────────────────────────
ALL_FINANCE_KEYWORDS = (
    FINANCE_KEYWORDS_EN
    | FINANCE_KEYWORDS_HI_ROMAN
    | FINANCE_KEYWORDS_DEVANAGARI
    | FINANCE_KEYWORDS_TAMIL
    | FINANCE_KEYWORDS_TELUGU
    | FINANCE_KEYWORDS_BENGALI
    | FINANCE_KEYWORDS_GUJARATI
    | FINANCE_KEYWORDS_KANNADA
    | FINANCE_KEYWORDS_MALAYALAM
    | FINANCE_KEYWORDS_PUNJABI
    | FINANCE_KEYWORDS_URDU
)

# ── Currency amount regex ─────────────────────────────────────────────────────
# Handles: ₹5000, $50, £100, €200, 5000 rupees, 500 rs, etc.
_CURRENCY_RE = re.compile(
    r"([\u20B9$£€¥]\s*\d[\d,]*"        # ₹5000, $50
    r"|\d[\d,]*\s*(?:rs|inr|rupees|rupee|dollars?|pounds?|euros?|bucks?)"
    r"|\d[\d,]*\s*(?:रुपय[ेा]|रूपय[ेा]|পাকা|টাকা))",  # Indic numeral+currency
    re.IGNORECASE | re.UNICODE,
)

# ── Word boundary-aware keyword check ─────────────────────────────────────────
# Pre-compile for fast matching
_EN_PATTERN = re.compile(
    r"\b(" + "|".join(re.escape(k) for k in FINANCE_KEYWORDS_EN | FINANCE_KEYWORDS_HI_ROMAN) + r")\b",
    re.IGNORECASE,
)
# Indic keywords don't need \b (script-based word boundaries)
_INDIC_KEYWORDS = (
    FINANCE_KEYWORDS_DEVANAGARI | FINANCE_KEYWORDS_TAMIL | FINANCE_KEYWORDS_TELUGU
    | FINANCE_KEYWORDS_BENGALI | FINANCE_KEYWORDS_GUJARATI | FINANCE_KEYWORDS_KANNADA
    | FINANCE_KEYWORDS_MALAYALAM | FINANCE_KEYWORDS_PUNJABI | FINANCE_KEYWORDS_URDU
)


def is_finance_related(text: str) -> bool:
    """
    Fast multilingual pre-filter to check if text has finance potential.

    Returns True if ANY of:
      - A finance keyword (Latin or Indic) is found
      - A currency pattern (₹500, $20, etc.) is found
    """
    if not text or not text.strip():
        return False

    # 1. English + romanised Hindi keywords
    if _EN_PATTERN.search(text):
        return True

    # 2. Indic-script keywords (direct substring search is fine)
    for kw in _INDIC_KEYWORDS:
        if kw in text:
            return True

    # 3. Currency amount regex
    if _CURRENCY_RE.search(text):
        return True

    return False
