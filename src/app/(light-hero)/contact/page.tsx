import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { ContactForm } from "@/components/contact/contact-form";
import { ContactLanding } from "@/components/contact/contact-landing";
import { ContactScene } from "@/components/contact/contact-scene";
import { ChatIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/icons";
import { Container } from "@/components/page-parts";
import { getContactContent } from "@/lib/contact-data";
import { OG_IMAGES } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/whatsapp";

// Contact: one sky-blue section (the Home hero's gradient and soft diagonal
// strips) with the heading, then the form card (about 55%) beside the "What
// happens next" card and the contact details card; on desktop both columns
// end level. Phones: heading, form, steps, details. The background scene
// sits behind everything (ContactScene). Words and form choices: Admin →
// Contact page; enquiries: Admin → Leads. The id "enquiry" stays on the
// form card: Book a Call links point to /contact#enquiry, and arriving from
// another page the Contact page opens at the top (ContactLanding). The
// section clips (overflow: clip) rather than hides: a hidden-overflow box can
// be scrolled by the jump to #enquiry, which cut off the top of the page.

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getContactContent();
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: "/contact" },
    openGraph: { title: `${seo.title} | RohTre Media`, description: seo.description, url: "/contact", type: "website", images: OG_IMAGES },
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
    <section aria-label="Contact" className="rm-hero-dark rm-hero-sky rm-contact overflow-clip">
      <ContactLanding />
      <ContactScene />
      <Container className="relative z-[1] pb-16 pt-8 md:pt-14 lg:pb-24">
        <div className="rm-contact-head flex max-w-2xl flex-col items-start">
          {c.hero.eyebrow && (
            <p {...enter(0)} className="rm-hero-in rm-label mb-4">
              {c.hero.eyebrow}
            </p>
          )}
          <h1
            {...enter(1)}
            className="rm-hero-in text-[clamp(2.4rem,5.4vw,4.2rem)] font-bold leading-[1.04] tracking-[-0.05em] text-[#0a0a0a] max-md:text-[clamp(2rem,9.5vw,2.6rem)]"
          >
            {c.hero.title} {c.hero.accent && <span className="text-brand">{c.hero.accent}</span>}
          </h1>
          <span aria-hidden="true" {...enter(2)} className="rm-hero-in mt-5 block h-1 w-24 bg-brand" />
          {c.hero.intro && (
            <p {...enter(2)} className="rm-hero-in mt-5 max-w-xl text-[17px] leading-relaxed text-[#1f2a3a] md:text-xl">
              {c.hero.intro}
            </p>
          )}
        </div>

        {/* Desktop: form (55%) beside the steps and details cards; both columns end level
            (the details card takes any spare height). Phones: form, steps, details. */}
        <div className="mt-8 grid items-stretch gap-5 md:mt-12 lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] lg:gap-6">
          <div id="enquiry" className="rm-contact-card scroll-mt-24 p-5 sm:p-8">
            <ContactForm form={c.form} whatsappHref={wa} />
          </div>

          <div className="flex flex-col gap-5 lg:gap-6">
            <section aria-labelledby="next-steps" className="rm-contact-card p-5 sm:p-8">
              <h2
                id="next-steps"
                className="text-[1.4rem] font-bold leading-tight tracking-[-0.03em] sm:text-[1.65rem]"
              >
                {c.steps.title}
              </h2>
              <ol className="mt-5 flex flex-col gap-4 border-t border-[#eef0f3] pt-5">
                {c.steps.items.map((step, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <span aria-hidden="true" className="rm-contact-num">
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[16px] font-semibold leading-snug">{step.step}</span>
                      {step.text && (
                        <span className="mt-0.5 block text-[14px] leading-relaxed text-[#4b5563]">{step.text}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            {c.details.enabled && (
              <section aria-labelledby="reach-us" className="rm-contact-card flex flex-col p-5 sm:p-8 lg:flex-1">
                <h2
                  id="reach-us"
                  className="text-[1.4rem] font-bold leading-tight tracking-[-0.03em] sm:text-[1.65rem]"
                >
                  {c.details.title}
                </h2>
                <ul className="mt-5 flex flex-col divide-y divide-[#eef0f3] border-t border-[#eef0f3] lg:flex-1 lg:justify-evenly">
                  <li className="py-3">
                    <a href={`mailto:${s.email}`} className={`${row} break-all hover:text-brand`}>
                      <MailIcon size={20} className="mt-0.5 shrink-0 text-brand" /> {s.email}
                    </a>
                  </li>
                  {s.phones.map((p) => (
                    <li key={p.tel} className="py-3">
                      <a href={`tel:${p.tel}`} data-track="call_click" className={`${row} hover:text-brand`}>
                        <PhoneIcon size={20} className="mt-0.5 shrink-0 text-brand" />
                        <span>
                          <span className="block text-[13px] text-[#5b6472]">{p.label}</span>
                          {p.display}
                        </span>
                      </a>
                    </li>
                  ))}
                  {s.callbackCountries.map((cc) => (
                    <li key={cc.country} className={`${row} py-3`}>
                      <PhoneIcon size={20} className="mt-0.5 shrink-0 text-brand" />
                      <span>
                        <span className="block text-[13px] text-[#5b6472]">{cc.label}</span>
                        Fill in the form and we’ll call you back.
                      </span>
                    </li>
                  ))}
                  <li className={`${row} py-3`}>
                    <PinIcon size={20} className="mt-0.5 shrink-0 text-brand" />
                    {s.address ?? s.location}
                  </li>
                </ul>
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener"
                    className="rm-press mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25d366] px-6 font-semibold text-[#0b3d1f]"
                  >
                    <ChatIcon size={18} /> WhatsApp us
                  </a>
                )}
              </section>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
