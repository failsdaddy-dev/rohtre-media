import type { Metadata } from "next";
import { ChatIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/icons";
import { LeadForm } from "@/components/lead-form";
import { Container, PageHero } from "@/components/page-parts";
import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact",
  description: "Book your 15-minute discovery call with RohTre Media, or reach us by email, phone or WhatsApp.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const s = await getSettings();
  const row = "flex items-start gap-3 text-[15px]";
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Book your 15-minute <span className="rm-text-grad">discovery call.</span>
          </>
        }
        intro="Looking to grow your brand? Tell us a little about it and we’ll get back to you."
      />

      <section className="py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div id="enquiry" className="rm-offset scroll-mt-24 p-6 sm:p-10 [--offset-surface:var(--bg-elev)]">
            <div className="relative">
              <LeadForm adSpendRanges={s.adSpendRanges} interests={s.interests} careersLine={s.careersLineEnabled} />
            </div>
          </div>

          <aside aria-label="Other ways to reach us" className="flex flex-col gap-6">
            <h2 className="text-xl font-bold">Other ways to reach us</h2>
            {s.whatsapp.enabled && (
              <a
                href={whatsappLink(s.whatsapp.number, "Hi RohTre Media, I'd like to book a discovery call.")}
                target="_blank"
                rel="noopener"
                className="rm-press inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25d366] px-6 font-semibold text-[#0b3d1f]"
              >
                <ChatIcon size={18} /> WhatsApp us
              </a>
            )}
            <a href={`mailto:${s.email}`} className={`${row} hover:text-brand`}>
              <MailIcon size={20} className="mt-0.5 shrink-0 text-brand" /> {s.email}
            </a>
            {s.phones.map((p) => (
              <a key={p.tel} href={`tel:${p.tel}`} data-track="call_click" className={`${row} hover:text-brand`}>
                <PhoneIcon size={20} className="mt-0.5 shrink-0 text-brand" />
                <span>
                  <span className="block text-sm text-fg-2">{p.label}</span>
                  {p.display}
                </span>
              </a>
            ))}
            {s.callbackCountries.map((c) => (
              <p key={c.country} className={row}>
                <PhoneIcon size={20} className="mt-0.5 shrink-0 text-brand" />
                <span>
                  <span className="block text-sm text-fg-2">{c.label}</span>
                  Fill in the form and we’ll call you back.
                </span>
              </p>
            ))}
            <p className={row}>
              <PinIcon size={20} className="mt-0.5 shrink-0 text-brand" />
              {s.address ?? s.location}
            </p>
          </aside>
        </Container>
      </section>
    </>
  );
}
