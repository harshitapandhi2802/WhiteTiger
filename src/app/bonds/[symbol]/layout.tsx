import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/ComingSoonPage";

// Detail pages built mostly on generated data; closed until verified (see docs/LAUNCH_AUDIT_2026-10-17.md).
// To reopen, return {children} instead.
export const metadata: Metadata = { title: "Bond deep-dive · Coming soon — White Tiger", robots: { index: false, follow: false } };

export default function ComingSoonLayout({ children }: { children: React.ReactNode }) {
  void children;
  return <ComingSoonPage title="Bond deep-dive" blurb="Detailed pages for individual bonds and G-Secs." />;
}
