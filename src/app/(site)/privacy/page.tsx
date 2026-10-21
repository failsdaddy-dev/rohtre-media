import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { Placeholder } from "@/components/page-parts";
import { getSettings } from "@/lib/settings";

// Privacy Notice (R38), written for India's Digital Personal Data Protection
// Act 2023 and the DPDP Rules 2025. Facts we don't have are <Placeholder>s.
// Not legal advice: have it reviewed before launch.

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: "How RohTre Media collects, uses and protects your personal data.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const s = await getSettings();
  const months = Math.round(s.leadRetentionDays / 30);
  return (
    <LegalPage title="Privacy Notice">
      <p>
        This notice explains what personal data RohTre Media collects through this website, why, and the choices and
        rights you have. We collect only what we need to reply to you.
      </p>

      <h2>Who we are</h2>
      <p>
        RohTre Media (
        {s.legal.companyName ? (
          [s.legal.companyName, s.legal.companyType].filter(Boolean).join(", ")
        ) : (
          <Placeholder>registered company name and type</Placeholder>
        )}
        ), based in {s.location}
        {s.address ? ` (${s.address})` : ""}, is the data fiduciary for the personal data described here. Contact us at{" "}
        <a href={`mailto:${s.email}`} className="text-fg underline">
          {s.email}
        </a>
        .
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>What you type into our enquiry form:</strong> name, phone or WhatsApp number, email, business type,
          website, monthly ad-spend range, the service you’re interested in and your message.
        </li>
        <li>
          <strong>Your consent:</strong> that you agreed, when, and which version of the consent wording you saw.
        </li>
        <li>
          <strong>How you found us:</strong> the page you sent the form from, the referring website and campaign tags in
          the link you clicked (such as utm_source, gclid or fbclid).
        </li>
        <li>
          <strong>Technical data:</strong> your browser’s user agent and a one-way scrambled (hashed) form of your IP
          address, used only to stop spam and repeated submissions. We don’t store your IP address itself.
        </li>
      </ul>
      <p>
        If you message us on WhatsApp or call us, WhatsApp or your phone carrier handles that conversation under their
        own terms.
      </p>

      <h2>Why we use it</h2>
      <ul>
        <li>To reply to your enquiry and discuss how we can help your business.</li>
        <li>To understand which of our pages and campaigns bring enquiries, so we can improve them.</li>
        <li>To protect the website from spam and abuse.</li>
      </ul>
      <p>
        We rely on your consent, which you give by ticking the box on the form. We don’t sell your personal data, and we
        don’t use it for anything unrelated to your enquiry.
      </p>

      <h2>Who we share it with</h2>
      <p>Only the service providers that run this website and our enquiry handling, acting on our instructions:</p>
      <ul>
        <li>Supabase, our database (stored in its Mumbai, India region).</li>
        <li>Google (Google Sheets), where our team keeps track of enquiries.</li>
        <li>Our website host and Cloudinary (images), which may process technical data such as your IP address.</li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        We keep enquiries for up to {months} months after you contact us, then delete them, unless you become a client
        (then our client agreement applies) or you ask us to delete them sooner.
      </p>

      <h2>Your rights</h2>
      <p>Under the Digital Personal Data Protection Act, 2023, you can:</p>
      <ul>
        <li>ask what personal data we hold about you and how we use it;</li>
        <li>ask us to correct, complete, update or erase it;</li>
        <li>withdraw your consent at any time (this doesn’t affect anything we did before you withdrew it);</li>
        <li>nominate another person to exercise these rights for you;</li>
        <li>raise a grievance with us, and then with the Data Protection Board of India if you’re not satisfied.</li>
      </ul>
      <p>
        To use any of these rights, email{" "}
        <a href={`mailto:${s.email}`} className="text-fg underline">
          {s.email}
        </a>{" "}
        with the subject “Privacy request”. Grievance contact:{" "}
        {s.legal.privacyContactName && s.legal.privacyEmail ? (
          <>
            {s.legal.privacyContactName},{" "}
            <a href={`mailto:${s.legal.privacyEmail}`} className="text-fg underline">
              {s.legal.privacyEmail}
            </a>
          </>
        ) : (
          <Placeholder>name and email of the person handling privacy requests</Placeholder>
        )}
        .
      </p>

      <h2>Cookies and similar storage</h2>
      <p>
        This website stores your light/dark theme choice in your browser, and keeps the campaign tags from the link you
        arrived on for the length of your visit so they can be attached to your enquiry. We don’t use advertising or
        analytics cookies yet; if we add them, we will ask for your consent first and update this notice.
      </p>

      <h2>Security</h2>
      <p>
        Enquiries are stored in a database that only authorised RohTre Media staff can access, over encrypted
        connections.
      </p>

      <h2>Children</h2>
      <p>Our services are for businesses. This website is not meant for anyone under 18.</p>

      <h2>Changes</h2>
      <p>If we change this notice, we will update the date at the top of this page.</p>
    </LegalPage>
  );
}
