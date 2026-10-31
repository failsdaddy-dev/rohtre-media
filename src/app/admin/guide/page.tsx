import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { requireStaff } from "@/lib/auth";

export const metadata: Metadata = { title: "Help & guide" };

// A short, plain-words guide to the admin for a first-time user: how it
// connects to the website, the five everyday jobs step by step, and what
// each word on screen means. Static text; no data.

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center bg-[color-mix(in_srgb,var(--brand)_10%,#fff)] text-sm font-bold text-brand"
      >
        {n}
      </span>
      <div className="min-w-0">
        <h3 className="font-semibold">{title}</h3>
        <div className="mt-1 text-sm leading-relaxed text-fg-2">{children}</div>
      </div>
    </li>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[18px] border border-line bg-bg-elev p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className="font-semibold text-brand underline underline-offset-2">
    {children}
  </Link>
);

async function Guide() {
  const staff = await requireStaff();
  return (
    <AdminFrame staff={staff} current="/admin/guide" title="Help & guide">
      <div className="flex flex-col gap-6">
        <Card title="How it works (in one minute)">
          <ul className="flex flex-col gap-2 text-sm leading-relaxed">
            <li>
              <strong>The admin is the control room of the live website.</strong> Everything you see on the site (text,
              images, videos, numbers) is stored here.
            </li>
            <li>
              <strong>Main pages</strong> (Home, About, Work, Recognition, Careers, Contact, legal): edit, press{" "}
              <strong>Save</strong>, and the website shows it within seconds. No developer needed.
            </li>
            <li>
              <strong>Landing pages</strong> (/lp/… for ads) work like WordPress posts: they start as a{" "}
              <strong>Draft</strong>, you edit and save, then press <strong>Publish</strong> to put them live.
            </li>
            <li>
              <strong>Proof</strong> (results, testimonials, creatives, badges) only shows on the site once it is
              switched to <strong>Approved</strong>.
            </li>
            <li>
              <strong>Find anything:</strong> press <kbd className="rounded border border-line px-1 text-xs">Ctrl K</kbd>{" "}
              and type what you want (“logo”, “WhatsApp”, “FAQ”). The green <strong>Live</strong> strip under the menu
              has <strong>Open website ↗</strong> to check your change.
            </li>
          </ul>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="1. Change text or an image on a page">
            <ol className="flex flex-col gap-4">
              <Step n={1} title="Open the page">
                Menu → <strong>Company</strong> → the page (for example <A href="/admin/home">Home page</A>).
              </Step>
              <Step n={2} title="Open a section">
                Find the section you want (each part of the page has its own box), change the words, or click{" "}
                <strong>Replace</strong> on an image or video.
              </Step>
              <Step n={3} title="Save">
                The bar at the bottom says <strong>Unsaved changes</strong>. Press <strong>Save</strong>; it turns into
                a green <strong>Saved</strong>. Leaving without saving asks you first.
              </Step>
            </ol>
          </Card>

          <Card title="2. Make and publish an ad landing page">
            <ol className="flex flex-col gap-4">
              <Step n={1} title="Create it">
                <A href="/admin/pages">Landing pages</A> → pick <strong>Service</strong>, <strong>Niche</strong>,{" "}
                <strong>Country</strong> → <strong>Create draft page</strong>. The text is filled in for that niche and
                country.
              </Step>
              <Step n={2} title="Fill the checklist">
                Check the text and mark FAQ answers ready. The offer banner is optional; if you add one, it needs desktop,
                mobile and alt text. Sections with no proof stay off the live page by themselves. Press{" "}
                <strong>Save</strong>, then <strong>Re-check</strong>.
              </Step>
              <Step n={3} title="Publish">
                Choose <strong>Unlisted</strong> (ads only, hidden from Google) or <strong>Public</strong>, then press{" "}
                <strong>Publish</strong>. <strong>Take offline</strong> hides it again; <strong>Delete page</strong>{" "}
                removes it for good.
              </Step>
            </ol>
          </Card>

          <Card title="3. Add proof (results, reviews, logos)">
            <ol className="flex flex-col gap-4">
              <Step n={1} title="Open Proof & badges">
                <A href="/admin/proof">Proof & badges</A> → choose Results, Testimonials, Creatives or Badges → add one.
              </Step>
              <Step n={2} title="Tag it">
                Tag the service, niche or country it belongs to, so the right landing pages show it.
              </Step>
              <Step n={3} title="Approve it">
                Switch <strong>Approved for the live site</strong> on. Until then it never shows on the website.
              </Step>
            </ol>
          </Card>

          <Card title="4. Check enquiries">
            <ol className="flex flex-col gap-4">
              <Step n={1} title="See who contacted you">
                The <A href="/admin">Overview</A> shows the latest leads; <strong>Leads</strong> has all of them, a
                search and a CSV export.
              </Step>
              <Step n={2} title="Job applications">
                <strong>Applications</strong> lists everyone who applied on the Careers page.
              </Step>
              <Step n={3} title="Contact details">
                Phone, email, WhatsApp number and the form’s choices live in <strong>Settings</strong>.
              </Step>
            </ol>
          </Card>
        </div>

        <Card title="Landing pages: adding your own Service, Niche or Country">
          <ol className="flex flex-col gap-4">
            <Step n={1} title="Add it">
              In <A href="/admin/pages">Landing pages</A>, open the Service, Niche or Country dropdown and press{" "}
              <strong>+ Add new</strong> at the bottom. Only the owner and developer see this.
            </Step>
            <Step n={2} title="Check the URL and headline">
              Type the name. The URL text and headline wording fill in by themselves, and you can change them. The live
              preview shows the final URL and headline. The URL text can’t change after saving.
            </Step>
            <Step n={3} title="Create the page">
              The new option is selected for you. Press <strong>Create draft page</strong>. The page uses the same layout
              and sections as every other landing page.
            </Step>
            <Step n={4} title="Fill the prompts">
              Text we can’t write for a new service or niche starts as a prompt like{" "}
              <strong>[Add the hero text here]</strong>. Replace each one. They are listed in the <strong>Publish</strong>{" "}
              box, and the page can’t be published until they are gone, so visitors never see them.
            </Step>
            <Step n={5} title="Hide, rename or reorder">
              Press <strong>Manage options</strong> under the form. Hide takes an option out of the dropdowns; pages
              already made from it stay as they are. Rename changes the name for new pages, not the text saved on existing
              pages. Built-in options can’t be deleted. A custom option can’t be deleted while a landing page or a proof
              item uses it.
            </Step>
          </ol>
        </Card>

        <Card title="Words you will see">
          <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            {[
              ["Draft", "Saved but not on the website yet (landing pages)."],
              ["Published", "Live on the website."],
              ["Unlisted", "Live for anyone with the link (your ads), but hidden from Google."],
              ["Public", "Live and shown in Google search."],
              ["Approved", "Proof that is allowed to show on the website."],
              ["Placeholder", "A grey or striped box you see only while building; visitors never see it."],
              ["On / Off switch", "Red = on (shown). Grey = off (hidden)."],
              ["Version history", "Every save of a landing page is kept; Restore brings an old one back."],
            ].map(([term, text]) => (
              <div key={term}>
                <dt className="font-semibold">{term}</dt>
                <dd className="text-fg-2">{text}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Good habits">
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-fg-2">
            <li>After saving, press Open website ↗ (in the Live strip) and check the page on your phone too.</li>
            <li>Images: upload the size shown in the box. Big photos are fine; they are resized for you.</li>
            <li>Never put prices inside landing-page text; put the offer in the banner image.</li>
            <li>Something looks wrong? The Audit log shows who changed what, and landing pages can be restored.</li>
          </ul>
        </Card>
      </div>
    </AdminFrame>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Guide />
    </Suspense>
  );
}
