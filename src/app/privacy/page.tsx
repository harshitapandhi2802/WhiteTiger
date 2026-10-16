import type { Metadata } from "next";
import { LegalPage, H2 } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — White Tiger",
  description: "How White Tiger handles your data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 16, 2026">
      <p>
        This Privacy Policy explains what information White Tiger collects and how it is used.
        We aim to collect as little as possible.
      </p>

      <H2>1. Information We Collect</H2>
      <p>
        To use the research tools you sign in with Google. When you do, we receive and store your
        <strong> name, email address and profile photo link</strong> from Google, plus the date and
        time of your first and latest sign-in, how many times you have signed in, whether you opted in
        to product emails, and whether our welcome email was delivered. We also process: (a) search
        queries and the instruments you analyse, to generate analysis; (b) basic technical data such as
        browser type and approximate region, for security and performance; and (c) payment confirmation
        details when you purchase a plan (processed by our payment provider, Razorpay).
      </p>

      <H2>1A. Why We Use It</H2>
      <p>
        We use your name and email to create and secure your account, to send you one welcome email
        after your first sign-in (which also describes our paid plans), to answer you when you reply,
        and to understand how many people use White Tiger. If you tick the optional box at sign-in, we
        may also email you product updates and offers; every such email has an unsubscribe link. We do
        not use your data for anything else without asking you.
      </p>

      <H2>1B. Where It Is Stored and For How Long</H2>
      <p>
        Account details are stored in a Postgres database hosted by Neon through our hosting provider,
        Vercel, and emails are sent through Google (Gmail). Data may be processed on servers outside
        India. We keep your account details while your account is active and delete them within 30
        days of a deletion request.
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
        We use only essential storage needed to run the application, including a secure sign-in
        cookie (<code>wt_session</code>) that keeps you signed in for up to 30 days. We do not run
        advertising trackers.
      </p>

      <H2>6. Data Security</H2>
      <p>
        We apply reasonable technical measures (HTTPS, security headers, rate limiting) to protect
        the service. No method of transmission over the internet is fully secure, however, and we
        cannot guarantee absolute security.
      </p>

      <H2>7. Your Choices</H2>
      <p>
        You can clear locally stored data at any time through your browser settings. You can
        unsubscribe from marketing emails using the link in any email. Under India&rsquo;s Digital
        Personal Data Protection Act, 2023 you can ask us to access, correct or erase your personal
        data, or withdraw consent, by emailing us (see Contact). We will respond within 30 days.
      </p>

      <H2>8. Contact</H2>
      <p>
        Privacy questions, data requests and grievances: harshitapandhi2802@gmail.com (Harshita
        Pandhi, founder, White Tiger).
      </p>
    </LegalPage>
  );
}
