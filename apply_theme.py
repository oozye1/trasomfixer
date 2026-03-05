#!/usr/bin/env python3
"""Replace hardcoded inline colours with t() theme helper calls."""
import re

path = r"f:\transom designer\src\TransomCalculator.jsx"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

# Count replacements
count = 0

def replace_and_count(old, new, source):
    global count
    n = source.count(old)
    count += n
    return source.replace(old, new)

# ── BACKGROUNDS ──
# background: "#020617" → background: t("bg")
src = replace_and_count('background: "#020617"', 'background: t("bg")', src)
# background: "#0f172a" → background: t("card")
src = replace_and_count('background: "#0f172a"', 'background: t("card")', src)
# background: "#1e293b" → background: t("input")
src = replace_and_count('background: "#1e293b"', 'background: t("input")', src)
# background: "#1a2744" → background: t("cardAlt")
src = replace_and_count('background: "#1a2744"', 'background: t("cardAlt")', src)
# background: "#1e0000" → background: t("danger")
src = replace_and_count('background: "#1e0000"', 'background: t("danger")', src)

# ── TEXT COLOURS ──
# color: "#e2e8f0" → color: t("text")
src = replace_and_count('color: "#e2e8f0"', 'color: t("text")', src)
# color: "#94a3b8" → color: t("textSecondary")
src = replace_and_count('color: "#94a3b8"', 'color: t("textSecondary")', src)
# color: "#64748b" → color: t("textTertiary")
src = replace_and_count('color: "#64748b"', 'color: t("textTertiary")', src)
# color: "#fca5a5" → color: t("dangerText")
src = replace_and_count('color: "#fca5a5"', 'color: t("dangerText")', src)

# ── BORDERS ──
# border: "1px solid #1e293b" → border: `1px solid ${t("border")}`
src = replace_and_count('border: "1px solid #1e293b"', 'border: `1px solid ${t("border")}`', src)
# border: "1px solid #334155" → border: `1px solid ${t("borderSubtle")}`
src = replace_and_count('border: "1px solid #334155"', 'border: `1px solid ${t("borderSubtle")}`', src)
# border: "1px solid #ef444460" → border: `1px solid ${t("dangerBorder")}`
src = replace_and_count('border: "1px solid #ef444460"', 'border: `1px solid ${t("dangerBorder")}`', src)
# borderBottom: "1px solid #1e293b" → borderBottom: `1px solid ${t("border")}`
src = replace_and_count('borderBottom: "1px solid #1e293b"', 'borderBottom: `1px solid ${t("border")}`', src)

# ── SVG ──
# stroke="#475569" → stroke={t("svgStroke")} — but only in JSX attributes
# These are trickier — SVG uses attribute syntax not style syntax
# For now, skip SVG stroke replacements — they're cosmetic and the dark colours work OK on light too

# ── SPECIFIC PATTERNS ──
# fill="#64748b" in SVG → leave as-is (accent colours in charts)
# The outermost div background and color
src = replace_and_count('background: t("bg"), color: t("text")', 'background: t("bg"), color: t("text")', src)  # no-op if already done

print(f"Applied {count} replacements")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("Done!")
