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
// LIVE TAX CALENDAR — Upcoming Deadlines & Countdown
// ═══════════════════════════════════════════════════════════════

export interface TaxCalendarEvent {
  title: string;
  date: string;       // ISO date string e.g. "2026-07-31"
  category: "ITR" | "GST" | "TDS" | "Advance Tax" | "Audit";
  icon: string;
  description: string;
  penalty: string;
  beginnerTip: string;
  priority: "Critical" | "High" | "Medium";
}

export const TAX_CALENDAR_EVENTS: TaxCalendarEvent[] = [
  { title: "Advance Tax — 1st Instalment (15%)", date: "2026-06-15", category: "Advance Tax", icon: "💳", description: "Pay 15% of estimated annual tax liability as first instalment", penalty: "Interest under Section 234C if not paid on time", beginnerTip: "If your total tax for the year will exceed ₹10,000, you must pay advance tax in 4 instalments. The first 15% is due by June 15.", priority: "Critical" },
  { title: "ITR Filing Deadline — Individuals", date: "2026-07-31", category: "ITR", icon: "📄", description: "Last date to file Income Tax Return for FY 2025-26 (AY 2026-27) for individuals and HUFs not requiring audit", penalty: "Late fee ₹5,000 (₹1,000 if income < ₹5L) under Section 234F + interest under 234A", beginnerTip: "This is the most important tax deadline! File your return by July 31 to avoid penalties. You can file online on the Income Tax portal.", priority: "Critical" },
  { title: "GSTR-3B — Monthly Filing", date: "2026-06-20", category: "GST", icon: "🏪", description: "Monthly GST return with summary of outward/inward supplies and tax payment", penalty: "₹50/day late fee (₹20 for nil return) + 18% interest on outstanding tax", beginnerTip: "If you're GST registered, file GSTR-3B every month by the 20th. It's your main monthly GST return.", priority: "High" },
  { title: "TDS Payment — Q1", date: "2026-07-07", category: "TDS", icon: "✂️", description: "Deposit TDS deducted during April–June quarter to the government", penalty: "1.5% per month interest + penalty under Section 271C", beginnerTip: "If you deduct TDS from payments (rent, salary, contractor fees), you must deposit it to the government by the 7th of next month.", priority: "High" },
  { title: "Advance Tax — 2nd Instalment (45%)", date: "2026-09-15", category: "Advance Tax", icon: "💳", description: "Pay 45% of estimated annual tax (cumulative) as second instalment", penalty: "Interest under Section 234C", beginnerTip: "By September 15, you should have paid 45% of your annual estimated tax. This is cumulative — subtract what you already paid in June.", priority: "Critical" },
  { title: "TDS Return — Q1 (Form 26Q/24Q)", date: "2026-07-31", category: "TDS", icon: "📊", description: "File quarterly TDS return for April–June deductions", penalty: "₹200/day late fee under Section 234E (max = TDS amount)", beginnerTip: "After depositing TDS, you file a quarterly return summarizing all deductions. This helps the government track who paid what.", priority: "Medium" },
  { title: "GSTR-9 Annual Return", date: "2026-12-31", category: "GST", icon: "📋", description: "Annual GST return consolidating all monthly returns for FY 2025-26", penalty: "₹200/day (max 0.5% of turnover)", beginnerTip: "This is your yearly GST summary. It combines all your monthly GSTR-3B and GSTR-1 filings into one annual return.", priority: "High" },
  { title: "Advance Tax — 3rd Instalment (75%)", date: "2026-12-15", category: "Advance Tax", icon: "💳", description: "Pay 75% of estimated annual tax (cumulative) as third instalment", penalty: "Interest under Section 234C", beginnerTip: "By December 15, you should have paid 75% of your annual tax. Most salaried people don't need to worry — TDS covers this.", priority: "High" },
  { title: "Advance Tax — Final Instalment (100%)", date: "2027-03-15", category: "Advance Tax", icon: "💳", description: "Pay remaining 100% of estimated annual tax liability", penalty: "Interest under Sections 234B and 234C", beginnerTip: "Final advance tax instalment. After this, any shortfall attracts interest when you file your return.", priority: "Critical" },
  { title: "Tax Audit Report (44AB)", date: "2026-10-07", category: "Audit", icon: "🔍", description: "Deadline for filing Tax Audit Report for businesses with turnover above thresholds", penalty: "0.5% of turnover or ₹1.5L, whichever is less (Section 271B)", beginnerTip: "If your business turnover crosses certain limits (₹1Cr for regular, ₹10Cr for digital payments), a CA must audit your books.", priority: "High" },
  { title: "Belated ITR Filing (with penalty)", date: "2026-12-31", category: "ITR", icon: "⏰", description: "Last date to file belated/revised return for FY 2025-26", penalty: "₹5,000 late fee + loss of carry-forward of certain losses", beginnerTip: "Missed July 31? You can still file until December 31 — but you'll pay a ₹5,000 penalty and lose some benefits.", priority: "Medium" },
];

