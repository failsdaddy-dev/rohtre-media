import type { Block, LegalPage, LegalSection, LegalSlug } from "./legal-schema";

// The five legal pages as published on the live site (read 2026-10-24):
//   https://rohtremedia.com/terms-of-services/
//   https://rohtremedia.com/privacy-notice/
//   https://rohtremedia.com/fraudulent-use/
//   https://rohtremedia.com/cookie-settings-2/
//   https://rohtremedia.com/do-not-sell/
// Text copied word for word, in the same order (typos and wording kept).
// Not copied: the live layout, the "Contents" lists (the page builds its own
// from the headings), the site-wide "Ready to unlock growth" banner, and the
// interactive parts (cookie switches and buttons, the opt-out form, the
// fraud report form), which are not rebuilt: the two forms are replaced by an
// "Email us" button; cookie switches come with the cookie banner (Phase 6). Links to the old domain's
// pages point to the new routes. Card icons (emoji) are kept in the text.
// These are the defaults: once a page is saved in Admin → Legal, the
// saved copy is shown instead (scripts/seed-legal.ts stores these).

const p = (text: string): Block => ({ type: "paragraph", text });
const ul = (...items: string[]): Block => ({ type: "bullets", items });
const table = (header: string[], ...rows: string[][]): Block => ({ type: "table", header, rows });
const btn = (label: string, href: string): Block => ({ type: "button", label, href });
const sec = (
  heading: string,
  blocks: Block[],
  o: { level?: "h2" | "h3"; label?: string; subtitle?: string } = {},
): LegalSection => ({
  label: o.label ?? "",
  heading,
  level: o.level ?? "h2",
  subtitle: o.subtitle ?? "",
  blocks,
});
const h3 = (heading: string, blocks: Block[], o: { label?: string; subtitle?: string } = {}) =>
  sec(heading, blocks, { ...o, level: "h3" });

const MAIL = "[sales@rohtremedia.com](mailto:sales@rohtremedia.com)";

