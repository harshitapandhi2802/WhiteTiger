/**
 * Plan / option / category classification for AMFI scheme records.
 * Pure and dependency-free: used by scripts/sync-mf-universe.mjs (via Node type
 * stripping), the runtime AMFI service, and tests.
 *
 * Rule: AMFI's explicit Plan/Option columns win; otherwise the scheme NAV name
 * is parsed. Anything not clearly stated is "Unspecified" — never guessed.
 */
export type Plan = "Direct" | "Regular" | "Unspecified";
export type Option = "Growth" | "IDCW" | "Bonus" | "Unspecified";
export type IdcwType = "Payout" | "Reinvestment" | "Payout/Reinvestment" | null;

export interface Classification {
  plan: Plan;
  option: Option;
  idcwType: IdcwType;
  idcwFrequency: string | null;
  /** The option itself is labelled discontinued by the AMC (e.g. "Discontinued Flexi IDCW"). */
  optionDiscontinued: boolean;
}

const IDCW_RE = /\b(idcw|dividend|income distribution|payout|re-?investment|reinvest|distribution)\b/i;
const GROWTH_RE = /\b(growth|cumulative|accumulation)\b/i;
const FREQ: [RegExp, string][] = [
  [/\bdaily\b/i, "Daily"], [/\bweekly\b/i, "Weekly"], [/\bfortnightly\b/i, "Fortnightly"],
  [/\bmonthly\b/i, "Monthly"], [/\bquarterly\b/i, "Quarterly"], [/half[\s-]?yearly/i, "Half-yearly"],
  [/\bannual\b|\byearly\b/i, "Annual"], [/\bflexi\b/i, "Flexi"], [/\bperiodic\b/i, "Periodic"], [/\bdiscretionary\b/i, "Discretionary"],
];

export function classifyPlan(planCol: string, name: string): Plan {
  const src = planCol.trim() || name;
  if (/\bdirect\b/i.test(src)) return "Direct";
  if (/\bregular\b/i.test(src)) return "Regular";
  return "Unspecified";
}

export function classifyOption(optionCol: string, name: string): Omit<Classification, "plan"> {
  // Prefer the explicit Option column; fall back to the part of the name after the scheme title.
  const src = optionCol.trim() || name;
  let option: Option = "Unspecified";
  if (/\bbonus\b/i.test(src)) option = "Bonus";
  else if (IDCW_RE.test(src)) option = "IDCW";
  else if (GROWTH_RE.test(src)) option = "Growth";

  let idcwType: IdcwType = null, idcwFrequency: string | null = null;
  if (option === "IDCW") {
    const payout = /payout/i.test(src), reinv = /re-?invest/i.test(src);
    idcwType = payout && reinv ? "Payout/Reinvestment" : payout ? "Payout" : reinv ? "Reinvestment" : null;
    idcwFrequency = FREQ.find(([re]) => re.test(src))?.[1] ?? null;
  }
  return { option, idcwType, idcwFrequency, optionDiscontinued: /\bdiscontinued\b/i.test(src) };
}

/**
 * The variant-specific part of a NAV name: whatever follows the base scheme name
 * (so words in the title, like "Dividend Yield Fund" or "Growth Fund", are not read as options).
 */
export function variantTail(navName: string, baseName?: string): string {
  const n = navName.replace(/\s+/g, " ").trim();
  const b = (baseName ?? "").replace(/\s+/g, " ").trim();
  if (b && n.toLowerCase().startsWith(b.toLowerCase())) return n.slice(b.length);
  // No base name: drop well-known title phrases that contain option keywords.
  return n.replace(/dividend yield/ig, "").replace(/\b(long term |large cap |mid cap |small cap )?growth (fund|opportunities|advantage|plus)\b/ig, "");
}

export function classify(planCol: string, optionCol: string, navName: string, baseName?: string): Classification {
  const tail = variantTail(navName, baseName);
  return { plan: classifyPlan(planCol, tail), ...classifyOption(optionCol, tail) };
}

