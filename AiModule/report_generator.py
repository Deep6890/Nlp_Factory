"""
report_generator.py
====================
Generates a Markdown summary from transcript JSON data using NVIDIA NIM,
then converts to PDF using reportlab.

Usage:
    python report_generator.py <transcripts_json_path> [output_pdf_path]

Input JSON: array of transcript objects from Supabase
Output: PDF file
"""

from __future__ import annotations

import json
import logging
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s", stream=sys.stderr)
log = logging.getLogger(__name__)

_ROOT = Path(__file__).parent.resolve()
sys.path.insert(0, str(_ROOT / "insightsEngine"))

from dotenv import load_dotenv
load_dotenv(_ROOT / ".." / ".env", override=False)


def _generate_markdown(transcripts: list, days: int = 10) -> str:
    """Use NVIDIA NIM to generate a markdown summary from transcript data."""
    from openai import OpenAI

    api_key = os.environ.get("NVIDIA_API_KEY", "").strip()
    model   = os.environ.get("NVIDIA_MODEL", "meta/llama-3.1-8b-instruct")

    # Build compact summary data for the prompt
    summaries = []
    for t in transcripts[-days:]:  # last N days
        ins = t.get("insights") or {}
        summaries.append({
            "date":     t.get("created_at", "")[:10],
            "summary":  ins.get("summary") or t.get("summary", ""),
            "intent":   ins.get("intent", "unknown"),
            "domain":   ins.get("domain", "general"),
            "risk":     ins.get("risk_level", "low"),
            "emotion":  ins.get("emotion", "neutral"),
            "finance":  ins.get("finance_detected", False),
            "keywords": ins.get("keywords", [])[:5],
        })

    prompt = f"""You are a financial conversation analyst.
Generate a professional Markdown report summarizing the last {days} days of financial conversations.

Data:
{json.dumps(summaries, indent=2)}

Output a clean Markdown report with these sections:
# Financial Conversation Summary Report
## Overview
## Key Themes
## Risk Analysis
## Recommendations
## Session Breakdown

Rules:
- Be concise and professional
- Use bullet points
- Highlight high-risk items
- No hallucination — only use provided data
- Keep total length under 800 words"""

    client = OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=api_key)
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1200,
    )
    return response.choices[0].message.content


def _markdown_to_pdf(markdown_text: str, output_path: str, title: str = "Financial Report"):
    """Convert markdown to PDF using reportlab."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
        from reportlab.lib.enums import TA_LEFT, TA_CENTER
    except ImportError:
        log.error("reportlab not installed. Run: pip install reportlab")
        # Fallback: save as .md
        md_path = output_path.replace(".pdf", ".md")
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(markdown_text)
        log.info("Saved as markdown: %s", md_path)
        return md_path

    doc = SimpleDocTemplate(output_path, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()

    # Custom styles matching the app theme
    h1 = ParagraphStyle('H1', parent=styles['Heading1'], fontSize=20, textColor=colors.HexColor('#1a2010'), spaceAfter=12, fontName='Helvetica-Bold')
    h2 = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#4a5a30'), spaceAfter=8, fontName='Helvetica-Bold')
    body = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#1a2010'), spaceAfter=6, leading=16)
    bullet = ParagraphStyle('Bullet', parent=body, leftIndent=20, bulletIndent=10)

    story = []
    # Header
    story.append(Paragraph(title, h1))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", body))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#A0C878'), spaceAfter=12))

    # Parse markdown lines
    for line in markdown_text.split('\n'):
        line = line.strip()
        if not line:
            story.append(Spacer(1, 6))
        elif line.startswith('# '):
            story.append(Paragraph(line[2:], h1))
        elif line.startswith('## '):
            story.append(Paragraph(line[3:], h2))
        elif line.startswith('- ') or line.startswith('* '):
            story.append(Paragraph(f"• {line[2:]}", bullet))
        else:
            story.append(Paragraph(line, body))

    doc.build(story)
    log.info("PDF saved: %s", output_path)
    return output_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python report_generator.py <transcripts.json> [output.pdf]"}))
        sys.exit(1)

    input_path  = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    days        = int(sys.argv[3]) if len(sys.argv) > 3 else 10

    with open(input_path, "r", encoding="utf-8") as f:
        transcripts = json.load(f)

    log.info("Generating markdown for %d transcripts (last %d days)...", len(transcripts), days)
    markdown = _generate_markdown(transcripts, days)

    log.info("Converting to PDF...")
    result_path = _markdown_to_pdf(markdown, output_path, title=f"Financial Summary — Last {days} Days")

    print(json.dumps({"success": True, "path": result_path, "markdown": markdown}))