const terms: LegalPage = {
  title: "Terms of Service",
  eyebrow: "",
  intro: "",
  effective: "January 1, 2025",
  updated: "May 2025",
  seoTitle: "Terms of Service",
  seoDescription:
    "By accessing or using rohtremedia.com, or by engaging RohtreMedia for any services, you agree to be bound by these Terms of Service and our Privacy Notice.",
  sections: [
    sec("", [
      table(
        [],
        ["**50%**", "Advance required before work begins"],
        ["**30 days**", "Notice period to terminate an engagement"],
        ["**Lucknow**", "Governing jurisdiction — UP, India"],
      ),
      ul(
        "📋 **Scope:** Covers all users of rohtremedia.com and all service clients",
        "💳 **Payment:** 50% advance, balance on delivery or billing date",
        "⚖ **Governing Law:** Laws of India, courts of Lucknow, Uttar Pradesh",
      ),
    ]),
    h3("At a Glance", [
      table(
        [],
        ["Advance", "50% upfront"],
        ["Late fee", "1.5% / month"],
        ["Notice period", "30 days"],
        ["Confidentiality", "2 years post-engagement"],
        ["Jurisdiction", "Lucknow, India"],
        ["Refunds", "Non-refundable once started"],
      ),
    ]),
    sec(
      "Acceptance of Terms",
      [
        p(
          'By accessing or using **rohtremedia.com**, or by engaging RohtreMedia for any services, you ("Client," "you," or "your") agree to be bound by these Terms of Service and our Privacy Notice.',
        ),
        p(
          "These Terms apply to all visitors, clients, and anyone who accesses or uses our website or services in any capacity. If you do not agree, please do not use our website or services.",
        ),
        p(
          "📌 Using our website or submitting an inquiry constitutes acceptance of these Terms — even if no formal contract has been signed yet.",
        ),
      ],
      { label: "01", subtitle: "Who these terms apply to" },
    ),
    sec(
      "Our Services",
      [
        p(
          "RohtreMedia provides digital marketing services. The specific scope, deliverables, timelines, and pricing for any engagement are defined in a separate Service Agreement or Statement of Work (SOW).",
        ),
        ul(
          "Video Production & Editing",
          "Paid Media (Google, Meta, Microsoft)",
          "SEO & Content Marketing",
          "Social Media Management",
          "Branding & Graphic Design",
          "Website Design",
          "Data Analytics & Reporting",
          "AI-Powered Creative Tools",
          "Influencer Marketing",
        ),
      ],
      { label: "02", subtitle: "What RohtreMedia provides" },
    ),
    sec(
      "Client Responsibilities",
      [
        p("To allow us to deliver effectively, you agree to:"),
        ul(
          "📂 **Provide materials on time**\nAccurate, complete info, assets, and approvals when required",
          "✅ **Own what you share**\nEnsure you hold all rights to content and logos you give us",
          "⚖ **Stay compliant**\nFollow all laws and platform policies governing your advertising",
          "🔐 **Keep credentials secure**\nProtect any account access we set up for your business",
          "🚫 **No unlawful use**\nDon't use our services for deceptive or harmful purposes",
          "📣 **Own your claims**\nYou're responsible for accuracy of content we publish on your behalf",
        ),
      ],
      { label: "03", subtitle: "What we need from you" },
    ),
    sec(
      "Payments & Fees",
      [
        table(
          [],
          [
            "**50%**",
            "**Advance Payment**",
            "Required before any work commences. Balance due upon delivery or on the agreed billing date.",
          ],
          [
            "**1.5%**",
            "**Late Payment Fee**",
            "Monthly interest on invoices unpaid beyond 15 days. Services may be paused for overdue accounts.",
          ],
        ),
        p(
          "**Ad Spend**\nThird-party advertising budgets (Google Ads, Meta Ads) are billed directly to your own ad accounts — separate from our management fees.",
        ),
        p(
          "**Refund Policy**\nFees paid are non-refundable once work has commenced, unless otherwise agreed in writing before the engagement begins.",
        ),
        p(
          "All fees are as agreed in your Service Agreement. RohtreMedia reserves the right to update pricing with **30 days' notice**.",
        ),
      ],
      { label: "04", subtitle: "How billing works" },
    ),
    sec(
      "Intellectual Property",
      [
        p("**You Own**"),
        ul("Content & materials you provide", "Final deliverables (upon full payment)", "Your brand assets and data"),
        p("**We Retain**"),
        ul("Our proprietary tools & frameworks", "Internal processes & methodologies", "Templates not specific to your brand"),
        p(
          "⚠ Ownership of deliverables does **not transfer** until all outstanding fees are fully settled. Work remains property of RohtreMedia until payment is complete.",
        ),
        p(
          "Unless you request otherwise in writing, RohtreMedia reserves the right to showcase completed work in our portfolio, case studies, and marketing materials.",
        ),
      ],
      { label: "05", subtitle: "Who owns what" },
    ),
    sec(
      "Confidentiality",
      [
        p(
          "Both parties agree to keep confidential any non-public business information, strategies, or data shared during the engagement. This obligation applies to both RohtreMedia and the Client.",
        ),
        p(
          "🔒 Confidentiality obligations survive termination of the engagement for a period of **2 years**. They do not apply to information that is publicly available, independently developed, or required to be disclosed by law.",
        ),
      ],
      { label: "06", subtitle: "Protecting each other's information" },
    ),
    sec(
      "Disclaimers & Liability",
      [
        p(
          "**No Guaranteed Results:** Marketing outcomes depend on many factors outside our control — market conditions, platform algorithm changes, competition, and your own product. We do not guarantee specific metrics like ROAS, follower counts, or search rankings.",
        ),
        p(
          '**Website Disclaimer:** Our website is provided "as is" without warranties. We do not warrant uninterrupted, error-free, or virus-free operation.',
        ),
        p(
          "📊 **Liability Cap:** To the maximum extent permitted by law, RohtreMedia's total liability for any claim shall not exceed the total fees paid by the Client in the **3 months preceding the claim**. We are not liable for indirect, incidental, or consequential damages.",
        ),
      ],
      { label: "07", subtitle: "What we can and can't guarantee" },
    ),
    sec(
      "Termination",
      [
        p(
          "**By You (Client)**\nProvide 30 days' written notice. All fees for work completed up to the termination date remain due and payable.",
        ),
        p(
          "**By RohtreMedia**\nWe may terminate if you breach these Terms, engage in abusive conduct, fail to make payments, or request work that violates applicable law.",
        ),
        p(
          "**After Termination**\nEach party returns or destroys the other's confidential materials. Paid deliverables transfer to the Client as specified in the SOW.",
        ),
      ],
      { label: "08", subtitle: "How engagements can end" },
    ),
    sec(
      "Governing Law",
      [
        p("⚖ **India · Lucknow Courts**"),
        p(
          "These Terms are governed by the laws of **India**. Any disputes shall be subject to the exclusive jurisdiction of the courts of **Lucknow, Uttar Pradesh, India**. We encourage resolving issues informally before any formal proceedings.",
        ),
      ],
      { label: "09", subtitle: "Legal jurisdiction" },
    ),
    sec(
      "Changes & Contact",
      [
        p(
          "RohtreMedia may update these Terms at any time. Changes will be posted on this page with an updated effective date. For active engagements, material changes will be communicated via email with reasonable notice.",
        ),
        p("Continued use of our website or services after changes are posted constitutes acceptance of the revised Terms."),
        p(`**Email**\n${MAIL}`),
        p("**Phone**\n+91 96957 47475"),
        p("**Office**\nVirat Khand, Gomti Nagar, Lucknow, Uttar Pradesh, India"),
      ],
      { label: "10", subtitle: "Updates and how to reach us" },
    ),
    sec("Questions about these terms?", [
      p("We're happy to walk you through anything before you hire us."),
      btn("Get in Touch", "mailto:sales@rohtremedia.com"),
    ]),
  ],
};

