import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/ComingSoonPage";
import { isComingSoon } from "@/lib/comingSoon";

// Real Estate isn't launched yet (see src/lib/comingSoon.ts), so these pages
// show a coming-soon screen instead of their content and stay out of search.
export const metadata: Metadata = {
  title: "Real Estate · Coming soon — White Tiger",
  robots: { index: false, follow: false },
};

export default function RealEstateLocationLayout({ children }: { children: React.ReactNode }) {
  if (!isComingSoon("realestate")) return children;
  return <ComingSoonPage title="Real Estate" blurb="City and locality insights, housing trends and REITs." />;
}