// ═══════════════════════════════════════════════════════════════
// LIVE TAX NEWS & INTELLIGENCE FEED
// ═══════════════════════════════════════════════════════════════

export interface TaxNewsFeedItem {
  title: string;
  source: string;
  sourceUrl: string;
  sourceIcon: string;
  timestamp: string;
  category: "Income Tax" | "GST" | "Capital Gains" | "RBI" | "Budget" | "SEBI" | "Crypto";
  summary: string;
  aiExplanation: string;
  impact: "Positive" | "Negative" | "Neutral";
}

export const TAX_NEWS_FEED: TaxNewsFeedItem[] = [
  { title: "CBDT Extends ITR Filing Deadline for Audit Cases to Oct 15", source: "Income Tax India", sourceUrl: "https://incometaxindia.gov.in", sourceIcon: "🏛️", timestamp: "2 hours ago", category: "Income Tax", summary: "CBDT has extended the deadline for filing ITR in audit cases from September 30 to October 7, providing relief to businesses.", aiExplanation: "If you run a business that requires a tax audit, you now get 7 extra days to file. This doesn't affect salaried individuals — their deadline remains July 31.", impact: "Positive" },
  { title: "GST Council Considering 3-Slab Rationalization", source: "GST Portal", sourceUrl: "https://www.gst.gov.in", sourceIcon: "🏪", timestamp: "5 hours ago", category: "GST", summary: "The GST Council is actively discussing merging the 12% and 18% slabs into a unified 15-16% rate to simplify compliance.", aiExplanation: "If this happens, most services currently at 18% (IT, financial services) would become cheaper. But goods at 12% (processed food) might get costlier. Net effect depends on what you buy/sell.", impact: "Neutral" },
  { title: "RBI Cuts Repo Rate to 5.75% — 3rd Cut in 2025", source: "RBI", sourceUrl: "https://www.rbi.org.in", sourceIcon: "🏦", timestamp: "1 day ago", category: "RBI", summary: "RBI reduces repo rate by 25 bps to 5.75%, signaling continued easing cycle. Home loan EMIs expected to decrease.", aiExplanation: "Lower repo rate = lower interest rates. Your home loan EMI will decrease. BUT fixed deposits and savings account interest rates will also drop. If you have a home loan, this is great news!", impact: "Positive" },
  { title: "New Capital Gains Tax Rules Effective from FY 2025-26", source: "CBDT", sourceUrl: "https://incometaxindia.gov.in", sourceIcon: "📈", timestamp: "1 day ago", category: "Capital Gains", summary: "STCG on equity now 20% (up from 15%), LTCG now 12.5% (up from 10%). Exemption limit raised to ₹1.25 lakh.", aiExplanation: "You'll pay slightly more tax on stock profits. Short-term gains tax jumped from 15% to 20%. Long-term went from 10% to 12.5%, but the tax-free limit increased from ₹1L to ₹1.25L. Hold stocks longer to save!", impact: "Negative" },
  { title: "SEBI Tightens F&O Rules — Lot Size and Margin Changes", source: "SEBI", sourceUrl: "https://www.sebi.gov.in", sourceIcon: "⚡", timestamp: "2 days ago", category: "SEBI", summary: "SEBI has increased minimum lot sizes for index options and raised margin requirements to curb retail speculation.", aiExplanation: "SEBI is making F&O trading harder for small traders. Higher lot sizes mean you need more capital. This is to protect retail investors who were losing money — 93% of F&O traders lose according to SEBI data.", impact: "Neutral" },
  { title: "Budget 2025: Income Up to ₹12L Tax-Free Under New Regime", source: "Ministry of Finance", sourceUrl: "https://www.indiabudget.gov.in", sourceIcon: "🏛️", timestamp: "3 days ago", category: "Budget", summary: "Union Budget 2025-26 makes income up to ₹12 lakh tax-free under the new regime through enhanced Section 87A rebate.", aiExplanation: "Big win for the middle class! If you earn up to ₹12 lakh, you pay ZERO income tax under the new regime. This is the default regime now — you don't even need to opt in.", impact: "Positive" },
  { title: "Crypto TDS Compliance — IT Dept Sends Notices", source: "Income Tax India", sourceUrl: "https://incometaxindia.gov.in", sourceIcon: "₿", timestamp: "4 days ago", category: "Crypto", summary: "IT Department is sending notices to crypto exchanges and traders for non-compliance with 1% TDS under Section 194S.", aiExplanation: "If you traded crypto and didn't ensure 1% TDS was deducted, expect a notice. Most major exchanges (WazirX, CoinDCX) do this automatically, but P2P trades are your responsibility.", impact: "Negative" },
  { title: "New e-Filing Portal 3.0 Launched with AI Assistance", source: "Income Tax India", sourceUrl: "https://incometaxindia.gov.in", sourceIcon: "🤖", timestamp: "5 days ago", category: "Income Tax", summary: "The Income Tax Department has launched an upgraded e-filing portal with AI-assisted form filling and real-time validation.", aiExplanation: "Filing your ITR just got easier! The new portal uses AI to pre-fill your return from Form 16, AIS, and TIS data. It can also suggest the best regime for you. Give it a try at incometax.gov.in.", impact: "Positive" },
];

