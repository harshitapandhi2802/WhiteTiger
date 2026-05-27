import { NextRequest, NextResponse } from "next/server";
import {
  getAMFIData,
  searchSchemes,
  filterSchemes,
  findEnrichment,
  INDUSTRY_STATS,
} from "@/lib/amfi-service";

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
 *
 * Additional filters for mode=schemes:
 *   category, amc, type, minNav, maxNav, limit, offset
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
          const equitySchemes = amc.schemes.filter(s => s.schemeCategory.toLowerCase().includes("equity"));
          const debtSchemes = amc.schemes.filter(s => s.schemeCategory.toLowerCase().includes("debt") || s.schemeCategory.toLowerCase().includes("bond") || s.schemeCategory.toLowerCase().includes("liquid") || s.schemeCategory.toLowerCase().includes("money market") || s.schemeCategory.toLowerCase().includes("gilt") || s.schemeCategory.toLowerCase().includes("overnight") || s.schemeCategory.toLowerCase().includes("floating"));
          const hybridSchemes = amc.schemes.filter(s => s.schemeCategory.toLowerCase().includes("hybrid") || s.schemeCategory.toLowerCase().includes("balanced") || s.schemeCategory.toLowerCase().includes("multi asset") || s.schemeCategory.toLowerCase().includes("arbitrage"));
          const indexSchemes = amc.schemes.filter(s => s.schemeCategory.toLowerCase().includes("index") || s.schemeCategory.toLowerCase().includes("etf") || s.schemeCategory.toLowerCase().includes("fund of funds"));

          return {
            name: amc.name,
            slug: amc.slug,
            schemeCount: amc.schemeCount,
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
              category: amc.schemeCount > 80 ? "Mid" : amc.schemeCount > 30 ? "Small" : "Boutique",
            }),
          };
        });

        return NextResponse.json({
          success: true,
          industry: {
            ...INDUSTRY_STATS,
            liveSchemeCount: data.totalSchemes,
            liveAMCCount: data.totalAMCs,
            navDate: data.navDate,
            lastFetched: data.lastFetched,
          },
          amcs: amcSummaries,
          totalAMCs: data.totalAMCs,
          totalSchemes: data.totalSchemes,
          categories: data.categories,
        });
      }

      case "schemes": {
        const limit = Math.min(200, parseInt(searchParams.get("limit") || "50", 10));
        const offset = parseInt(searchParams.get("offset") || "0", 10);
        const result = filterSchemes(data, {
          category: searchParams.get("category") || undefined,
          amcName: searchParams.get("amc") || undefined,
          schemeType: searchParams.get("type") || undefined,
          minNav: searchParams.get("minNav") ? parseFloat(searchParams.get("minNav")!) : undefined,
          maxNav: searchParams.get("maxNav") ? parseFloat(searchParams.get("maxNav")!) : undefined,
          search: searchParams.get("q") || undefined,
        }, limit, offset);

        return NextResponse.json({
          success: true,
          schemes: result.schemes,
          total: result.total,
          limit,
          offset,
          hasMore: offset + limit < result.total,
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
        const results = searchSchemes(data, q, limit);
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