export type AssetClass = "Equity" | "Debt" | "Hybrid" | "Index Fund" | "ETF" | "Fund of Funds" | "Solution Oriented" | "Other";
export const ASSET_CLASSES: AssetClass[] = ["Equity", "Debt", "Hybrid", "Index Fund", "ETF", "Fund of Funds", "Solution Oriented", "Other"];

/** Unify AMFI's older and newer spellings of the same SEBI category. */
const SUB_ALIASES: [RegExp, string][] = [
  [/^elss.*|.*tax saver.*/i, "ELSS"],
  [/^(sectoral\s*\/?\s*thematic|thematic fund|sectoral fund)$/i, "Sectoral/Thematic"],
  [/(dynamic asset allocation.*balanced advantage|balanced advantage.*dynamic asset allocation|balanced advantage fund)/i, "Balanced Advantage / Dynamic Asset Allocation"],
  [/^banking and psu( debt)? fund$/i, "Banking and PSU Fund"],
  [/^children ?s fund$|^childrens' fund$/i, "Children's Fund"],
  [/^equity savings( fund)?$/i, "Equity Savings"],
  [/^multi asset allocation( fund)?$/i, "Multi Asset Allocation"],
  [/^other\s+etfs$/i, "Other ETFs"],
];

/**
 * "Equity Scheme - Large & Mid Cap Fund" → { assetClass: "Equity", subCategory: "Large & Mid Cap Fund" }.
 * Asset class is decided by explicit keywords so labels like "Other Scheme - Index Funds" are not lost in "Other".
 */
export function splitCategory(category: string): { assetClass: AssetClass; subCategory: string } {
  const c = category.replace(/\s+/g, " ").trim();
  const m = c.match(/^(.*?)\s*-\s*(.+)$/);
  const head = (m ? m[1] : c).trim();
  let sub = (m ? m[2] : c).replace(/\*+/g, "").trim();
  for (const [re, to] of SUB_ALIASES) if (re.test(sub)) { sub = to; break; }

  let assetClass: AssetClass;
  if (/\bETFs?\b/i.test(c)) assetClass = "ETF";
  else if (/index funds?/i.test(c)) assetClass = "Index Fund";
  else if (/\bFoF\b|fund of funds/i.test(c)) assetClass = "Fund of Funds";
  else if (/solution oriented|retirement|child|life cycle/i.test(c)) assetClass = "Solution Oriented";
  else if (/^equity|^elss/i.test(head)) assetClass = "Equity";
  else if (/^debt|^income/i.test(head)) assetClass = "Debt";
  else if (/^hybrid/i.test(head)) assetClass = "Hybrid";
  else assetClass = "Other";
  if (sub === head && !m) sub = assetClass === "Debt" ? "Income (legacy category)" : sub;
  return { assetClass, subCategory: sub };
}

/**
 * Older AMFI "Income/Debt Oriented Schemes" labels that verifiably correspond to a SEBI
 * category (every scheme filed under the old label carries the category's defining words
 * in its name — checked against the 14 Oct 2026 AMFI files). Ambiguous legacy labels
 * ("Long Term Fund", "Ultra Short to Short Term Fund", "Medium Term Fund") are left as-is.
 */
export const LEGACY_SUBCATEGORY_EQUIVALENTS: Record<string, string[]> = {
  "Floater Fund": ["Floating Interest Rates Fund"],
  "Gilt Fund with 10 year constant duration": ["10-year Constant Maturity Gilt Fund"],
  "Medium to Long Duration Fund": ["Medium to Long Term Fund"],
  "Dynamic Bond": ["Dynamic Term Fund"],
};

/** A category plus its verified legacy equivalents, for filtering. */
export function subCategoryAliases(subCategory: string): string[] {
  return [subCategory, ...(LEGACY_SUBCATEGORY_EQUIVALENTS[subCategory] ?? [])];
}
