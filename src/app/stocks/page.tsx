import { redirect } from "next/navigation";

// The stock list lives in the Stocks tab of /analyze (single source of truth for the explorer).
export default function StocksIndexPage() {
  redirect("/analyze");
}
