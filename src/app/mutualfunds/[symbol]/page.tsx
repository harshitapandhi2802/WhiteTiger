import { redirect } from "next/navigation";

// Fund pages live at /mf-intelligence/<AMFI scheme code>; old slugs resolve there via a scheme picker.
export default async function LegacyMutualFundPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  redirect(`/mf-intelligence/${encodeURIComponent(symbol)}`);
}
