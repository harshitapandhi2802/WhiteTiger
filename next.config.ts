import type { NextConfig } from "next";

// Content-Security-Policy — allows the third-party widgets/data sources White Tiger
// actually uses (TradingView charts, Razorpay checkout, Google Fonts, market-data APIs)
// while blocking everything else. 'unsafe-inline'/'unsafe-eval' are required by
// TradingView's embed + Next.js inline runtime; tighten further only if those are removed.
const csp = [
  "default-src 'self'",
  // Google Identity Services (sign-in) + TradingView + Razorpay + Next.js runtime.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com https://*.tradingview.com https://checkout.razorpay.com https://*.razorpay.com https://accounts.google.com https://apis.google.com https://*.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "frame-src 'self' https://*.tradingview.com https://*.razorpay.com https://api.razorpay.com https://accounts.google.com",
  "connect-src 'self' https: wss:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.razorpay.com",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // Security headers on all routes
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },

  // Image optimization domains
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.tradingview.com" },
      { protocol: "https", hostname: "**.yahoo.com" },
      { protocol: "https", hostname: "**.amfiindia.com" },
    ],
  },

  // Redirect dead routes
  async redirects() {
    return [
      { source: "/mode-selection", destination: "/analyze", permanent: true },
      { source: "/beginner", destination: "/analyze", permanent: false },
    ];
  },
};

export default nextConfig;
