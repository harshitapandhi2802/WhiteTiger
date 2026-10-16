import type { Metadata } from "next";
import master from "@/lib/mf-master.json";

const rows = (master as unknown as { rows: { c: number; n: string }[] }).rows;

export async function generateMetadata({ params }: { params: Promise<{ fund: string }> }): Promise<Metadata> {
  const { fund } = await params;
  const code = Number(decodeURIComponent(fund));
  const name = rows.find(r => r.c === code)?.n ?? decodeURIComponent(fund).replace(/-/g, " ");
  const title = `${name} — NAV & Returns | White Tiger`;
  const description = `Official AMFI NAV, NAV history, trailing and rolling returns, risk metrics and SIP/lump-sum calculators for ${name}. Educational use only — not investment advice.`;
  return {
    title,
    description,
    openGraph: { type: "article", title, description, siteName: "White Tiger", images: [{ url: "/apple-icon.png", width: 512, height: 512 }] },
    twitter: { card: "summary_large_image", title, description, images: ["/apple-icon.png"] },
  };
}

export default function MFFundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
