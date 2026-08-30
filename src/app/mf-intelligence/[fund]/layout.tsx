import type { Metadata } from "next";

function titleize(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

export async function generateMetadata({ params }: { params: Promise<{ fund: string }> }): Promise<Metadata> {
  const { fund } = await params;
  const name = titleize(fund);
  const title = `${name} — Fund Analysis | White Tiger`;
  const description = `Deep mutual fund analysis for ${name}: returns vs benchmark, peer ranking, risk metrics, portfolio & a clear verdict. Educational use only — not investment advice.`;
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
