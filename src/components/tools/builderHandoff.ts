/* Shared shape for strategies, so the option chain can hand legs to the builder. */
import type { OptionType } from "@/lib/options";

export const BUILDER_IMPORT_KEY = "wt_builder_import";

export interface UiLeg {
  id: string;
  kind: OptionType | "FUT";
  side: "BUY" | "SELL";
  strike: string;
  premium: string;
  lots: string;
  iv: string; // percent
}

export interface BuilderState {
  name: string;
  underlying: string;
  spot: string;
  days: string;
  rate: string;
  lotSize: string;
  source: "manual" | "template" | "chain";
  legs: UiLeg[];
}