// ═══════════════════════════════════════════════════════════════
// INVESTMENT TAX FLOW EXPLAINERS — Visual Step-by-Step
// ═══════════════════════════════════════════════════════════════

export interface InvestmentTaxFlowStep {
  label: string;
  detail: string;
  color: string;
}

export interface InvestmentTaxFlow {
  assetClass: string;
  icon: string;
  color: string;
  steps: InvestmentTaxFlowStep[];
  taxSummary: string;
  exemption: string;
  proTip: string;
}

export const INVESTMENT_TAX_FLOWS: InvestmentTaxFlow[] = [
  {
    assetClass: "Equity Stocks", icon: "📈", color: "#0d47a1",
    steps: [
      { label: "Buy Stocks", detail: "No tax when buying. STT (0.1%) charged on purchase.", color: "#00c853" },
      { label: "Hold Period?", detail: "Critical decision: < 12 months = Short Term, > 12 months = Long Term", color: "#ff9800" },
      { label: "STCG → 20% Tax", detail: "Short-term gains taxed at flat 20% (Section 111A)", color: "#ef5350" },
      { label: "LTCG → 12.5% Tax", detail: "Long-term gains taxed at 12.5% above ₹1.25L exemption (Section 112A)", color: "#2962ff" },
    ],
    taxSummary: "STCG 20% | LTCG 12.5% above ₹1.25L",
    exemption: "First ₹1.25L LTCG per year is tax-free",
    proTip: "Hold for 1+ year to drop from 20% to 12.5%. Harvest ₹1.25L gains annually tax-free.",
  },
  {
    assetClass: "Mutual Funds (Equity)", icon: "📊", color: "#7c3aed",
    steps: [
      { label: "Invest in Equity MF", detail: "No entry tax. SIP or lumpsum — no tax difference.", color: "#00c853" },
      { label: "Holding < 12 months", detail: "Redemption within 12 months = Short-Term Capital Gains", color: "#ff9800" },
      { label: "STCG → 20% Tax", detail: "Same as direct equity — taxed at 20%", color: "#ef5350" },
      { label: "LTCG → 12.5% Tax", detail: "After 12 months, 12.5% tax on gains above ₹1.25L (shared with stock LTCG)", color: "#2962ff" },
    ],
    taxSummary: "Same as stocks: STCG 20% | LTCG 12.5%",
    exemption: "₹1.25L LTCG shared between stocks + equity MFs",
    proTip: "SIP investors: each SIP instalment has its own 12-month clock. Don't redeem early!",
  },
  {
    assetClass: "Debt Mutual Funds", icon: "🏦", color: "#e65100",
    steps: [
      { label: "Invest in Debt MF", detail: "Liquid, ultra-short, corporate bond funds, etc.", color: "#00c853" },
      { label: "Any Holding Period", detail: "Since April 2023, no LTCG benefit — taxed at slab regardless", color: "#ff9800" },
      { label: "Taxed at Slab Rate", detail: "Gains added to your income and taxed at your slab rate (up to 30%)", color: "#ef5350" },
      { label: "No Indexation", detail: "Indexation benefit removed for funds bought after 01/04/2023", color: "#c62828" },
    ],
    taxSummary: "At income slab rates (up to 30%+cess)",
    exemption: "None — fully taxable",
    proTip: "Consider arbitrage funds (taxed as equity) or tax-free bonds for better after-tax returns.",
  },
  {
    assetClass: "F&O / Derivatives", icon: "⚡", color: "#d32f2f",
    steps: [
      { label: "Trade F&O", detail: "Options/Futures on NSE/BSE. STT on sell side.", color: "#ff9800" },
      { label: "Classified as Business", detail: "F&O income is non-speculative business income — not capital gains!", color: "#ef5350" },
      { label: "Taxed at Slab Rates", detail: "Added to your total income and taxed at applicable slab rate", color: "#c62828" },
      { label: "Requires ITR-3", detail: "Must file ITR-3 + maintain books. Tax audit if turnover > limits.", color: "#7c3aed" },
    ],
    taxSummary: "Business income — slab rates (up to 30%+cess)",
    exemption: "Losses carry forward 8 years (non-speculative)",
    proTip: "Track turnover carefully. Audit threshold: ₹10Cr (if 95%+ digital). Keep all trade logs.",
  },
  {
    assetClass: "Cryptocurrency", icon: "₿", color: "#ff6f00",
    steps: [
      { label: "Buy Crypto", detail: "1% TDS on purchase value (Section 194S)", color: "#ff9800" },
      { label: "Sell / Trade", detail: "Any sale, swap, or use triggers taxable event", color: "#ef5350" },
      { label: "Flat 30% Tax", detail: "Gains taxed at flat 30% under Section 115BBH — no slab benefit", color: "#c62828" },
      { label: "No Loss Offset", detail: "Cannot offset crypto losses against any other income or crypto gains", color: "#b71c1c" },
    ],
    taxSummary: "Flat 30% + 4% cess + 1% TDS",
    exemption: "Only cost of acquisition deductible",
    proTip: "Harshest tax regime in India. Each token is treated separately — BTC loss can't offset ETH gain.",
  },
  {
    assetClass: "Dividends", icon: "💰", color: "#00695c",
    steps: [
      { label: "Receive Dividend", detail: "Company/MF pays dividend to your account", color: "#00c853" },
      { label: "10% TDS Deducted", detail: "If dividend > ₹5,000/year from a company, 10% TDS applies", color: "#ff9800" },
      { label: "Added to Income", detail: "Full dividend amount added to your gross taxable income", color: "#ef5350" },
      { label: "Taxed at Slab", detail: "Pay tax at your marginal slab rate (minus TDS already deducted)", color: "#c62828" },
    ],
    taxSummary: "At income slab rates (up to 30%+cess)",
    exemption: "None since April 2020 (DDT abolished)",
    proTip: "High-income earners: switch from dividend to growth option in MFs to defer tax.",
  },
];