const privacy: LegalPage = {
  title: "Privacy Notice",
  eyebrow: "Legal · Privacy",
  intro:
    "We believe in radical transparency. This page tells you exactly what data we collect, why we collect it, and how you can control it — no jargon, no filler.",
  effective: "January 1, 2025",
  updated: "May 2025",
  seoTitle: "Privacy Notice",
  seoDescription:
    "We believe in radical transparency. This page tells you exactly what data we collect, why we collect it, and how you can control it — no jargon, no filler.",
  sections: [
    sec("", [
      table(
        [],
        ["**0**", "Personal data sold to third parties — ever"],
        ["**10**", "Clear sections covering every aspect of your data"],
        ["**30**", "Days max to respond to any privacy request"],
        ["**7**", "Rights you hold over your personal information"],
      ),
    ]),
    h3("Privacy Contact", [
      ul(
        "**sales@rohtremedia.com**\nEmail us directly",
        "**+91 96957 47475**\nCall or WhatsApp",
        "**Lucknow, India**\nGomti Nagar, UP",
      ),
    ]),
    sec("Who We Are", [], { label: "01" }),
    h3("About RohtreMedia", [
      p(
        "**RohtreMedia** is a video-first digital marketing agency headquartered in Virat Khand, Gomti Nagar, Lucknow, India. We operate **rohtremedia.com** and provide services including video production, paid media management, SEO, content marketing, and digital strategy.",
      ),
      p(
        "This Privacy Notice governs how we handle personal data collected through our website and during the delivery of our services. By using our website or engaging with us, you agree to the practices described here.",
      ),
    ]),
    sec("What We Collect", [], { label: "02", subtitle: "Data collected from you and automatically" }),
    h3("You Provide Directly", [
      ul(
        "Name & email address",
        "Phone number",
        "Business details & project briefs",
        "Messages via contact form or WhatsApp",
        "CV & job applications",
      ),
    ]),
    h3("Collected Automatically", [
      ul(
        "IP address & device type",
        "Browser & operating system",
        "Pages visited & time on site",
        "Referring URLs",
        "Cookie & analytics identifiers",
        "Facebook Pixel events",
      ),
    ]),
    sec(
      "How We Use It",
      [
        ul(
          "Respond to inquiries and deliver services",
          "Send project updates and invoices",
          "Improve our website and content",
          "Run and measure ad campaigns",
          "Retarget website visitors through Meta and Google",
          "Comply with legal obligations",
          "Evaluate job applications",
          "Analyse traffic and site performance",
        ),
        p(
          "🔒 We **never sell your personal data** to data brokers or third parties for their own marketing. We do not send unsolicited marketing without your consent.",
        ),
      ],
      { label: "03", subtitle: "Purposes for processing your data" },
    ),
    sec(
      "Who We Share With",
      [
        table(
          ["Recipient", "Purpose", "Type"],
          ["Meta (Facebook / Instagram)", "Ad delivery, conversion tracking, retargeting", "Advertising"],
          ["Google LLC", "Analytics, ad measurement, search campaigns", "Advertising"],
          ["Microsoft Advertising", "Paid search campaign management", "Advertising"],
          ["Hosting & Infrastructure", "Website operation and data storage", "Operations"],
          ["Legal Authorities", "When required by law or court order", "Legal"],
          ["Business Acquirers", "In event of merger or sale of assets", "Corporate"],
        ),
        p(
          "All third-party providers are contractually required to protect your data and may only use it for the purposes we specify.",
        ),
      ],
      { label: "04", subtitle: "Third-party data recipients" },
    ),
    sec("Cookies & Tracking", [], { label: "05", subtitle: "What runs on our website" }),
    h3("Essential", [ul("Required for site functionality", "Cannot be disabled", "No personal data stored")]),
    h3("Analytics", [ul("Google Analytics", "Google Tag Manager", "Tracks pages & behaviour")]),
    h3("Marketing", [ul("Facebook Pixel", "Google Ads tags", "Used for ad retargeting")]),
    h3("Your Control", [
      ul("Manage via browser settings", "Use Cookie Settings in footer", "Some features may break if disabled"),
    ]),
    sec(
      "How Long We Keep It",
      [
        table(
          ["Data type", "Retention period"],
          ["Client project data", "3 Years"],
          ["Non-client inquiries", "12 Months"],
          ["Job applications (not hired)", "6 Months"],
          ["Analytics / cookie data", "14 Months"],
        ),
        p("You may request deletion of your data at any time — see Section 07 for how."),
      ],
      { label: "06", subtitle: "Data retention periods" },
    ),
    sec(
      "Your Rights",
      [
        ul(
          "👁 **Access**\nRequest a copy of the data we hold about you",
          "✏ **Correction**\nAsk us to fix inaccurate or incomplete data",
          "🗑 **Deletion**\nRequest erasure of your personal data",
          "🚫 **Restrict Processing**\nPause how we use your data in certain cases",
          "📦 **Portability**\nReceive your data in a machine-readable format",
          "✋ **Opt Out**\nOpt out of data sharing for advertising purposes",
        ),
        p("📧 To exercise any right, email us at **sales@rohtremedia.com** with your request. We respond within **30 days**."),
      ],
      { label: "07", subtitle: "What you can ask us to do" },
    ),
    sec(
      "Children",
      [
        p(
          "Our website and services are not directed at individuals under the age of 18. We do not knowingly collect personal data from minors. If you believe a minor has submitted personal data to us, please contact us immediately at **sales@rohtremedia.com** and we will delete it promptly.",
        ),
      ],
      { label: "08", subtitle: "Under-18 policy" },
    ),
    sec(
      "Security",
      [
        p(
          "We implement reasonable technical and organisational measures to protect your data — including SSL encryption, access controls, and regular security reviews. No internet transmission is 100% secure, and while we strive to protect your data we cannot guarantee absolute security.",
        ),
        p("If you suspect your data has been compromised, contact us immediately."),
      ],
      { label: "09", subtitle: "How we protect your data" },
    ),
    sec(
      "Contact Us",
      [
        p("If you have questions, concerns, or requests regarding this Privacy Notice, we'd love to hear from you:"),
        p("**Email**"),
        ul("sales@rohtremedia.com"),
        p("**Phone**"),
        ul("+91 96957 47475"),
        p("**Office Address**"),
        ul("Virat Khand, Gomti Nagar, Lucknow, Uttar Pradesh, India"),
        p(
          "We may update this Privacy Notice periodically. Changes will be posted on this page with an updated effective date. Continued use of our website after changes are posted constitutes acceptance.",
        ),
      ],
      { label: "10", subtitle: "Privacy questions & requests" },
    ),
    sec("Have a privacy question? Let's talk.", [
      p("Our team responds to all privacy requests within 30 days."),
      btn("Email Us Now", "mailto:sales@rohtremedia.com"),
    ]),
  ],
};

