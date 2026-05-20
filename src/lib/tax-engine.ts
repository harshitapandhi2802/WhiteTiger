// ═══════════════════════════════════════════════════════════════
// AI Tax Intelligence Engine — India-First Tax Calculator + Advisory
// Personal Income Tax · Investment Tax · GST · Tax Saving · AI Copilot
// ═══════════════════════════════════════════════════════════════

/* ─── Seeded RNG (matches other engines) ─── */
function seededRng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// ═══════════════════════════════════════════════════════════════
// SECTION 1: PERSONAL INCOME TAX
// ═══════════════════════════════════════════════════════════════

export interface PersonalTaxInput {
  annualSalary: number;
  businessIncome: number;
  rentalIncome: number;
  foreignIncome: number;
  otherIncome: number;
  age: "below60" | "60to80" | "above80";
  // Deductions
  section80C: number;      // max 1.5L
  section80D: number;      // health insurance
  section80E: number;      // education loan
  nps80CCD: number;        // max 50K
  hra: number;
  homeLoan: number;        // max 2L section 24
  otherDeductions: number;
}

export interface TaxSlabBreakdown {
  slab: string;
  rate: number;
  taxableAmount: number;
  tax: number;
}

export interface RegimeComparison {
  regime: "old" | "new";
  label: string;
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  slabs: TaxSlabBreakdown[];
  baseTax: number;
  cess: number;
  surcharge: number;
  totalTax: number;
  effectiveRate: number;
  monthlyTax: number;
  takeHome: number;
  monthlyTakeHome: number;
}

export interface PersonalTaxReport {
  grossIncome: number;
  oldRegime: RegimeComparison;
  newRegime: RegimeComparison;
  recommended: "old" | "new";
  savings: number;
  aiInsights: string[];
  deductionSuggestions: DeductionSuggestion[];
  taxSavingPlan: TaxSavingItem[];
}

export interface DeductionSuggestion {
  section: string;
  description: string;
  maxLimit: string;
  currentUsed: number;
  potential: number;
  beginnerTip: string;
}

export interface TaxSavingItem {
  name: string;
  section: string;
  maxDeduction: string;
  lockIn: string;
  returns: string;
  risk: "Low" | "Medium" | "High";
  bestFor: string;
  beginnerTip: string;
}

function calculateOldRegimeSlabs(taxable: number, age: string): TaxSlabBreakdown[] {
  const exempt = age === "above80" ? 500000 : age === "60to80" ? 300000 : 250000;
  const slabs: TaxSlabBreakdown[] = [];
  let remaining = taxable;

  // Exempt slab
  const exemptAmt = Math.min(remaining, exempt);
  slabs.push({ slab: `Up to ₹${(exempt / 100000).toFixed(1)}L`, rate: 0, taxableAmount: exemptAmt, tax: 0 });
  remaining -= exemptAmt;

  if (remaining > 0) {
    const amt = Math.min(remaining, 250000);
    slabs.push({ slab: `₹${(exempt / 100000).toFixed(1)}L – ₹5L`, rate: 5, taxableAmount: amt, tax: amt * 0.05 });
    remaining -= amt;
  }
  if (remaining > 0) {
    const amt = Math.min(remaining, 500000);
    slabs.push({ slab: "₹5L – ₹10L", rate: 20, taxableAmount: amt, tax: amt * 0.20 });
    remaining -= amt;
  }
  if (remaining > 0) {
    slabs.push({ slab: "Above ₹10L", rate: 30, taxableAmount: remaining, tax: remaining * 0.30 });
  }

  return slabs;
}

function calculateNewRegimeSlabs(taxable: number): TaxSlabBreakdown[] {
  // FY 2025-26 new regime (post Budget 2025)
  const slabs: TaxSlabBreakdown[] = [];
  let remaining = taxable;

  const bands: [string, number, number][] = [
    ["Up to ₹4L", 400000, 0],
    ["₹4L – ₹8L", 400000, 5],
    ["₹8L – ₹12L", 400000, 10],
    ["₹12L – ₹16L", 400000, 15],
    ["₹16L – ₹20L", 400000, 20],
    ["₹20L – ₹24L", 400000, 25],
    ["Above ₹24L", Infinity, 30],
  ];

  for (const [label, width, rate] of bands) {
    if (remaining <= 0) break;
    const amt = Math.min(remaining, width);
    slabs.push({ slab: label, rate, taxableAmount: amt, tax: amt * (rate / 100) });
    remaining -= amt;
  }

  return slabs;
}

function getSurcharge(income: number, baseTax: number): number {
  if (income > 50000000) return baseTax * 0.37;
  if (income > 20000000) return baseTax * 0.25;
  if (income > 10000000) return baseTax * 0.15;
  if (income > 5000000) return baseTax * 0.10;
  return 0;
}