// ═══════════════════════════════════════════════════════════════
// AI TAX SAVING INSIGHTS GENERATOR
// ═══════════════════════════════════════════════════════════════

export interface TaxSavingInsight {
  title: string;
  icon: string;
  potentialSaving: string;
  difficulty: "Easy" | "Medium" | "Advanced";
  description: string;
  beginnerTip: string;
  color: string;
}

export function generateTaxSavingInsights(personal: PersonalTaxReport | null, invest: InvestmentTaxReport | null): TaxSavingInsight[] {
  const insights: TaxSavingInsight[] = [];

  // Always show some general insights
  insights.push({
    title: "Maximize Section 80C Fully", icon: "🎯", potentialSaving: "Up to ₹46,800/year", difficulty: "Easy",
    description: "Invest the full ₹1.5L in ELSS, PPF, or NPS to claim maximum 80C deduction under old regime.",
    beginnerTip: "If you're in the 30% bracket and invest ₹1.5L in ELSS, you save ₹46,800 in taxes every year!",
    color: "#00c853",
  });

  insights.push({
    title: "Claim NPS Extra ₹50K (80CCD1B)", icon: "🏆", potentialSaving: "Up to ₹15,600/year", difficulty: "Easy",
    description: "NPS offers ₹50,000 additional deduction beyond 80C limit. Available even under new regime for employer contributions.",
    beginnerTip: "This is free money! ₹50K extra deduction means ₹15,600 saved at 30% slab — on top of your 80C limit.",
    color: "#2962ff",
  });

  insights.push({
    title: "Tax-Loss Harvesting Before March 31", icon: "📉", potentialSaving: "Varies with portfolio", difficulty: "Advanced",
    description: "Sell loss-making stocks to book capital losses, then offset against capital gains. Losses can be carried forward 8 years.",
    beginnerTip: "If you have stocks losing money AND stocks making money, sell the losers to reduce tax on the winners. Buy them back after 1 day.",
    color: "#7c3aed",
  });

  insights.push({
    title: "Harvest ₹1.25L LTCG Annually", icon: "💎", potentialSaving: "Up to ₹15,625/year", difficulty: "Medium",
    description: "Sell and rebuy equity holdings every year to book up to ₹1.25L in tax-free LTCG. Resets your cost basis higher.",
    beginnerTip: "Each year, sell enough stocks to book ₹1.25L profit (tax-free!), then buy them back. Over time, this saves lakhs.",
    color: "#00695c",
  });

  insights.push({
    title: "Health Insurance for Family (80D)", icon: "🏥", potentialSaving: "Up to ₹31,200/year", difficulty: "Easy",
    description: "Get health insurance for self (₹25K deduction) + parents (₹50K if senior) = total ₹75K deduction possible.",
    beginnerTip: "₹75K deduction for health insurance = ₹23,400 saved at 30% slab. Plus you get actual health coverage!",
    color: "#e65100",
  });

  if (personal && personal.grossIncome > 1500000) {
    insights.push({
      title: "Home Loan Double Benefit", icon: "🏠", potentialSaving: "Up to ₹1,06,600/year", difficulty: "Medium",
      description: "Home loan interest (Sec 24: ₹2L) + principal (Sec 80C: ₹1.5L) = ₹3.5L total deduction under old regime.",
      beginnerTip: "If you have or plan to get a home loan, the combined deduction of ₹3.5L can save over ₹1 lakh in taxes annually!",
      color: "#0d47a1",
    });
  }

  if (invest && invest.items.some(i => i.category.includes("Dividend") && i.amount > 200000)) {
    insights.push({
      title: "Switch to Growth Option in MFs", icon: "🔄", potentialSaving: "Defer tax until redemption", difficulty: "Easy",
      description: "Dividend option forces annual tax. Growth option defers all tax until you sell — potentially at lower LTCG rates.",
      beginnerTip: "Instead of getting dividends (taxed at your slab = up to 30%), choose growth option and let money compound. Pay only 12.5% LTCG when you eventually sell.",
      color: "#ff6f00",
    });
  }

  insights.push({
    title: "Use New Regime If Deductions < ₹3.75L", icon: "⚖️", potentialSaving: "Varies", difficulty: "Easy",
    description: "If your total deductions (80C+80D+HRA+home loan) are less than ~₹3.75L, the new regime's lower slab rates save more.",
    beginnerTip: "Quick rule: if you don't have a home loan and your deductions are small, the new regime is almost always better!",
    color: "#1565c0",
  });

  return insights;
}

