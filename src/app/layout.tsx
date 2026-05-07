import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MoonLight — AI Stock Research for Indian Investors",
  description: "Institutional-grade stock analysis powered by AI. DCF valuations, investment thesis, risk analysis — for every Indian retail investor.",
  keywords: "stock research, NSE, BSE, AI investing, DCF valuation, India stocks",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