const fraud: LegalPage = {
  title: "Fraudulent Use of Our Name",
  eyebrow: "",
  intro:
    "Scammers are impersonating RohtreMedia and our CEO Rohan Trehan. This page tells you how to spot fraud, verify you're talking to us, and report suspicious activity.",
  effective: "",
  updated: "",
  seoTitle: "Fraudulent Use of Our Name",
  seoDescription:
    "Scammers are impersonating RohtreMedia and our CEO Rohan Trehan. This page tells you how to spot fraud, verify you're talking to us, and report suspicious activity.",
  sections: [
    sec("", [
      p(
        "⚠ Warning· Fraudulent accounts impersonating RohtreMedia have been reported· Always verify before engaging· Our only email is sales@rohtremedia.com· Our only phone is +91 96957 47475· We never charge job applicants any fees·",
      ),
    ]),
    sec("Our Only Official Contacts", [
      table(
        [],
        ["🌐 Website", "rohtremedia.com (https only)"],
        ["✉ Email", "sales@rohtremedia.com"],
        ["📞 Phone / WhatsApp", "+91 96957 47475"],
        ["📍 Office", "Virat Khand, Gomti Nagar, Lucknow"],
      ),
    ]),
    sec(
      "Fraud Schemes Using Our Name",
      [
        p(
          "These are the fraudulent schemes we've identified. If you encounter any of these, do not engage and report it to us immediately.",
        ),
      ],
      { label: "Known Scams" },
    ),
    h3(
      "Fake Job Offers",
      [
        p(
          "Fraudsters send job offers claiming to be from RohtreMedia, asking for registration fees, security deposits, or personal documents. We never charge applicants any fees — ever.",
        ),
      ],
      { label: "01", subtitle: "Most Common" },
    ),
    h3(
      "Fake Service Packages",
      [
        p(
          "Individuals impersonating our team offer discounted marketing or video production packages, collecting advance payments before disappearing without delivering any work.",
        ),
      ],
      { label: "02", subtitle: "High Risk" },
    ),
    h3(
      "Social Media Impersonation",
      [
        p(
          "Fake accounts on Instagram, Facebook, LinkedIn, and WhatsApp use our logo and branding to solicit clients or sell courses claiming Rohan Trehan's endorsement.",
        ),
      ],
      { label: "03", subtitle: "Active" },
    ),
    h3(
      "Phishing Emails",
      [
        p(
          "Emails from lookalike domains impersonating rohtremedia.com request payment details, login credentials, or sensitive business information from unsuspecting recipients.",
        ),
      ],
      { label: "04", subtitle: "Active" },
    ),
    h3(
      "Fake Investment Schemes",
      [
        p(
          "Fraudulent individuals claim RohtreMedia or Rohan Trehan is offering investment opportunities or business partnerships that require upfront capital or fees.",
        ),
      ],
      { label: "05", subtitle: "Reported" },
    ),
    h3(
      "Fake Online Courses",
      [
        p(
          "Scammers sell digital marketing or video production courses falsely attributed to Rohan Trehan or RohtreMedia, collecting money without authorisation.",
        ),
      ],
      { label: "06", subtitle: "Reported" },
    ),
    sec(
      "How to Verify You're Talking to Us",
      [p("Before paying anyone claiming to be RohtreMedia, run through this checklist.")],
      { label: "Stay Safe" },
    ),
    h3(
      "Check the Website URL",
      [
        p(
          "Our website is exactly **rohtremedia.com** with a valid SSL padlock. Look for the https and verify spelling character by character.",
        ),
      ],
      { label: "01" },
    ),
    h3(
      "Verify the Email Domain",
      [
        p(
          "All emails from us end in **@rohtremedia.com**. We never use Gmail, Yahoo, Outlook, or lookalike domains like rohtre-media.com.",
        ),
      ],
      { label: "02" },
    ),
    h3(
      "Call Our Official Number",
      [
        p(
          "Call **+91 96957 47475** to verify any communication or offer you've received before taking any action or making payment.",
        ),
      ],
      { label: "03" },
    ),
    h3(
      "Never Pay in Crypto or Gift Cards",
      [
        p(
          "We only accept standard bank transfers and legitimate payment methods. **Cryptocurrency, gift cards, or UPI to unknown accounts** are red flags.",
        ),
      ],
      { label: "04" },
    ),
    h3(
      "Job Applicants Pay Nothing",
      [
        p(
          "RohtreMedia never charges applicants registration fees, training fees, or security deposits. Any such request is **100% fraudulent**.",
        ),
      ],
      { label: "05" },
    ),
    h3(
      "When in Doubt, Email Us",
      [
        p(
          "Send a quick note to **sales@rohtremedia.com** before proceeding. We'll confirm within 24 hours whether any offer or communication is genuine.",
        ),
      ],
      { label: "06" },
    ),
    sec(
      "What We Are Doing About It",
      [
        p(
          "We take impersonation of our brand and team members extremely seriously. Here's how we're fighting back.",
        ),
      ],
      { label: "Our Response" },
    ),
    h3("🗑 Platform Takedowns", [
      p(
        "We actively report and request removal of fraudulent social media accounts on Instagram, Facebook, LinkedIn, and WhatsApp that impersonate our brand.",
      ),
    ]),
    h3("⚖ Legal Action", [
      p(
        "We work with legal counsel to pursue civil and criminal action against identified fraudsters under applicable Indian law including the IT Act and IPC.",
      ),
    ]),
    h3("🚨 Cyber Crime Complaints", [
      p(
        "We file complaints with the Cyber Crime Cell of Lucknow Police and the National Cyber Crime Reporting Portal at cybercrime.gov.in.",
      ),
    ]),
    h3("🔍 Domain Monitoring", [
      p(
        "We continuously monitor domain registrations for lookalike domains and take immediate action to have them suspended or transferred.",
      ),
    ]),
    sec(
      "Encountered a Scam? Tell Us.",
      [p("Your report helps us act fast. The more detail you provide, the quicker we can take it down.")],
      { label: "Report Fraud" },
    ),
    h3("Why Report to Us?", [
      p(
        "When you report a fraud attempt, you protect others. We use every report to build a case, escalate takedown requests, and alert our audience to active scams.",
      ),
      p("We respond to all fraud reports within 48 hours."),
      p("**Contact us directly**"),
      ul(
        "✉ **sales@rohtremedia.com**\nFor urgent reports",
        "📞 **+91 96957 47475**\nCall or WhatsApp",
        "🌐 **cybercrime.gov.in**\nAlso file with National Cyber Crime Portal",
      ),
      // In place of the live fraud report form (owner's choice, 2026-10-24): email only.
      btn("Email us at sales@rohtremedia.com", "mailto:sales@rohtremedia.com?subject=Fraud%20Report"),
      p(
        "If you have suffered financial loss, we strongly recommend also filing a complaint at **cybercrime.gov.in** and your nearest police station as soon as possible.",
      ),
    ]),
    sec("Not sure if it's really us?", [
      p("Call or email us directly before making any payment or sharing personal information."),
      btn("Verify with Us", "mailto:sales@rohtremedia.com"),
    ]),
  ],
};