// ═══════════════════════════════════════════════════════════════
// REGIME COMPARISON VISUALIZATION DATA
// ═══════════════════════════════════════════════════════════════

export interface SlabVisualization {
  slab: string;
  oldRate: number;
  newRate: number;
  difference: number;
}

export function getSlabComparisonData(): SlabVisualization[] {
  return [
    { slab: "Up to ₹2.5L", oldRate: 0, newRate: 0, difference: 0 },
    { slab: "₹2.5L – ₹4L", oldRate: 5, newRate: 0, difference: -5 },
    { slab: "₹4L – ₹5L", oldRate: 5, newRate: 5, difference: 0 },
    { slab: "₹5L – ₹8L", oldRate: 20, newRate: 5, difference: -15 },
    { slab: "₹8L – ₹10L", oldRate: 20, newRate: 10, difference: -10 },
    { slab: "₹10L – ₹12L", oldRate: 30, newRate: 10, difference: -20 },
    { slab: "₹12L – ₹16L", oldRate: 30, newRate: 15, difference: -15 },
    { slab: "₹16L – ₹20L", oldRate: 30, newRate: 20, difference: -10 },
    { slab: "₹20L – ₹24L", oldRate: 30, newRate: 25, difference: -5 },
    { slab: "Above ₹24L", oldRate: 30, newRate: 30, difference: 0 },
  ];
}

