/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — NSE TRANSACTION CHARGES (pure)

   Statutory and exchange charges for one round trip (buy + sell).
   Brokerage is the user's input because it differs by broker.

   Rates in force as checked on 21 Oct 2026:
     • STT: Finance Act 2026 — futures 0.05% and options 0.15% of
       premium on the sell side, from 1 Apr 2026. Delivery 0.1% both
       sides; intraday 0.025% sell side (unchanged).
     • NSE transaction charges from 1 Mar 2026 (NSE circular of
       27 Feb 2026): 0.00307% cash, 0.00183% futures, 0.03553% options
       premium. Cross-checked with zerodha.com/charges.
     • SEBI turnover fee ₹10 per crore; stamp duty (buy side) 0.015%
       delivery, 0.003% intraday, 0.002% futures, 0.003% options.
     • GST 18% on brokerage + exchange transaction + SEBI charges.
   NSE's IPFT (₹0.01 per crore) is too small to show at rupee
   precision and is left out.
   Update RATES (and RATES_AS_OF) when a rate changes.
   ═══════════════════════════════════════════════════════════════ */

export type Segment = "delivery" | "intraday" | "futures" | "options";

export const RATES_AS_OF = "21 Oct 2026";

export const RATES: Record<Segment, { sttBuy: number; sttSell: number; exchange: number; stampBuy: number }> = {
  delivery: { sttBuy: 0.001, sttSell: 0.001, exchange: 0.0000307, stampBuy: 0.00015 },
  intraday: { sttBuy: 0, sttSell: 0.00025, exchange: 0.0000307, stampBuy: 0.00003 },
  futures: { sttBuy: 0, sttSell: 0.0005, exchange: 0.0000183, stampBuy: 0.00002 },
  options: { sttBuy: 0, sttSell: 0.0015, exchange: 0.0003553, stampBuy: 0.00003 },
};

export const SEBI_FEE = 10 / 1e7; // ₹10 per crore
export const GST = 0.18;

export interface ChargesInput {
  segment: Segment;
  buyPrice: number;   // per unit (premium for options)
  sellPrice: number;  // per unit
  quantity: number;   // units (lots × lot size for F&O)
  brokeragePerOrder: number; // ₹ per executed order (two orders: buy and sell)
  dpCharge?: number;  // ₹ per scrip on delivery sell (depository + broker), user input
}

export interface ChargesBreakdown {
  turnover: number;
  brokerage: number;
  stt: number;
  exchange: number;
  sebi: number;
  stamp: number;
  gst: number;
  dp: number;
  total: number;
  grossPnl: number;
  netPnl: number;
  breakevenMove: number; // ₹ per unit the price must move to cover costs
}

/** STT is rounded to the nearest rupee on the contract note. */
const rupee = (x: number) => Math.round(x);
const paise = (x: number) => Math.round(x * 100) / 100;

export function calculateCharges(input: ChargesInput): ChargesBreakdown {
  const { segment, buyPrice, sellPrice, quantity, brokeragePerOrder, dpCharge = 0 } = input;
  const rate = RATES[segment];
  const buyValue = buyPrice * quantity;
  const sellValue = sellPrice * quantity;
  const turnover = buyValue + sellValue;

  const brokerage = paise(brokeragePerOrder * (buyValue > 0 ? 1 : 0) + brokeragePerOrder * (sellValue > 0 ? 1 : 0));
  const stt = rupee(buyValue * rate.sttBuy + sellValue * rate.sttSell);
  const exchange = paise(turnover * rate.exchange);
  const sebi = paise(turnover * SEBI_FEE);
  const stamp = paise(buyValue * rate.stampBuy);
  const gst = paise((brokerage + exchange + sebi) * GST);
  const dp = segment === "delivery" && sellValue > 0 ? paise(dpCharge) : 0;
  const total = paise(brokerage + stt + exchange + sebi + stamp + gst + dp);
  const grossPnl = paise(sellValue - buyValue);

  return {
    turnover: paise(turnover), brokerage, stt, exchange, sebi, stamp, gst, dp, total,
    grossPnl, netPnl: paise(grossPnl - total),
    breakevenMove: quantity > 0 ? paise(total / quantity) : 0,
  };
}
