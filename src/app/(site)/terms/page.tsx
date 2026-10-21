import type { Metadata } from "next";
import Link from "next/link";
import { Placeholder } from "@/components/page-parts";
import { getSettings } from "@/lib/settings";
import { LegalPage } from "@/components/legal-page";

// Terms of Service for the website (R33). Facts we don't have are
// <Placeholder>s. Not legal advice: have it reviewed before launch.

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using the RohTre Media website.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <LegalPage title="Terms of Service">
      <p>
        These terms apply to your use of this website, run by RohTre Media (
        {s.legal.companyName && s.legal.registeredAddress ? (
          `${s.legal.companyName}, ${s.legal.registeredAddress}`
        ) : (
          <Placeholder>registered company name and address</Placeholder>
        )}
        ). By using the website you agree to them.
      </p>

      <h2>Our services</h2>
      <p>
        This website describes our marketing services. Nothing on it is an offer that you can accept to form a contract.
        Any work we do for you is agreed separately, in writing, and that agreement’s terms apply to it.
      </p>

      <h2>Information on this website</h2>
      <p>
        We work to keep the information here accurate and up to date, but it is general information. Results described
        for one business depend on many factors and are not a promise of the same results for yours.
      </p>

      <h2>Our content</h2>
      <p>
        The text, images, videos, logos and design of this website belong to RohTre Media or the people who allowed us
        to use them. Please don’t copy or reuse them without our written permission. Client names and logos belong to
        their owners.
      </p>

      <h2>Using the website fairly</h2>
      <ul>
        <li>Don’t send false information through our forms or pretend to be someone else.</li>
        <li>Don’t try to break, overload or gain unauthorised access to the website.</li>
        <li>Don’t copy the website’s content in bulk, including with automated tools.</li>
      </ul>

      <h2>Links to other websites</h2>
      <p>
        We may link to other websites, such as WhatsApp or social networks. We are not responsible for their content or
        practices.
      </p>

      <h2>Liability</h2>
      <p>
        We provide this website “as is”. To the extent the law allows, we are not liable for any loss caused by using it
        or relying on its content. Nothing in these terms limits liability that cannot be limited by law.
      </p>

      <h2>Privacy</h2>
      <p>
        Our{" "}
        <Link href="/privacy" className="text-fg underline">
          Privacy Notice
        </Link>{" "}
        explains how we handle personal data.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India. Courts at{" "}
        {s.legal.jurisdictionCity ?? <Placeholder>city for jurisdiction</Placeholder>} have jurisdiction.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms:{" "}
        <a href={`mailto:${s.email}`} className="text-fg underline">
          {s.email}
        </a>
        .
      </p>
    </LegalPage>
  );
}
