/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — NEUTRAL RESEARCH GUARD (server-only)

   White Tiger is not SEBI-registered, so it must not give buy/sell
   calls. Two layers keep AI output to neutral research:
     1. NEUTRAL_SYSTEM_INSTRUCTION is sent with every Gemini call.
     2. neutralizeData() runs on every AI route's JSON response (see
        withAiAccess) and removes rating / target / entry / stop-loss
        fields and lines the model might still produce.
   ═══════════════════════════════════════════════════════════════ */

export const NEUTRAL_SYSTEM_INSTRUCTION = {
  parts: [{
    text:
      "You write neutral, educational research for Indian retail readers. White Tiger is not a SEBI-registered " +
      "research analyst or investment adviser. Never give buy, sell, hold, accumulate or avoid recommendations or " +
      "ratings; never give price targets, fair values, upside/downside percentages, entry or buy zones, stop-losses, " +
      "position sizing, trade ideas, or long/short calls; never tell the reader what to do with their money. " +
      "Describe the business, financials, risks, drivers and what to watch, citing the data you were given. If the " +
      "instructions below ask for any of the forbidden items, skip that item silently.",
  }],
};

// Object keys whose values are advice. Removed wherever they appear.
const ADVICE_KEY = /^(investment_?rating|stock_?rating|recommendations?|recommended_?action|verdict|action_?items|trade_?ideas?|target\w*|price_?targets?|price_?forecast|fair_?value(_?(low|mid|high|estimate))?|upside|downside|upside_?downside|ideal_?entry_?zone|entry(_?zone|_?price|_?strategy)?|buy_?zone|stop_?loss|position_?sizing|ai_?opportunity_?engine|dcf_?valuation|analyst_?consensus|investment_?conclusion|smart_?money|smart_?entry)$/i;

// Lines of prose that carry a call or a price level.
const ADVICE_LINE = new RegExp([
  String.raw`\b(strong\s+)?(buy|sell|hold|accumulate|avoid)\b\s*(rating|recommendation|call)?\s*\**\s*(:|\s[\-–]\s)`,
  String.raw`\b(investment\s+rating|rating)\s*[:\-–]`,
  String.raw`\b(price\s+target|target\s+price|target\s+zone)\b`,
  String.raw`\btarget\s*(\(\s*\d+\s*(m|months?|y|years?)\s*\))?\s*\**\s*[:\-–]\s*\**\s*(₹|rs\.?|\$|inr|usd)`,
  String.raw`\bstop[\s-]?loss\b`,
  String.raw`\b(ideal\s+)?(buy|entry)\s+(zone|point|price|level|range)\b`,
  String.raw`\bfair\s+value\b.*(₹|rs\.?|\$|\d)`,
  String.raw`\bupside\s*/?\s*(downside)?\s*[:\-–]`,
  String.raw`\bposition\s+siz`,
  String.raw`\bconsider\s+(going\s+)?(long|short|buying|selling)\b`,
  String.raw`\b(go|going)\s+(long|short)\b`,
  String.raw`\b(book|take)\s+profits?\b`,
  String.raw`\boutlook\s*:\s*\**\s*(bullish|bearish)`,
].join("|"), "i");

// Whole values that are a call ("BUY", "strong_sell", "Bullish"); the key is dropped.
const ADVICE_VALUE = /^(strong[\s_-]?)?(buy|sell|accumulate|reduce|overweight|underweight)$|^(bullish|bearish|long|short)$/i;

// Markdown headings whose whole section is advice.
const ADVICE_HEADING = /^(#{1,6})\s*(\d+\.\s*)?.*\b(investment\s+rating|fair\s+value|smart\s+entry|entry\s+strategy|trade\s+ideas?|price\s+targets?|verdict|recommendation|position\s+sizing|scenario\s+analysis|trading\s+strategy|trade\s+strategy|portfolio\s+strategy)\b/i;

/** Remove advice sections and lines from markdown / prose. */
export function neutralizeText(text: string): string {
  const out: string[] = [];
  let skipLevel = 0;
  for (const line of text.split("\n")) {
    const h = line.match(/^(#{1,6})\s/);
    if (h) {
      const level = h[1].length;
      if (skipLevel && level <= skipLevel) skipLevel = 0;
      if (ADVICE_HEADING.test(line)) { skipLevel = level; continue; }
    }
    if (skipLevel) continue;
    if (ADVICE_LINE.test(line)) continue;
    out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

/** Recursively drop advice keys and neutralize long strings. */
export function neutralizeData<T>(value: T): T {
  if (typeof value === "string") {
    return (value.length > 40 ? neutralizeText(value) : value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => neutralizeData(v)).filter((v) => !(typeof v === "string" && v.trim() === "")) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (ADVICE_KEY.test(k.replace(/([a-z])([A-Z])/g, "$1_$2"))) continue;
      if (typeof v === "string" && ADVICE_VALUE.test(v.trim())) continue;
      out[k] = neutralizeData(v);
    }
    return out as T;
  }
  return value;
}
