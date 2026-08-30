import type { Metadata } from "next";

function titleize(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

export async function generateMetadata({ params }: { params: Promise<{ location: string }> }): Promise<Metadata> {
  const { location } = await params;
  const name = titleize(location);
  const title = `${name} Real Estate Intelligence — White Tiger`;
  const description = `Property market analysis for ${name}: price trends, rental yields, infrastructure impact, investment score & AI outlook. Educational use only — not investment advice.`;
  return {
    title,
    description,
    openGraph: { type: "article", title, description, siteName: "White Tiger", images: [{ url: "/apple-icon.png", width: 512, height: 512 }] },
    twitter: { card: "summary_large_image", title, description, images: ["/apple-icon.png"] },
  };
}

export default function RealEstateLocationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
