import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }): Promise<Metadata> {
  const { symbol } = await params;
  const ticker = decodeURIComponent(symbol).toUpperCase();
  const title = `${ticker} Stock Analysis — White Tiger`;
  const description = `AI-powered institutional analysis for ${ticker}: valuation, DCF, technicals, geopolitical & macro risk, and a clear verdict. Educational use only — not investment advice.`;
  return {
    title,
    description,
    openGraph: { type: "article", title, description, siteName: "White Tiger", images: [{ url: "/apple-icon.png", width: 512, height: 512 }] },
    twitter: { card: "summary_large_image", title, description, images: ["/apple-icon.png"] },
  };
}

export default function StockSymbolLayout({ children }: { children: React.ReactNode }) {
  return children;
}