// ═══════════════════════════════════════════════════════════════
// OFFICIAL TAX SOURCES — Government Portal Links
// ═══════════════════════════════════════════════════════════════

export interface OfficialTaxSource {
  name: string;
  url: string;
  icon: string;
  color: string;
  description: string;
  services: string[];
}

export const OFFICIAL_TAX_SOURCES: OfficialTaxSource[] = [
  { name: "Income Tax India", url: "https://incometaxindia.gov.in", icon: "🏛️", color: "#0d47a1", description: "Official Income Tax e-Filing Portal", services: ["ITR Filing", "AIS/TIS", "Form 26AS", "Refund Status", "Tax Calculator"] },
  { name: "GST Portal", url: "https://www.gst.gov.in", icon: "🏪", color: "#e65100", description: "Goods & Services Tax Network", services: ["GSTR Filing", "E-Way Bills", "ITC Matching", "GST Calculator", "Taxpayer Search"] },
  { name: "CBDT", url: "https://www.incometaxindia.gov.in/pages/about-us/central-board-of-direct-taxes.aspx", icon: "⚖️", color: "#1565c0", description: "Central Board of Direct Taxes", services: ["Circulars", "Notifications", "Tax Treaties", "Forms"] },
  { name: "RBI", url: "https://www.rbi.org.in", icon: "🏦", color: "#00695c", description: "Reserve Bank of India", services: ["Repo Rate", "Forex Rates", "NRI Taxation", "FEMA Guidelines"] },
  { name: "SEBI", url: "https://www.sebi.gov.in", icon: "📊", color: "#7c3aed", description: "Securities Exchange Board of India", services: ["STT Rates", "F&O Rules", "MF Regulations", "Investor Protection"] },
  { name: "India Budget", url: "https://www.indiabudget.gov.in", icon: "📜", color: "#c62828", description: "Union Budget Documents", services: ["Budget Speech", "Finance Bill", "Memorandum", "Tax Proposals"] },
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

export function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
