import { NextResponse } from "next/server";

/* ══════════════════════════════════════════════════════════════════
   WHITE TIGER — Live Market News Aggregator
   Fetches real news from official RSS feeds:
   • RBI Press Releases
   • SEBI Circulars & Press Releases
   • Economic Times Markets
   • Moneycontrol Market Reports
   • Mint Markets
   • Google News (India financial)
   ══════════════════════════════════════════════════════════════════ */

type NewsItem = {
  headline: string;
  body: string;
  source: string;
  sourceIcon: string;
  url: string;
  category: string;
  publishedAt: string;
  sentiment: "bullish" | "bearish" | "neutral";
};

// ─── RSS Feed Configuration by Tab ───
const FEEDS: Record<string, { url: string; source: string; icon: string; category: string }[]> = {
  stocks: [
    { url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", source: "Economic Times", icon: "ET", category: "MARKET" },
    { url: "https://www.moneycontrol.com/rss/marketreports.xml", source: "Moneycontrol", icon: "MC", category: "MARKET" },
    { url: "https://www.livemint.com/rss/markets", source: "Mint", icon: "LM", category: "MARKET" },
    { url: "https://news.google.com/rss/search?q=NSE+BSE+NIFTY+SENSEX+Indian+stock+market&hl=en-IN&gl=IN&ceid=IN:en", source: "Google News", icon: "GN", category: "MARKET" },
  ],
  commodities: [
    { url: "https://economictimes.indiatimes.com/markets/commodities/rssfeeds/5611099.cms", source: "Economic Times", icon: "ET", category: "COMMODITY" },
    { url: "https://news.google.com/rss/search?q=MCX+gold+crude+oil+commodity+India&hl=en-IN&gl=IN&ceid=IN:en", source: "Google News", icon: "GN", category: "COMMODITY" },
    { url: "https://www.moneycontrol.com/rss/commoditynews.xml", source: "Moneycontrol", icon: "MC", category: "COMMODITY" },
  ],
  crypto: [
    { url: "https://news.google.com/rss/search?q=Bitcoin+Ethereum+crypto+cryptocurrency+India&hl=en-IN&gl=IN&ceid=IN:en", source: "Google News", icon: "GN", category: "CRYPTO" },
    { url: "https://economictimes.indiatimes.com/markets/cryptocurrency/rssfeeds/82519898.cms", source: "Economic Times", icon: "ET", category: "CRYPTO" },
  ],
  currency: [
    { url: "https://economictimes.indiatimes.com/markets/forex/rssfeeds/1977023501.cms", source: "Economic Times", icon: "ET", category: "FOREX" },
    { url: "https://news.google.com/rss/search?q=USD+INR+rupee+forex+RBI+exchange+rate&hl=en-IN&gl=IN&ceid=IN:en", source: "Google News", icon: "GN", category: "FOREX" },
    { url: "https://www.moneycontrol.com/rss/currencynews.xml", source: "Moneycontrol", icon: "MC", category: "FOREX" },
  ],
  mutualfunds: [
    { url: "https://economictimes.indiatimes.com/mf/rssfeeds/46498188.cms", source: "Economic Times", icon: "ET", category: "MF" },
    { url: "https://news.google.com/rss/search?q=mutual+fund+SIP+SEBI+AMFI+India&hl=en-IN&gl=IN&ceid=IN:en", source: "Google News", icon: "GN", category: "MF" },
    { url: "https://www.moneycontrol.com/rss/MFnews.xml", source: "Moneycontrol", icon: "MC", category: "MF" },
  ],
  debt: [
    { url: "https://news.google.com/rss/search?q=India+bond+yield+G-Sec+RBI+treasury&hl=en-IN&gl=IN&ceid=IN:en", source: "Google News", icon: "GN", category: "BONDS" },
    { url: "https://rbi.org.in/pressreleases_rss.xml", source: "RBI", icon: "RBI", category: "POLICY" },
    { url: "https://economictimes.indiatimes.com/markets/bonds/rssfeeds/45933498.cms", source: "Economic Times", icon: "ET", category: "BONDS" },
  ],
  international: [
    { url: "https://news.google.com/rss/search?q=S%26P+500+NASDAQ+global+markets+Wall+Street&hl=en-IN&gl=IN&ceid=IN:en", source: "Google News", icon: "GN", category: "GLOBAL" },
    { url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", source: "Economic Times", icon: "ET", category: "GLOBAL" },
  ],
  derivatives: [
    { url: "https://news.google.com/rss/search?q=NIFTY+options+futures+derivatives+F%26O+SEBI&hl=en-IN&gl=IN&ceid=IN:en", source: "Google News", icon: "GN", category: "F&O" },
    { url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", source: "Economic Times", icon: "ET", category: "F&O" },
  ],
  realestate: [
    { url: "https://news.google.com/rss/search?q=India+real+estate+property+RERA+housing&hl=en-IN&gl=IN&ceid=IN:en", source: "Google News", icon: "GN", category: "REALTY" },
    { url: "https://economictimes.indiatimes.com/industry/indl-goods/svs/construction/rssfeeds/13352306.cms", source: "Economic Times", icon: "ET", category: "REALTY" },
  ],
  wealth: [
    { url: "https://news.google.com/rss/search?q=wealth+management+portfolio+investment+India&hl=en-IN&gl=IN&ceid=IN:en", source: "Google News", icon: "GN", category: "WEALTH" },
    { url: "https://economictimes.indiatimes.com/wealth/rssfeeds/27055542.cms", source: "Economic Times", icon: "ET", category: "WEALTH" },
  ],
  tax: [
    { url: "https://news.google.com/rss/search?q=income+tax+India+GST+CBDT+capital+gains&hl=en-IN&gl=IN&ceid=IN:en", source: "Google News", icon: "GN", category: "TAX" },
    { url: "https://economictimes.indiatimes.com/wealth/tax/rssfeeds/27055553.cms", source: "Economic Times", icon: "ET", category: "TAX" },
  ],
};

// Also try to fetch RBI & SEBI for all tabs that need policy news
const REGULATORY_FEEDS = [
  { url: "https://news.google.com/rss/search?q=site:rbi.org.in+OR+%22Reserve+Bank+of+India%22&hl=en-IN&gl=IN&ceid=IN:en", source: "RBI", icon: "RBI", category: "POLICY" },
  { url: "https://news.google.com/rss/search?q=site:sebi.gov.in+OR+%22SEBI%22+regulation+circular&hl=en-IN&gl=IN&ceid=IN:en", source: "SEBI", icon: "SEBI", category: "POLICY" },
];

const REGULATORY_TABS = new Set(["stocks", "mutualfunds", "debt", "derivatives", "currency"]);

// ─── In-memory cache: 15 min TTL per tab ───
const newsCache: Record<string, { items: NewsItem[]; ts: number }> = {};
const CACHE_TTL = 15 * 60 * 1000;

// ─── Simple RSS XML parser ───
function parseRSSItems(xml: string, source: string, icon: string, category: string): NewsItem[] {
  const items: NewsItem[] = [];

  // Extract all <item> blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && items.length < 8) {
    const block = match[1];

    const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const descMatch = block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
    const linkMatch = block.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const dateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

    const headline = titleMatch?.[1]?.trim().replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'") || "";
    let body = descMatch?.[1]?.trim().replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'") || "";
    const url = linkMatch?.[1]?.trim() || "";
    const publishedAt = dateMatch?.[1]?.trim() || "";

    if (!headline || headline.length < 10) continue;

    // Truncate body to ~120 chars
    if (body.length > 150) body = body.substring(0, 147) + "...";

    // Simple sentiment detection from headline
    const lower = headline.toLowerCase();
    let sentiment: "bullish" | "bearish" | "neutral" = "neutral";
    const bullWords = ["surge", "rally", "gain", "rise", "jump", "high", "record", "boost", "grow", "up", "bull", "strong", "positive", "inflow", "profit", "buy"];
    const bearWords = ["fall", "drop", "crash", "decline", "low", "slip", "loss", "sell", "bear", "weak", "negative", "outflow", "fear", "risk", "cut", "down", "plunge"];

    if (bullWords.some(w => lower.includes(w))) sentiment = "bullish";
    else if (bearWords.some(w => lower.includes(w))) sentiment = "bearish";

    items.push({
      headline,
      body: body || headline,
      source,
      sourceIcon: icon,
      url,
      category,
      publishedAt,
      sentiment,
    });
  }

  return items;
}

// ─── Fetch a single feed with timeout ───
async function fetchFeed(feedUrl: string, source: string, icon: string, category: string): Promise<NewsItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "WhiteTiger-NewsBot/1.0",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      next: { revalidate: 900 }, // Next.js cache: 15 min
    });

    clearTimeout(timeout);

    if (!res.ok) return [];

    const xml = await res.text();
    return parseRSSItems(xml, source, icon, category);
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || "stocks";

  // Return cached if fresh
  const cached = newsCache[tab];
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({
      items: cached.items,
      count: cached.items.length,
      cachedAt: new Date(cached.ts).toISOString(),
      cached: true,
    });
  }

  // Get feeds for this tab
  const tabFeeds = FEEDS[tab] || FEEDS.stocks;
  const allFeeds = REGULATORY_TABS.has(tab)
    ? [...tabFeeds, ...REGULATORY_FEEDS]
    : tabFeeds;

  // Fetch all feeds in parallel
  const results = await Promise.all(
    allFeeds.map(f => fetchFeed(f.url, f.source, f.icon, f.category))
  );

  // Flatten and deduplicate by headline similarity
  let allItems = results.flat();

  // Deduplicate — remove items with very similar headlines
  const seen = new Set<string>();
  allItems = allItems.filter(item => {
    // Normalize headline for dedup
    const key = item.headline.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by publish date (newest first), then limit
  allItems.sort((a, b) => {
    const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return db - da;
  });

  // Take top 20 items
  const items = allItems.slice(0, 20);

  // Cache
  newsCache[tab] = { items, ts: Date.now() };

  return NextResponse.json({
    items,
    count: items.length,
    generatedAt: new Date().toISOString(),
    sources: [...new Set(items.map(i => i.source))],
  });
}