const COOKIE_HEAD = ["Cookie", "Provider", "Purpose", "Duration"];

const cookies: LegalPage = {
  title: "Cookie Settings",
  eyebrow: "",
  intro:
    "Control exactly which cookies run on your device when you visit rohtremedia.com. Your choices are saved and respected on every visit.",
  effective: "",
  updated: "",
  seoTitle: "Cookie Settings",
  seoDescription:
    "Control exactly which cookies run on your device when you visit rohtremedia.com. Your choices are saved and respected on every visit.",
  sections: [
    sec(
      "Small files. Big transparency.",
      [
        p(
          "Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, measure how pages are used, and — in some cases — deliver relevant advertising.",
        ),
        p(
          "At RohtreMedia, we use cookies in four categories: **Essential** (always on, required for the site to work), **Analytics** (help us understand traffic), **Marketing** (used for ad retargeting), and **Functional** (remember your preferences). You control the last three.",
        ),
      ],
      { label: "What Are Cookies?" },
    ),
    h3(
      "Essential Cookies",
      [
        p(
          "Essential cookies are necessary for the basic functions of the website. Without them, things like page navigation, form submissions, and security features won't work. These **cannot be turned off**.",
        ),
        table(
          COOKIE_HEAD,
          ["_WPNONCE", "WordPress", "Security token for form submissions", "Session"],
          ["wordpress_logged_in_*", "WordPress", "Keeps users logged into the CMS", "Session"],
          ["cookie_consent", "RohtreMedia", "Stores your cookie preferences", "1 Year"],
        ),
      ],
      { label: "Manage by Category", subtitle: "Required for the website to function. Cannot be disabled." },
    ),
    h3(
      "Analytics Cookies",
      [
        p(
          "Analytics cookies collect information about how you use rohtremedia.com — which pages you visit, how long you stay, and where you came from. This helps us improve the website experience. **No personally identifiable information is collected.**",
        ),
        table(
          COOKIE_HEAD,
          ["_ga", "Google Analytics", "Distinguishes unique users", "2 Years"],
          ["_ga_*", "Google Analytics", "Stores session state", "2 Years"],
          ["_gid", "Google Analytics", "Distinguishes users (24h)", "24 Hours"],
          ["_gat", "Google Analytics", "Throttles request rate", "1 Minute"],
        ),
      ],
      { subtitle: "Help us understand how visitors use our website." },
    ),
    h3(
      "Marketing Cookies",
      [
        p(
          "Marketing cookies are set by Meta (Facebook/Instagram) and Google to track website visits and build a profile of your interests. They're used to show you relevant RohtreMedia ads on other platforms. **We do not sell this data.**",
        ),
        table(
          COOKIE_HEAD,
          ["_fbp", "Meta (Facebook)", "Facebook Pixel — tracks conversions", "3 Months"],
          ["_fbc", "Meta (Facebook)", "Stores Facebook click ID", "2 Years"],
          ["IDE", "Google (DoubleClick)", "Used for Google ad retargeting", "1 Year"],
          ["NID", "Google", "Stores preferences for Google ads", "6 Months"],
        ),
      ],
      { subtitle: "Used to deliver relevant ads and measure campaign performance." },
    ),
    h3(
      "Functional Cookies",
      [
        p(
          "Functional cookies allow the website to remember choices you've made — like your region, language, or form fields — to provide a more personalised experience. Disabling these may mean some features won't remember your preferences between visits.",
        ),
        table(
          COOKIE_HEAD,
          ["wc_cart_hash_*", "WordPress", "Remembers cart contents", "Session"],
          ["pll_language", "Polylang", "Stores language preference", "1 Year"],
          ["viewed_cookie_policy", "RohtreMedia", "Tracks if banner was dismissed", "1 Year"],
        ),
      ],
      { subtitle: "Remember your preferences and personalise your experience." },
    ),
    sec("", [
      p(
        "**🔄 Changing Your Mind**\nYou can update your cookie preferences at any time by returning to this page. Changes take effect immediately on your next page load.",
      ),
      p(
        "**🌐 Browser Controls**\nYou can also manage cookies directly in your browser settings. Note that blocking all cookies may affect website functionality. See your browser's help docs for guidance.",
      ),
      p(
        "**📄 More Information**\nFor full details on how we handle your data, read our [Privacy Notice](/privacy-notice). To opt out of ad platform data sharing, visit our [Do Not Sell My Info](/do-not-sell) page.",
      ),
    ]),
  ],
};