export function calculatePersonalTax(input: PersonalTaxInput): PersonalTaxReport {
  const gross = input.annualSalary + input.businessIncome + input.rentalIncome + input.foreignIncome + input.otherIncome;

  // Old regime deductions
  const sec80C = Math.min(input.section80C, 150000);
  const sec80D = Math.min(input.section80D, input.age === "below60" ? 25000 : 50000);
  const sec80E = input.section80E;
  const nps = Math.min(input.nps80CCD, 50000);
  const hra = input.hra;
  const homeLoan = Math.min(input.homeLoan, 200000);
  const stdDeduction = 75000; // FY 2025-26
  const totalOldDeductions = sec80C + sec80D + sec80E + nps + hra + homeLoan + input.otherDeductions + stdDeduction;

  // Old regime
  const oldTaxable = Math.max(0, gross - totalOldDeductions);
  const oldSlabs = calculateOldRegimeSlabs(oldTaxable, input.age);
  const oldBaseTax = oldSlabs.reduce((s, sl) => s + sl.tax, 0);
  // Rebate 87A for old regime (income up to 5L)
  const oldAfterRebate = oldTaxable <= 500000 ? 0 : oldBaseTax;
  const oldSurcharge = getSurcharge(oldTaxable, oldAfterRebate);
  const oldCess = (oldAfterRebate + oldSurcharge) * 0.04;
  const oldTotal = Math.round(oldAfterRebate + oldSurcharge + oldCess);

  // New regime (only standard deduction of 75K)
  const newDeductions = 75000;
  const newTaxable = Math.max(0, gross - newDeductions);
  const newSlabs = calculateNewRegimeSlabs(newTaxable);
  const newBaseTax = newSlabs.reduce((s, sl) => s + sl.tax, 0);
  // Rebate 87A for new regime (income up to 12L, max rebate 60K)
  const newAfterRebate = newTaxable <= 1200000 ? Math.max(0, newBaseTax - 60000) : newBaseTax;
  const finalNewAfterRebate = newTaxable <= 1200000 ? 0 : newAfterRebate;
  const newSurcharge = getSurcharge(newTaxable, finalNewAfterRebate);
  const newCess = (finalNewAfterRebate + newSurcharge) * 0.04;
  const newTotal = Math.round(finalNewAfterRebate + newSurcharge + newCess);

  const oldRegime: RegimeComparison = {
    regime: "old", label: "Old Tax Regime",
    grossIncome: gross, totalDeductions: totalOldDeductions,
    taxableIncome: oldTaxable, slabs: oldSlabs,
    baseTax: oldAfterRebate, cess: Math.round(oldCess), surcharge: Math.round(oldSurcharge),
    totalTax: oldTotal,
    effectiveRate: gross > 0 ? +((oldTotal / gross) * 100).toFixed(1) : 0,
    monthlyTax: Math.round(oldTotal / 12),
    takeHome: gross - oldTotal,
    monthlyTakeHome: Math.round((gross - oldTotal) / 12),
  };

  const newRegime: RegimeComparison = {
    regime: "new", label: "New Tax Regime (FY 2025-26)",
    grossIncome: gross, totalDeductions: newDeductions,
    taxableIncome: newTaxable, slabs: newSlabs,
    baseTax: finalNewAfterRebate, cess: Math.round(newCess), surcharge: Math.round(newSurcharge),
    totalTax: newTotal,
    effectiveRate: gross > 0 ? +((newTotal / gross) * 100).toFixed(1) : 0,
    monthlyTax: Math.round(newTotal / 12),
    takeHome: gross - newTotal,
    monthlyTakeHome: Math.round((gross - newTotal) / 12),
  };

  const recommended = oldTotal < newTotal ? "old" : "new";
  const savings = Math.abs(oldTotal - newTotal);

  // AI Insights
  const insights: string[] = [];
  if (gross <= 1200000) insights.push("Great news! Under the new regime, income up to ₹12 lakh is effectively tax-free due to the enhanced rebate under Section 87A.");
  if (totalOldDeductions > 200000) insights.push(`You're claiming ₹${(totalOldDeductions / 100000).toFixed(1)}L in deductions. The old regime may benefit you — but verify each deduction has valid proof.`);
  if (recommended === "old") insights.push(`The old regime saves you ₹${savings.toLocaleString()} because your deductions (₹${(totalOldDeductions / 100000).toFixed(1)}L) exceed the new regime's lower rates.`);
  else insights.push(`The new regime saves you ₹${savings.toLocaleString()} because lower slab rates outweigh the deductions you'd lose.`);
  if (input.businessIncome > 0) insights.push("Business income is taxed at slab rates. Consider opting for presumptive taxation under Section 44AD if turnover is below ₹3 crore.");
  if (input.rentalIncome > 0) insights.push(`Rental income of ₹${(input.rentalIncome / 100000).toFixed(1)}L is taxable after 30% standard deduction for maintenance. Municipal taxes paid can also be deducted.`);
  if (input.foreignIncome > 0) insights.push("Foreign income must be reported in your ITR. Check if India has a DTAA (Double Tax Avoidance Agreement) with the source country to claim foreign tax credit.");
  if (sec80C < 150000) insights.push(`You can save more! Section 80C limit is ₹1.5L but you're using only ₹${(sec80C / 1000).toFixed(0)}K. Consider ELSS, PPF, or NPS.`);

  // Deduction suggestions
  const deductions: DeductionSuggestion[] = [
    { section: "80C", description: "Investments in ELSS, PPF, EPF, Life Insurance, NSC, 5-yr FD, Tuition fees", maxLimit: "₹1,50,000", currentUsed: sec80C, potential: 150000 - sec80C, beginnerTip: "This is the most popular tax-saving section. If you invest ₹1.5L in ELSS mutual funds, you save up to ₹46,800 in taxes (at 30% slab)." },
    { section: "80D", description: "Health insurance premiums for self, spouse, children, parents", maxLimit: input.age === "below60" ? "₹25,000 (self) + ₹25,000 (parents)" : "₹50,000 (senior citizen)", currentUsed: sec80D, potential: (input.age === "below60" ? 50000 : 100000) - sec80D, beginnerTip: "Health insurance premium is deductible. For parents above 60, you can claim up to ₹50,000 extra." },
    { section: "80CCD(1B)", description: "Additional NPS contribution beyond 80C", maxLimit: "₹50,000", currentUsed: nps, potential: 50000 - nps, beginnerTip: "NPS gives you an extra ₹50,000 deduction OVER and ABOVE the ₹1.5L 80C limit. At 30% tax rate, that's ₹15,000 saved." },
    { section: "80E", description: "Interest on education loan (no upper limit)", maxLimit: "No limit", currentUsed: sec80E, potential: 0, beginnerTip: "The entire interest paid on an education loan is deductible — there's no cap! This applies for up to 8 years from when you start repaying." },
    { section: "24(b)", description: "Home loan interest for self-occupied property", maxLimit: "₹2,00,000", currentUsed: homeLoan, potential: 200000 - homeLoan, beginnerTip: "If you have a home loan, the interest paid (up to ₹2L per year) is deductible. This alone can save ₹60,000 in taxes at the 30% slab." },
    { section: "HRA", description: "House Rent Allowance exemption (if renting)", maxLimit: "Calculated based on salary", currentUsed: hra, potential: 0, beginnerTip: "If your employer gives HRA and you pay rent, a portion of your rent is tax-free. The exemption depends on your salary, city, and actual rent paid." },
  ];

  // Tax Saving Plan
  const taxSavingPlan: TaxSavingItem[] = [
    { name: "ELSS Mutual Funds", section: "80C", maxDeduction: "₹1,50,000", lockIn: "3 years", returns: "12-15% avg", risk: "High", bestFor: "Wealth creation + tax saving", beginnerTip: "ELSS funds invest in stocks but save tax. 3-year lock-in is the shortest among all 80C options. Best for young earners." },
    { name: "PPF (Public Provident Fund)", section: "80C", maxDeduction: "₹1,50,000", lockIn: "15 years", returns: "7.1% (govt guaranteed)", risk: "Low", bestFor: "Safe, long-term, guaranteed returns", beginnerTip: "PPF is like a government FD that also saves tax. Returns are tax-free! Best if you want zero-risk savings." },
    { name: "NPS (National Pension System)", section: "80CCD(1B)", maxDeduction: "₹50,000 extra", lockIn: "Until 60", returns: "8-10% historically", risk: "Medium", bestFor: "Retirement + extra tax saving beyond 80C", beginnerTip: "NPS gives ₹50,000 EXTRA deduction beyond 80C. If you're in the 30% bracket, that's ₹15,000 additional tax saving." },
    { name: "Health Insurance", section: "80D", maxDeduction: "₹25K-₹1L", lockIn: "Annual", returns: "Risk coverage", risk: "Low", bestFor: "Health protection + tax saving", beginnerTip: "Paying health insurance premium saves tax AND protects you from medical emergencies. Double benefit!" },
    { name: "Home Loan", section: "24(b) + 80C", maxDeduction: "₹2L interest + ₹1.5L principal", lockIn: "Loan tenure", returns: "Property appreciation", risk: "Medium", bestFor: "Home buyers with EMI", beginnerTip: "Both the principal (80C) and interest (Sec 24) on your home loan save tax. Can reduce taxable income by up to ₹3.5L!" },
    { name: "Tax Loss Harvesting", section: "Set-off", maxDeduction: "Capital losses", lockIn: "None", returns: "Tax offset", risk: "Low", bestFor: "Active investors with stock losses", beginnerTip: "If you sold stocks at a loss, you can use those losses to offset gains and pay less tax. Losses can carry forward 8 years." },
    { name: "Sukanya Samriddhi (SSY)", section: "80C", maxDeduction: "₹1,50,000", lockIn: "Until daughter turns 21", returns: "8.2% (govt guaranteed)", risk: "Low", bestFor: "Parents of girl child", beginnerTip: "Highest interest rate among all small savings + tax deduction + tax-free maturity. Triple tax benefit!" },
  ];

  return { grossIncome: gross, oldRegime, newRegime, recommended, savings, aiInsights: insights, deductionSuggestions: deductions, taxSavingPlan };
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2: INVESTMENT & MARKET TAXATION
// ═══════════════════════════════════════════════════════════════

export interface InvestmentTaxInput {
  stockSTCG: number;     // gains from stocks held < 1 year
  stockLTCG: number;     // gains from stocks held > 1 year
  mfEquitySTCG: number;
  mfEquityLTCG: number;
  mfDebtGains: number;
  foIncome: number;      // F&O profit
  cryptoGains: number;
  commodityGains: number;
  dividendIncome: number;
  reitIncome: number;
}

export interface InvestmentTaxItem {
  category: string;
  icon: string;
  amount: number;
  taxRate: string;
  taxAmount: number;
  holding: string;
  explanation: string;
  beginnerTip: string;
  sttApplicable: boolean;
  sttAmount: number;
}

export interface InvestmentTaxReport {
  items: InvestmentTaxItem[];
  totalGains: number;
  totalTax: number;
  totalSTT: number;
  effectiveRate: number;
  aiInsights: string[];
  netReturns: number;
}

export function calculateInvestmentTax(input: InvestmentTaxInput): InvestmentTaxReport {
  const items: InvestmentTaxItem[] = [];

  // Stock STCG — 20% (FY 2025-26)
  if (input.stockSTCG !== 0) {
    const tax = Math.max(0, input.stockSTCG) * 0.20;
    const stt = Math.max(0, input.stockSTCG) * 0.001;
    items.push({
      category: "Stock Short-Term Gains", icon: "📈",
      amount: input.stockSTCG, taxRate: "20%", taxAmount: Math.round(tax),
      holding: "< 12 months", sttApplicable: true, sttAmount: Math.round(stt),
      explanation: "Equity shares sold within 12 months attract 20% STCG tax (Section 111A). STT must be paid at time of sale.",
      beginnerTip: "If you bought a stock and sold it within 1 year at a profit, the government takes 20% of your profit as tax. Try holding for 1+ year to pay only 12.5%.",
    });
  }

  // Stock LTCG — 12.5% above ₹1.25L exemption
  if (input.stockLTCG !== 0) {
    const exemption = 125000;
    const taxable = Math.max(0, input.stockLTCG - exemption);
    const tax = taxable * 0.125;
    items.push({
      category: "Stock Long-Term Gains", icon: "🏆",
      amount: input.stockLTCG, taxRate: "12.5% (above ₹1.25L)", taxAmount: Math.round(tax),
      holding: "> 12 months", sttApplicable: true, sttAmount: Math.round(Math.max(0, input.stockLTCG) * 0.001),
      explanation: `LTCG on equity is 12.5% on gains above ₹1.25 lakh per year (Section 112A). Your first ₹1.25L of LTCG is completely tax-free.`,
      beginnerTip: "Hold stocks for more than 1 year and your first ₹1.25 lakh profit is TAX FREE. Above that, you pay only 12.5% — much less than STCG.",
    });
  }

  // MF Equity STCG
  if (input.mfEquitySTCG !== 0) {
    const tax = Math.max(0, input.mfEquitySTCG) * 0.20;
    items.push({
      category: "Equity MF Short-Term", icon: "📊",
      amount: input.mfEquitySTCG, taxRate: "20%", taxAmount: Math.round(tax),
      holding: "< 12 months", sttApplicable: true, sttAmount: Math.round(Math.max(0, input.mfEquitySTCG) * 0.001),
      explanation: "Equity mutual fund units sold within 12 months attract 20% STCG tax, same as direct equity.",
      beginnerTip: "Equity mutual funds are taxed like stocks. Hold them for 1+ year to get the lower LTCG rate.",
    });
  }

  // MF Equity LTCG
  if (input.mfEquityLTCG !== 0) {
    const exemption = 125000;
    const taxable = Math.max(0, input.mfEquityLTCG - exemption);
    const tax = taxable * 0.125;
    items.push({
      category: "Equity MF Long-Term", icon: "💎",
      amount: input.mfEquityLTCG, taxRate: "12.5% (above ₹1.25L)", taxAmount: Math.round(tax),
      holding: "> 12 months", sttApplicable: true, sttAmount: 0,
      explanation: "Equity MF LTCG is taxed at 12.5% on gains above ₹1.25L per year. Combined with stock LTCG for exemption limit.",
      beginnerTip: "The ₹1.25L exemption is shared between stocks AND equity mutual funds combined. Plan your selling accordingly.",
    });
  }

  // Debt MF — at slab rates (no indexation post April 2023)
  if (input.mfDebtGains !== 0) {
    const estimatedRate = 0.30; // assume highest slab
    const tax = Math.max(0, input.mfDebtGains) * estimatedRate;
    items.push({
      category: "Debt Mutual Fund Gains", icon: "🏦",
      amount: input.mfDebtGains, taxRate: "At slab rates (~30%)", taxAmount: Math.round(tax),
      holding: "Any", sttApplicable: false, sttAmount: 0,
      explanation: "Since April 2023, debt mutual fund gains (bought after 01/04/2023) are taxed at your income tax slab rate, regardless of holding period. No indexation benefit.",
      beginnerTip: "Debt mutual funds lost their tax advantage in 2023. Now they're taxed like FDs. Consider tax-free bonds or arbitrage funds for tax-efficient debt returns.",
    });
  }

  // F&O Income — business income at slab rates
  if (input.foIncome !== 0) {
    const tax = Math.max(0, input.foIncome) * 0.30;
    const stt = Math.max(0, input.foIncome) * 0.0125 / 100; // 0.0125% on option premium
    items.push({
      category: "F&O / Derivatives Income", icon: "⚡",
      amount: input.foIncome, taxRate: "Slab rates (business income)", taxAmount: Math.round(tax),
      holding: "N/A", sttApplicable: true, sttAmount: Math.round(stt),
      explanation: "F&O income is treated as non-speculative business income under Indian tax law. Taxed at slab rates. Requires ITR-3 filing. Losses can be carried forward for 8 years.",
      beginnerTip: "F&O trading income is NOT like stock investing — it's treated as business income. You must file ITR-3, maintain books of accounts, and may need a tax audit if turnover exceeds limits.",
    });
  }

  // Crypto — flat 30% + 1% TDS
  if (input.cryptoGains !== 0) {
    const tax = Math.max(0, input.cryptoGains) * 0.30;
    items.push({
      category: "Crypto / VDA Gains", icon: "₿",
      amount: input.cryptoGains, taxRate: "Flat 30% + 1% TDS", taxAmount: Math.round(tax),
      holding: "Any", sttApplicable: false, sttAmount: 0,
      explanation: "Crypto gains are taxed at a flat 30% under Section 115BBH. No deduction except cost of acquisition. Losses cannot be set off against any other income. 1% TDS on all transfers.",
      beginnerTip: "Crypto has the harshest tax rules in India: flat 30% tax, no loss offset, no indexation. Even if you lose money in BTC, you can't use it to reduce tax on ETH gains!",
    });
  }

  // Commodity trading
  if (input.commodityGains !== 0) {
    const tax = Math.max(0, input.commodityGains) * 0.30;
    items.push({
      category: "Commodity Trading", icon: "🛢️",
      amount: input.commodityGains, taxRate: "Slab rates (business)", taxAmount: Math.round(tax),
      holding: "N/A", sttApplicable: false, sttAmount: 0,
      explanation: "Commodity futures/options are treated as non-speculative business income. CTT (Commodity Transaction Tax) is applicable. Tax audit required for large turnovers.",
      beginnerTip: "Commodity trading (gold, crude, etc.) is treated like F&O — as business income. You need proper record-keeping and may require a tax audit.",
    });
  }

  // Dividends
  if (input.dividendIncome !== 0) {
    const tax = Math.max(0, input.dividendIncome) * 0.30;
    items.push({
      category: "Dividend Income", icon: "💰",
      amount: input.dividendIncome, taxRate: "At slab rates", taxAmount: Math.round(tax),
      holding: "N/A", sttApplicable: false, sttAmount: 0,
      explanation: "Since April 2020, dividends are taxable in the hands of the investor at their slab rate. Companies deduct 10% TDS if dividend exceeds ₹5,000 per year from a company.",
      beginnerTip: "Dividends are no longer tax-free in India. The company deducts 10% TDS, and you pay the rest when filing returns. High dividends can push you into a higher tax bracket.",
    });
  }

  // REIT Income
  if (input.reitIncome !== 0) {
    const tax = Math.max(0, input.reitIncome) * 0.30;
    items.push({
      category: "REIT / InvIT Income", icon: "🏢",
      amount: input.reitIncome, taxRate: "Mixed (dividend + capital gains)", taxAmount: Math.round(tax),
      holding: "Varies", sttApplicable: false, sttAmount: 0,
      explanation: "REIT distributions have 3 components: interest income (taxed at slab), dividend (taxed at slab), and return of capital (reduces cost basis). Capital gains on REIT units follow equity LTCG/STCG rules.",
      beginnerTip: "REITs give you rental income from commercial buildings. Part of the payout is tax-efficient (return of capital), making them better than direct rent for some investors.",
    });
  }

  const totalGains = items.reduce((s, it) => s + it.amount, 0);
  const totalTax = items.reduce((s, it) => s + it.taxAmount, 0);
  const totalSTT = items.reduce((s, it) => s + it.sttAmount, 0);
  const effectiveRate = totalGains > 0 ? +((totalTax / totalGains) * 100).toFixed(1) : 0;

  const aiInsights: string[] = [];
  if (input.stockSTCG > 100000 && input.stockLTCG < input.stockSTCG) {
    aiInsights.push("You have high STCG compared to LTCG. Consider holding stocks for 12+ months to benefit from the lower 12.5% LTCG rate instead of 20% STCG.");
  }
  if (input.cryptoGains > 0) {
    aiInsights.push("Crypto is taxed at a harsh 30% flat rate with no loss offset. Consider the tax impact before trading — every profitable trade triggers tax.");
  }
  if (input.foIncome > 5000000) {
    aiInsights.push("With F&O turnover above ₹5Cr, you may need a tax audit under Section 44AB. Maintain proper books of accounts.");
  }
  if (input.dividendIncome > 500000) {
    aiInsights.push("High dividend income may push you into a higher slab. Consider growth-option mutual funds instead of dividend-paying ones for tax efficiency.");
  }
  if (totalTax > 0) {
    aiInsights.push(`Your total investment tax liability is ₹${totalTax.toLocaleString()} (effective rate: ${effectiveRate}%). The after-tax net return is ₹${(totalGains - totalTax).toLocaleString()}.`);
  }

  return {
    items, totalGains, totalTax, totalSTT, effectiveRate, aiInsights,
    netReturns: totalGains - totalTax - totalSTT,
  };
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3: GST INTELLIGENCE
// ═══════════════════════════════════════════════════════════════

export interface GSTInput {
  annualTurnover: number;
  gstCategory: "goods" | "services" | "both";
  exports: number;
  inputCredits: number;
}

export interface GSTReport {
  isRegistrationRequired: boolean;
  registrationThreshold: string;
  estimatedGST: number;
  netGST: number; // after input credits
  gstSlabs: { slab: string; rate: number; description: string; examples: string }[];
  compositionScheme: { eligible: boolean; rate: string; benefit: string; limitation: string };
  aiInsights: string[];
  complianceCalendar: { task: string; frequency: string; deadline: string; penalty: string }[];
}

export function calculateGST(input: GSTInput): GSTReport {
  const isRequired = input.annualTurnover > (input.gstCategory === "services" ? 2000000 : 4000000);
  const threshold = input.gstCategory === "services" ? "₹20 lakh" : "₹40 lakh";

  const estimatedRate = input.gstCategory === "services" ? 0.18 : 0.12;
  const estimatedGST = Math.round(input.annualTurnover * estimatedRate);
  const netGST = Math.max(0, estimatedGST - input.inputCredits);

  const slabs = [
    { slab: "0% (Exempt)", rate: 0, description: "Essential goods and services", examples: "Fresh vegetables, milk, education, healthcare, public transport" },
    { slab: "5%", rate: 5, description: "Essential items and economy services", examples: "Packaged food, economy hotel rooms, rail tickets, small restaurants" },
    { slab: "12%", rate: 12, description: "Standard goods and processed items", examples: "Processed food, business class flights, gyms, work contracts" },
    { slab: "18%", rate: 18, description: "Most services and manufactured goods", examples: "IT services, financial services, restaurants in AC hotels, branded garments" },
    { slab: "28%", rate: 28, description: "Luxury and sin goods", examples: "Luxury cars, tobacco, aerated drinks, 5-star hotels, casinos, online gaming" },
  ];

  const compositionScheme = {
    eligible: input.annualTurnover <= 15000000,
    rate: input.gstCategory === "services" ? "6% of turnover" : "1% (mfg) / 5% (restaurant)",
    benefit: "Simplified compliance — quarterly returns instead of monthly. No need to maintain detailed invoices.",
    limitation: "Cannot collect GST from buyers. Cannot claim input tax credit. Cannot make inter-state sales.",
  };

  const insights: string[] = [];
  if (!isRequired) insights.push(`Your turnover of ₹${(input.annualTurnover / 100000).toFixed(1)}L is below the ${threshold} threshold. GST registration is optional but may be beneficial for input credits.`);
  if (input.inputCredits > estimatedGST * 0.5) insights.push("Your input credits are substantial. You're effectively paying much less GST than the headline rate.");
  if (input.exports > 0) insights.push("Exports are zero-rated under GST. You can claim refund of input credits used for exported goods/services.");
  if (compositionScheme.eligible) insights.push("You're eligible for the Composition Scheme — simpler compliance but you can't claim input credits or make inter-state sales.");

  const compliance = [
    { task: "GSTR-3B Filing", frequency: "Monthly", deadline: "20th of next month", penalty: "₹50/day (₹20 for nil)" },
    { task: "GSTR-1 Filing", frequency: "Monthly/Quarterly", deadline: "11th of next month", penalty: "₹50/day" },
    { task: "Annual Return (GSTR-9)", frequency: "Annual", deadline: "31st December", penalty: "₹200/day (max 0.5% turnover)" },
    { task: "E-Invoice", frequency: "Per transaction", deadline: "Real-time (if turnover >₹5Cr)", penalty: "100% of tax or ₹10,000" },
    { task: "TDS under GST", frequency: "Monthly", deadline: "10th of next month", penalty: "₹200/day" },
  ];

  return { isRegistrationRequired: isRequired, registrationThreshold: threshold, estimatedGST, netGST, gstSlabs: slabs, compositionScheme, aiInsights: insights, complianceCalendar: compliance };
}

// ═══════════════════════════════════════════════════════════════
// AI TAX COPILOT
// ═══════════════════════════════════════════════════════════════

export interface TaxCopilotNarrative {
  headline: string;
  summary: string;
  keyActions: string[];
  warnings: string[];
  opportunities: string[];
  mood: string;
  moodEmoji: string;
  moodColor: string;
}

export function generateTaxCopilot(personalTax: PersonalTaxReport | null, investmentTax: InvestmentTaxReport | null): TaxCopilotNarrative {
  const totalTax = (personalTax?.newRegime.totalTax ?? 0) + (investmentTax?.totalTax ?? 0);
  const gross = (personalTax?.grossIncome ?? 0) + (investmentTax?.totalGains ?? 0);
  const effectiveRate = gross > 0 ? +((totalTax / gross) * 100).toFixed(1) : 0;

  let mood: string, moodEmoji: string, moodColor: string;
  if (effectiveRate < 10) { mood = "Excellent"; moodEmoji = "🟢"; moodColor = "#00c853"; }
  else if (effectiveRate < 20) { mood = "Good"; moodEmoji = "🟡"; moodColor = "#ff9800"; }
  else if (effectiveRate < 30) { mood = "Moderate"; moodEmoji = "🟠"; moodColor = "#e65100"; }
  else { mood = "High Tax Burden"; moodEmoji = "🔴"; moodColor = "#c62828"; }

  const headline = personalTax
    ? `Your estimated total tax is ₹${totalTax.toLocaleString()} — effective rate of ${effectiveRate}%`
    : "Enter your income details to get AI-powered tax insights";

  const summary = personalTax
    ? `Based on your income of ₹${(gross / 100000).toFixed(1)}L, the ${personalTax.recommended === "new" ? "new" : "old"} tax regime saves you ₹${personalTax.savings.toLocaleString()}. ${effectiveRate < 15 ? "Your tax efficiency is good." : "There are opportunities to reduce your tax burden."}`
    : "The AI Tax Copilot will analyze your income, investments, and deductions to create a personalized tax-saving strategy.";

  const keyActions: string[] = [];
  const warnings: string[] = [];
  const opportunities: string[] = [];

  if (personalTax) {
    keyActions.push(`File your ITR using the ${personalTax.recommended} regime for maximum savings`);
    if (personalTax.recommended === "old") keyActions.push("Gather all deduction proofs (80C, 80D, HRA receipts) before filing");
    keyActions.push("Pay advance tax by 15th March if tax liability exceeds ₹10,000");

    if (personalTax.grossIncome > 5000000) warnings.push("Income above ₹50L attracts 10% surcharge. Consider timing income receipt across financial years if possible.");
    if (personalTax.oldRegime.totalDeductions < 200000) warnings.push("You're not maximizing your old regime deductions. Even if new regime is better now, explore Section 80C and 80D options.");

    const unused80C = 150000 - (personalTax.deductionSuggestions.find(d => d.section === "80C")?.currentUsed ?? 0);
    if (unused80C > 50000) opportunities.push(`Invest ₹${(unused80C / 1000).toFixed(0)}K more in 80C instruments (ELSS, PPF, NPS) to save up to ₹${Math.round(unused80C * 0.3).toLocaleString()} in taxes`);
    opportunities.push("Consider NPS for ₹50,000 extra deduction under 80CCD(1B) — available in BOTH old and new regime employer contribution");
  }

  if (investmentTax) {
    if (investmentTax.totalTax > 50000) keyActions.push("Consider tax-loss harvesting before March 31 to offset capital gains");
    if (investmentTax.items.some(i => i.category.includes("STCG"))) opportunities.push("Shift to long-term holding strategy to benefit from lower LTCG rate of 12.5% vs 20% STCG");
    if (investmentTax.items.some(i => i.category.includes("Crypto"))) warnings.push("Crypto losses cannot offset any other gains. Carefully consider trade frequency to minimize 30% tax impact.");
  }

  return { headline, summary, keyActions, warnings, opportunities, mood, moodEmoji, moodColor };
}

// ═══════════════════════════════════════════════════════════════
// MACRO & POLICY IMPACT ENGINE
// ═══════════════════════════════════════════════════════════════

export interface TaxPolicyUpdate {
  title: string;
  date: string;
  category: "Budget" | "RBI" | "CBDT" | "GST Council" | "SEBI";
  icon: string;
  impact: "Positive" | "Negative" | "Neutral";
  summary: string;
  detail: string;
  affectedTaxpayers: string;
  beginnerExplanation: string;
}

export const TAX_POLICY_UPDATES: TaxPolicyUpdate[] = [
  {
    title: "Union Budget 2025-26: New Tax Regime Slabs Revised",
    date: "Feb 2025", category: "Budget", icon: "🏛️", impact: "Positive",
    summary: "Tax-free income limit raised to ₹12 lakh under new regime with enhanced rebate",
    detail: "The government revised new regime slabs: 0% up to ₹4L, 5% ₹4-8L, 10% ₹8-12L, 15% ₹12-16L, 20% ₹16-20L, 25% ₹20-24L, 30% above ₹24L. Section 87A rebate enhanced to make income up to ₹12L effectively tax-free.",
    affectedTaxpayers: "All individual taxpayers",
    beginnerExplanation: "If you earn up to ₹12 lakh per year, you pay ZERO tax under the new regime! The government made it more attractive than before.",
  },
  {
    title: "LTCG Tax Rate Changed to 12.5%",
    date: "Jul 2024", category: "Budget", icon: "📈", impact: "Negative",
    summary: "Long-term capital gains tax on equity increased from 10% to 12.5%, exemption raised to ₹1.25L",
    detail: "LTCG on listed equity and equity-oriented MFs increased to 12.5% (from 10%). However, the annual exemption limit was raised to ₹1.25 lakh (from ₹1 lakh). STCG rate increased to 20% (from 15%).",
    affectedTaxpayers: "Stock and MF investors",
    beginnerExplanation: "The tax on long-term stock profits went up from 10% to 12.5%, but the tax-free limit also increased from ₹1L to ₹1.25L. Short-term tax jumped from 15% to 20%.",
  },
  {
    title: "Standard Deduction Increased to ₹75,000",
    date: "Jul 2024", category: "Budget", icon: "💼", impact: "Positive",
    summary: "Standard deduction raised from ₹50,000 to ₹75,000 for salaried employees",
    detail: "Available under both old and new tax regimes. Reduces taxable income by ₹75,000 without requiring any proof or investment. Family pensioners also get ₹25,000 standard deduction.",
    affectedTaxpayers: "All salaried employees and pensioners",
    beginnerExplanation: "Every salaried person automatically gets ₹75,000 deducted from their taxable income. No paperwork needed — it happens automatically!",
  },
  {
    title: "Debt MF Taxation Changed — No More Indexation",
    date: "Apr 2023", category: "CBDT", icon: "🏦", impact: "Negative",
    summary: "Debt mutual funds bought after April 2023 taxed at slab rates, no indexation benefit",
    detail: "Debt MFs, gold MFs, and international MFs purchased after 01/04/2023 are taxed at your income slab rate regardless of holding period. Indexation benefit removed.",
    affectedTaxpayers: "Debt and gold fund investors",
    beginnerExplanation: "Debt mutual funds used to have a special tax benefit if you held them 3+ years. That's gone now. They're taxed like FDs — at your regular income tax rate.",
  },
  {
    title: "Crypto TDS Rate: 1% on All VDA Transfers",
    date: "Jul 2022", category: "CBDT", icon: "₿", impact: "Negative",
    summary: "1% TDS on all crypto transactions + 30% flat tax on gains, no loss offset",
    detail: "Section 194S mandates 1% TDS on all Virtual Digital Asset transfers above ₹10,000 (₹50,000 for specified persons). Section 115BBH taxes crypto gains at flat 30%. No deduction allowed except cost of acquisition.",
    affectedTaxpayers: "All crypto traders and investors",
    beginnerExplanation: "Every time you sell crypto, 1% is deducted as TDS. If you make a profit, 30% goes as tax. Worst part: if you lose money on Bitcoin, you can't use that loss to reduce tax on Ethereum gains.",
  },
  {
    title: "GST Rate Rationalization — 5-Slab to 3-Slab Discussion",
    date: "2025", category: "GST Council", icon: "🏪", impact: "Neutral",
    summary: "GST Council deliberating merger of 12% and 18% slabs into a single 15-16% slab",
    detail: "The GST Council is considering simplifying the rate structure. Most items currently at 12% may move to 15%, while some at 18% may come down. Final decision pending.",
    affectedTaxpayers: "All businesses and consumers",
    beginnerExplanation: "The government is trying to simplify GST by reducing the number of tax rates. This could make compliance easier for businesses.",
  },
  {
    title: "RBI Repo Rate Cut Impact on Housing",
    date: "Apr 2025", category: "RBI", icon: "🏠", impact: "Positive",
    summary: "RBI cuts repo rate to 6.00% — home loans getting cheaper",
    detail: "The RBI has been cutting rates, making home loans cheaper. Lower EMIs mean more disposable income. Home loan interest deduction under Section 24(b) up to ₹2L remains available.",
    affectedTaxpayers: "Home loan borrowers",
    beginnerExplanation: "When RBI cuts interest rates, your home loan EMI goes down. Plus, you still get tax deduction on the interest you pay — double benefit!",
  },
  {
    title: "SEBI: STT Increased on F&O",
    date: "Oct 2024", category: "SEBI", icon: "⚡", impact: "Negative",
    summary: "STT on options selling increased to 0.1% (from 0.0625%)",
    detail: "SEBI raised STT on F&O to discourage excessive speculation. STT on options (sell side) increased to 0.1% of premium. STT on futures raised to 0.02%.",
    affectedTaxpayers: "F&O traders",
    beginnerExplanation: "The government increased the transaction tax on F&O trading because too many people were speculating. This makes F&O trading slightly more expensive.",
  },
];

// ═══════════════════════════════════════════════════════════════
// TAX SECTION DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export type TaxSection = "copilot" | "personal" | "investment" | "gst" | "savings" | "policy";

export const TAX_NAV_SECTIONS: { id: TaxSection; label: string; icon: string; description: string }[] = [
  { id: "copilot", label: "AI Copilot", icon: "🧠", description: "AI-powered tax advisor" },
  { id: "personal", label: "Income Tax", icon: "💼", description: "Personal income tax calculator" },
  { id: "investment", label: "Investment Tax", icon: "📈", description: "Stock, MF, F&O, crypto tax" },
  { id: "gst", label: "GST", icon: "🏪", description: "Business & GST calculator" },
  { id: "savings", label: "Tax Savings", icon: "💰", description: "AI tax saving recommendations" },
  { id: "policy", label: "Policy Updates", icon: "🏛️", description: "Budget & policy changes" },
];

// ═══════════════════════════════════════════════════════════════
// FORMAT HELPERS
// ═══════════════════════════════════════════════════════════════

export function formatINR(amount: number): string {
  if (Math.abs(amount) >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (Math.abs(amount) >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (Math.abs(amount) >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString()}`;
}
