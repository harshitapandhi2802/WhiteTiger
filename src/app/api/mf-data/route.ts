import { NextRequest, NextResponse } from "next/server";
import {
  getAMFIData,
  searchSchemes,
  filterSchemes,
  findEnrichment,
  INDUSTRY_STATS,
} from "@/lib/amfi-service";
import { cacheHeaders } from "@/lib/services/apiGuard";

export const maxDuration = 60;

/**
 * GET /api/mf-data
 *
 * Query params:
 *   mode=summary       → AMC list + industry stats (default)
 *   mode=schemes       → Paginated scheme list
 *   mode=amc&name=X    → All schemes for a specific AMC
 *   mode=search&q=X    → Search schemes
 *   mode=categories    → List all categories
 *   mode=facets        → Filter values with active-code counts
 *
 * Filters for mode=schemes (exact match, case-insensitive):
 *   assetClass, subCategory, category (substring), amc, plan, option, type,
 *   status (default "active"; "all" for every code), q, limit, offset
 *
 * Every scheme carries its AMFI scheme code, plan, option, status and navDate
 * (the date the NAV applies to — not the request date).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "summary";

    const data = await getAMFIData();

    switch (mode) {
      case "summary": {
        // Return AMC directory with enriched data + industry stats
        const amcSummaries = data.amcList.map(amc => {
          const enrichment = findEnrichment(amc.name);
          // Classify schemes by category
          const active = amc.schemes.filter(s => s.status === "active");
          const equitySchemes = active.filter(s => s.assetClass === "Equity");
          const debtSchemes = active.filter(s => s.assetClass === "Debt");
          const hybridSchemes = active.filter(s => s.assetClass === "Hybrid");
          const indexSchemes = active.filter(s => s.assetClass === "Index Fund" || s.assetClass === "ETF" || s.assetClass === "Fund of Funds");

          return {
            name: amc.name,
            slug: amc.slug,
            schemeCount: active.length,
            schemeCountWithNav: amc.schemeCount,
            categories: amc.categories,
            lastUpdated: amc.lastUpdated,
            equitySchemes: equitySchemes.length,
            debtSchemes: debtSchemes.length,
            hybridSchemes: hybridSchemes.length,
            indexSchemes: indexSchemes.length,
            // Enrichment data (curated for top AMCs)
            ...(enrichment ? {
              parentCompany: enrichment.parentCompany,
              ceo: enrichment.ceo,
              cio: enrichment.cio,
              aumEstimate: enrichment.aumEstimate,
              aumNumeric: enrichment.aumNumeric,
              marketSharePct: enrichment.marketSharePct,
              founded: enrichment.founded,
              category: enrichment.category,
              strengths: enrichment.strengths,
              weaknesses: enrichment.weaknesses,
              ownershipStructure: enrichment.ownershipStructure,
            } : {
              category: "Not classified",
            }),
          };
        });

        return NextResponse.json({
          success: true,
          industry: {
            ...INDUSTRY_STATS,
            totalAMCs: String(data.totalAMCs),
            liveSchemeCount: data.activeSchemes,
            schemesWithNav: data.totalSchemes,
            allSchemeCodes: data.allSchemes.length,
            liveAMCCount: data.totalAMCs,
            navDate: data.navDate,
            navSource: data.navSource,
            snapshotDate: data.snapshotDate,
            lastFetched: data.lastFetched,
          },
          amcs: amcSummaries,
          totalAMCs: data.totalAMCs,
          totalSchemes: data.activeSchemes,
          categories: data.categories,
        });
      }

      case "schemes": {
        const limit = Math.min(200, parseInt(searchParams.get("limit") || "50", 10));
        const offset = parseInt(searchParams.get("offset") || "0", 10);
        const g = (k: string) => searchParams.get(k) || undefined;
        const result = filterSchemes(data, {
          assetClass: g("assetClass"), subCategory: g("subCategory"), category: g("category"),
          amcName: g("amc"), plan: g("plan"), option: g("option"), schemeType: g("type"),
          status: g("status"), search: g("q"),
        }, limit, offset);

        return NextResponse.json({
          success: true,
          schemes: result.schemes,
          total: result.total,
          limit,
          offset,
          hasMore: offset + limit < result.total,
          navDate: data.navDate,
          navSource: data.navSource,
        });
      }

      case "amc": {
        const name = searchParams.get("name") || "";
        if (!name) {
          return NextResponse.json({ error: "AMC name required" }, { status: 400 });
        }

        // Find AMC by slug or name
        const amcEntry = data.amcList.find(a =>
          a.slug === name ||
          a.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(a.slug)
        );

        if (!amcEntry) {
          return NextResponse.json({ error: "AMC not found" }, { status: 404 });
        }

        const enrichment = findEnrichment(amcEntry.name);

        // Group schemes by category
        const schemesByCategory: Record<string, typeof amcEntry.schemes> = {};
        for (const s of amcEntry.schemes) {
          const cat = s.schemeCategory || "Other";
          if (!schemesByCategory[cat]) schemesByCategory[cat] = [];
          schemesByCategory[cat].push(s);
        }

        return NextResponse.json({
          success: true,
          amc: {
            name: amcEntry.name,
            slug: amcEntry.slug,
            schemeCount: amcEntry.schemeCount,
            categories: amcEntry.categories,
            lastUpdated: amcEntry.lastUpdated,
            ...(enrichment || {}),
          },
          schemesByCategory,
          totalSchemes: amcEntry.schemeCount,
        });
      }

      case "search": {
        const q = searchParams.get("q") || "";
        const limit = Math.min(100, parseInt(searchParams.get("limit") || "30", 10));
        const results = searchSchemes(data, q, limit, { includeInactive: searchParams.get("inactive") === "1" });
        return NextResponse.json({
          success: true,
          results,
          total: results.length,
          query: q,
        });
      }

      case "categories": {
        return NextResponse.json({
          success: true,
          categories: data.categories,
          total: data.categories.length,
        });
      }

      case "facets": {
        const active = data.allSchemes.filter(x => x.status === "active");
        const tally = (f: (x: typeof active[number]) => string) => Object.entries(active.reduce<Record<string, number>>((m, x) => { const k = f(x); m[k] = (m[k] || 0) + 1; return m; }, {})).sort((p, q) => q[1] - p[1]).map(([value, count]) => ({ value, count }));
        return NextResponse.json({
          success: true,
          assetClasses: tally(x => x.assetClass),
          subCategories: tally(x => `${x.assetClass}|${x.subCategory}`).map(({ value, count }) => ({ assetClass: value.split("|")[0], value: value.split("|")[1], count })),
          amcs: tally(x => x.amcName),
          plans: tally(x => x.plan),
          options: tally(x => x.option),
          statuses: Object.entries(data.allSchemes.reduce<Record<string, number>>((m, x) => { m[x.status] = (m[x.status] || 0) + 1; return m; }, {})).map(([value, count]) => ({ value, count })),
          navDate: data.navDate, navSource: data.navSource,
        }, { headers: cacheHeaders(3600) });
      }

      default:
        return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }
  } catch (err) {
    console.error("MF Data API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch mutual fund data", details: String(err) },
      { status: 500 }
    );
  }
}