const doNotSell: LegalPage = {
  title: "Do Not Sell or Share My Personal Information",
  eyebrow: "Legal · Data Rights",
  intro:
    "RohtreMedia does not sell your personal data. This page explains what limited data sharing we do engage in — and gives you a simple way to opt out.",
  effective: "",
  updated: "",
  seoTitle: "Do Not Sell or Share My Personal Information",
  seoDescription:
    "RohtreMedia does not sell your personal data. This page explains what limited data sharing we do engage in — and gives you a simple way to opt out.",
  sections: [
    h3("🚫 We Never Sell Data", [
      p("Your personal information is never sold to data brokers, advertisers, or any third party for their own use."),
    ]),
    h3("🎯 Limited Ad Sharing Only", [
      p("We share anonymised signals with Meta and Google solely to measure and improve our own ad performance."),
    ]),
    h3("✋ You're in Control", [
      p("Submit a request below and we'll stop any data sharing within 15 business days. No questions asked."),
    ]),
    sec("Exactly What We Do — and Don't Do", [], { label: "Transparency" }),
    h3("We Do", [
      ul(
        "Use Meta Pixel to measure ad conversions on our own website",
        "Use Google Analytics to understand how visitors use rohtremedia.com",
        "Use Google Tag Manager to manage tracking scripts centrally",
        "Use retargeting to show our ads to people who've visited our website",
        "Share anonymised aggregated signals with ad platforms",
        "Store your contact details to communicate with you about our services",
      ),
    ]),
    h3("We Don't", [
      ul(
        "Sell your name, email, or phone number to any third party",
        "Share your personal details with data brokers",
        "Allow ad platforms to use your data for their own targeting outside our campaigns",
        "Send unsolicited marketing without your consent",
        "Share your information with unrelated companies",
        "Retain your data longer than necessary",
      ),
    ]),
    sec(
      "Platforms We Share Limited Data With",
      [
        p(
          'Our use of the following advertising and analytics tools may technically qualify as "sharing" personal data under certain legal definitions. Here\'s exactly what is shared and why.',
        ),
      ],
      { label: "Data Sharing" },
    ),
    h3("Google", [
      p("**What is shared**"),
      ul("IP address (anonymised)", "Page views & session data", "Cookie & device identifiers", "Conversion events"),
      btn("Manage Google Settings ↗", "https://myaccount.google.com/data-and-privacy"),
    ]),
    h3("Meta", [
      p("**What is shared**"),
      ul("Pixel event data", "Page visit behaviour", "Hashed contact data (if provided)", "Ad interaction signals"),
      btn("Manage Meta Settings ↗", "https://www.facebook.com/adpreferences"),
    ]),
    h3("Microsoft", [
      p("**What is shared**"),
      ul("Search campaign interactions", "Cookie identifiers", "Conversion tracking data"),
      btn(
        "Manage Microsoft Settings ↗",
        "https://about.ads.microsoft.com/en-us/resources/policies/microsoft-advertising-privacy-policy",
      ),
    ]),
    sec(
      "Submit Your Request",
      [
        p(
          "Use the form below to opt out of data sharing. We'll process your request within 15 business days and confirm via email.",
        ),
        // In place of the live opt-out form (owner's choice, 2026-10-24): email only.
        btn("Email us at sales@rohtremedia.com", "mailto:sales@rohtremedia.com?subject=Privacy%20Opt-Out%20Request"),
      ],
      { label: "Opt Out" },
    ),
    h3("Other Ways to Opt Out", []),
    h3(
      "Email Us Directly",
      [p(`Send your opt-out request to ${MAIL} with subject line *"Privacy Opt-Out Request"*.`)],
      { label: "1" },
    ),
    h3(
      "Browser Cookie Settings",
      [
        p(
          "Block or delete cookies via your browser settings. This will prevent most tracking automatically. Check your browser's help docs.",
        ),
      ],
      { label: "2" },
    ),
    h3(
      "Meta Ad Preferences",
      [
        p(
          "Visit [facebook.com/adpreferences](https://www.facebook.com/adpreferences) to control how Meta uses your data across all platforms.",
        ),
      ],
      { label: "3" },
    ),
    h3(
      "Google Data & Privacy",
      [
        p(
          "Visit [myaccount.google.com/data-and-privacy](https://myaccount.google.com/data-and-privacy) to manage what Google knows about you.",
        ),
      ],
      { label: "4" },
    ),
    sec("Still have questions about your data?", [
      p("Our team is happy to walk you through exactly what we hold and why."),
      btn("Contact Us", "mailto:sales@rohtremedia.com"),
    ]),
  ],
};

export const LEGAL_DEFAULTS: Record<LegalSlug, LegalPage> = {
  "terms-of-service": terms,
  "privacy-notice": privacy,
  "fraudulent-use": fraud,
  "cookie-settings": cookies,
  "do-not-sell": doNotSell,
};
