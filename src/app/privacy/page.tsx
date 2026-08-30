import type { Metadata } from "next";
import { LegalPage, H2 } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — White Tiger",
  description: "How White Tiger handles your data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="May 29, 2026">
      <p>
        This Privacy Policy explains what information White Tiger collects and how it is used.
        We aim to collect as little as possible.
      </p>

      <H2>1. Information We Collect</H2>
      <p>
        White Tiger is designed to work without requiring an account for core research features.
        We may process: (a) search queries and the instruments you analyse, to generate analysis;
        (b) basic technical data such as browser type and approximate region, for security and
        performance; and (c) payment confirmation details when you purchase a plan (processed by
        our payment provider, Razorpay).
      </p>

      <H2>2. What We Do Not Do</H2>
      <p>
        We do not sell your personal data. We do not store your card or bank details — payments are
        handled entirely by Razorpay&rsquo;s secure checkout. We do not require sensitive identity
        documents to use the research tools.
      </p>

      <H2>3. Local Storage</H2>
      <p>
        Some preferences and plan/usage information are stored locally in your browser to keep the
        app working between visits. Clearing your browser storage will reset these.
      </p>

      <H2>4. Third-Party Services</H2>
      <p>
        The platform embeds and calls third-party services (for example, TradingView charts,
        market-data APIs, AI model providers, and the Razorpay payment gateway). These services
        have their own privacy policies governing data they receive.
      </p>

      <H2>5. Cookies</H2>
      <p>
        We use only essential storage needed to run the application. We do not run advertising
        trackers.
      </p>

      <H2>6. Data Security</H2>
      <p>
        We apply reasonable technical measures (HTTPS, security headers, rate limiting) to protect
        the service. No method of transmission over the internet is fully secure, however, and we
        cannot guarantee absolute security.
      </p>

      <H2>7. Your Choices</H2>
      <p>
        You can use most features anonymously and clear locally stored data at any time through
        your browser settings.
      </p>

      <H2>8. Contact</H2>
      <p>
        Privacy questions can be sent to the contact address listed on the About page.
      </p>
    </LegalPage>
  );
}
