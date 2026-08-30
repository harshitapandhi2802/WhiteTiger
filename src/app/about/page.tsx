import type { Metadata } from "next";
import { LegalPage, H2 } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "About — White Tiger",
  description: "About the White Tiger financial intelligence platform.",
};

export default function AboutPage() {
  return (
    <LegalPage title="About White Tiger">
      <p>
        White Tiger is an AI-powered financial intelligence platform that brings institutional-grade
        research to individual investors across eleven market verticals — equities, mutual funds,
        crypto, forex, commodities, bonds, derivatives, real estate, tax, and wealth planning — in a
        single dark, premium interface.
      </p>

      <H2>What We Do</H2>
      <p>
        We combine live market data with deep AI-generated analysis to help you understand markets
        faster. Each analysis is designed to surface the same factors a professional desk would
        consider — valuation, macro and geopolitical context, flows, and risk — explained in plain
        language.
      </p>

      <H2>How to Read Our Data</H2>
      <p>
        We distinguish three kinds of information wherever practical:
      </p>
      <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
        <li><strong>Live data</strong> — prices and NAVs streamed from exchanges and data providers.</li>
        <li><strong>Static data</strong> — reference figures and estimates that update periodically.</li>
        <li><strong>AI insight</strong> — model-generated scores, narratives, and target levels.</li>
      </ul>
      <p>
        Look for source badges, timestamps, and confidence indicators throughout the app so you
        always know how fresh and how reliable a number is.
      </p>

      <H2>Important Disclaimer</H2>
      <p>
        White Tiger is an educational and research tool. It is <strong>not</strong> a SEBI-registered
        investment adviser or research analyst, and nothing here is financial advice. Always consult
        a SEBI-registered adviser before investing. Past performance does not guarantee future
        results.
      </p>

      <H2>Contact</H2>
      <p>
        For support, feedback, or partnership enquiries, reach out at{" "}
        <a href="mailto:hello@whitetiger.app" style={{ color: "var(--accent, #4A9EFF)" }}>
          hello@whitetiger.app
        </a>.
      </p>
    </LegalPage>
  );
}
