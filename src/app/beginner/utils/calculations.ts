// SIP calculator and portfolio return helpers

export function calculateSIP(monthly: number, annualReturn: number, years: number) {
  const monthlyRate = annualReturn / 12 / 100;
  const months = years * 12;
  const totalInvested = monthly * months;

  // Future value of SIP: P * [((1+r)^n - 1) / r] * (1+r)
  const fv = monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
  const estimatedReturns = fv - totalInvested;

  // Generate growth curve data for chart
  const chartData: { month: number; invested: number; value: number }[] = [];
  let currentValue = 0;
  for (let m = 0; m <= months; m++) {
    const invested = monthly * m;
    currentValue = m === 0 ? 0 : (currentValue + monthly) * (1 + monthlyRate);
    if (m % (years <= 5 ? 1 : years <= 15 ? 3 : 6) === 0 || m === months) {
      chartData.push({ month: m, invested, value: Math.round(currentValue) });
    }
  }

  return {
    totalInvested: Math.round(totalInvested),
    estimatedReturns: Math.round(estimatedReturns),
    totalValue: Math.round(fv),
    chartData,
  };
}

export function calculatePortfolioReturn(
  allocations: { ticker: string; allocation: number }[],
  stockReturns: Record<string, number>
): { totalInvested: number; currentValue: number; returnPercent: number } {
  let totalInvested = 0;
  let currentValue = 0;

  for (const a of allocations) {
    totalInvested += a.allocation;
    const returnPct = stockReturns[a.ticker] ?? 0;
    currentValue += a.allocation * (1 + returnPct / 100);
  }

  return {
    totalInvested: Math.round(totalInvested),
    currentValue: Math.round(currentValue),
    returnPercent: totalInvested > 0 ? Math.round(((currentValue - totalInvested) / totalInvested) * 10000) / 100 : 0,
  };
}

export function formatINR(n: number): string {
  if (n >= 1e7) return `${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `${(n / 1e5).toFixed(2)} L`;
  return n.toLocaleString("en-IN");
}
