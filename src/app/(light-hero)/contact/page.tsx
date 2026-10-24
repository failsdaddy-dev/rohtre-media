import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { ContactForm } from "@/components/contact/contact-form";
import { ContactScene } from "@/components/contact/contact-scene";
import { ChatIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/icons";
import { Container } from "@/components/page-parts";
import { getContactContent } from "@/lib/contact-data";
import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/whatsapp";

// Contact: one sky-blue section (the Home hero's gradient and soft diagonal
// strips) with the heading, then the form card (about 55%) beside the "What
// happens next" panel and the existing contact details. Phones: heading,
// form, steps, details. The background scene sits behind everything
// (ContactScene). Words and form choices: Admin → Contact page; enquiries:
// Admin → Leads. The id "enquiry" stays on the form card: Book a Call links
// point to /contact#enquiry.

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getContactContent();
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: "/contact" },
    openGraph: { title: `${seo.title} | RohTre Media`, description: seo.description, url: "/contact", type: "website" },
  };
}

const enter = (i: number) => ({ className: "rm-hero-in", style: { "--i": i } as CSSProperties });

export default async function ContactPage() {
  const [c, s] = await Promise.all([getContactContent(), getSettings()]);
  const wa = s.whatsapp.enabled
    ? whatsappLink(s.whatsapp.number, "Hi RohTre Media, I just sent an enquiry from your Contact page.")
    : null;
  const row = "flex items-start gap-3 text-[15px] text-[#1f2430]";

  return (
    <section aria-label="Contact" className="rm-hero-dark rm-hero-sky rm-contact overflow-hidden">
      <ContactScene />
      <Container className="relative z-[1] pb-20 pt-10 md:pt-16 lg:pb-28">
        <div className="rm-contact-head flex max-w-2xl flex-col items-start">
          {c.hero.eyebrow && (
            <p {...enter(0)} className="rm-hero-in rm-label mb-5">
              {c.hero.eyebrow}
            </p>
          )}
          <h1
            {...enter(1)}
            className="rm-hero-in text-[clamp(2.4rem,6vw,4.5rem)] font-bold leading-[1.04] tracking-[-0.05em] text-[#0a0a0a] max-md:text-[clamp(2.1rem,10vw,2.8rem)]"
          >
            {c.hero.title} {c.hero.accent && <span className="text-brand">{c.hero.accent}</span>}
          </h1>
          <span aria-hidden="true" {...enter(2)} className="rm-hero-in mt-6 block h-1 w-28 bg-brand" />
          {c.hero.intro && (
            <p {...enter(2)} className="rm-hero-in mt-6 max-w-xl text-lg leading-relaxed text-[#1f2a3a] md:text-xl">
              {c.hero.intro}
            </p>
          )}
        </div>

        <div className="mt-10 grid items-start gap-6 md:mt-14 lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] lg:gap-8">
          <div id="enquiry" className="rm-contact-card scroll-mt-24 p-5 sm:p-8 lg:p-10">
            <ContactForm form={c.form} whatsappHref={wa} />
          </div>

          <div className="flex flex-col gap-6">
            <section aria-labelledby="next-steps" className="rm-contact-card p-6 sm:p-8">
              <h2 id="next-steps" className="text-[1.35rem] font-bold tracking-[-0.02em]">
                {c.steps.title}
              </h2>
              <ol className="mt-6 flex flex-col gap-5">
                {c.steps.items.map((step, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span aria-hidden="true" className="rm-contact-num">
                      {i + 1}
                    </span>
                    <span className="min-w-0 pt-1.5">
                      <span className="block text-[16px] font-semibold leading-snug">{step.step}</span>
                      {step.text && <span className="mt-1 block text-[14.5px] leading-relaxed text-[#4b5563]">{step.text}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            {c.details.enabled && (
              <section aria-labelledby="reach-us" className="rm-contact-card flex flex-col gap-4 p-6 sm:p-8">
                <h2 id="reach-us" className="text-[1.15rem] font-bold tracking-[-0.02em]">
                  {c.details.title}
                </h2>
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener"
                    className="rm-press inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25d366] px-6 font-semibold text-[#0b3d1f]"
                  >
                    <ChatIcon size={18} /> WhatsApp us
                  </a>
                )}
                <a href={`mailto:${s.email}`} className={`${row} break-all hover:text-brand`}>
                  <MailIcon size={20} className="mt-0.5 shrink-0 text-brand" /> {s.email}
                </a>
                {s.phones.map((p) => (
                  <a key={p.tel} href={`tel:${p.tel}`} data-track="call_click" className={`${row} hover:text-brand`}>
                    <PhoneIcon size={20} className="mt-0.5 shrink-0 text-brand" />
                    <span>
                      <span className="block text-sm text-[#5b6472]">{p.label}</span>
                      {p.display}
                    </span>
                  </a>
                ))}
                {s.callbackCountries.map((cc) => (
                  <p key={cc.country} className={row}>
                    <PhoneIcon size={20} className="mt-0.5 shrink-0 text-brand" />
                    <span>
                      <span className="block text-sm text-[#5b6472]">{cc.label}</span>
                      Fill in the form and we’ll call you back.
                    </span>
                  </p>
                ))}
                <p className={row}>
                  <PinIcon size={20} className="mt-0.5 shrink-0 text-brand" />
                  {s.address ?? s.location}
                </p>
              </section>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
