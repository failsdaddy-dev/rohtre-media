import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRightIcon } from "@/components/icons";
import { ButtonLink, Card, CtaBand, PageHero, Section } from "@/components/page-parts";
import { BOOK_CALL_HREF } from "@/components/site-header";

// About (R33). Wording from the live About page (docs/content/wordpress-text/about.txt),
// lightly corrected. The live page's numbers (views, subscribers, revenue,
// awards, clients) are left out until there is proof for each (R19).

export const metadata: Metadata = {
  title: "About",
  description:
    "RohTre Media is a creator-founded, performance-driven marketing agency led by Rohan Trehan, CEO and digital growth consultant.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    title: "Disrupt the Norm",
    text: "We don’t follow trends, we set them. Every strategy we build is designed to break through the noise, challenge the status quo and put our clients ahead of the curve.",
  },
  {
    title: "Execute Relentlessly",
    text: "Ideas are only as good as their execution. We work with precision, speed and accountability, turning bold concepts into measurable wins again and again.",
  },
  {
    title: "Play to Win",
    text: "We treat every project like a championship match: high energy, creative flair and the drive to outperform the competition. When we win, our clients win bigger.",
  },
];

const TEAM = [
  { name: "Himesh Chaurasia", role: "Human Resources", photo: "rohtre-media/images/team/himesh-chaurasia" },
  { name: "Avjit Mishra", role: "Research & Development", photo: "rohtre-media/images/team/avjit-mishra" },
  { name: "Kartikay Singh Rawal", role: "Video Production", photo: "rohtre-media/images/team/kartikay-singh-rawal" },
  { name: "Hassan Ahmad", role: "Social Media", photo: "rohtre-media/images/team/hassan-ahmad" },
  { name: "Nitish", role: "Graphic Design", photo: "rohtre-media/images/team/nitish" },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title={
          <>
            Built on creative vision and <span className="rm-text-grad">digital mastery.</span>
          </>
        }
        intro="Led by Rohan Trehan, CEO and digital growth consultant."
      >
        <ButtonLink href={BOOK_CALL_HREF} track="book_call_click">
          Book a Call <ArrowRightIcon size={18} />
        </ButtonLink>
        <ButtonLink href="/careers" variant="plain">
          Join the team
        </ButtonLink>
      </PageHero>

      <Section eyebrow="Who we are" title="We raise the bar for what a marketing agency should be.">
        <p className="max-w-3xl text-lg text-fg-2">
          RohTre Media is the growth partner you’ve been looking for, whether you’re a creator, a small business or a
          global brand. We create powerful systems, innovative strategies and scalable teams that drive real results.
          For startups, we build fast-growth roadmaps; for established enterprises, we execute with precision at scale.
          Wherever you are in your journey, we have the blueprint to help you go further, faster.
        </p>
      </Section>

      <Section dark eyebrow="How we work" title="What we stand for">
        <ul className="grid gap-6 md:grid-cols-3">
          {VALUES.map((v) => (
            <li key={v.title}>
              <Card>
                <h3 className="text-xl font-bold tracking-[-0.02em]">{v.title}</h3>
                <p className="mt-3 text-fg-2">{v.text}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section eyebrow="Leadership" title="Meet the founder">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,320px)_1fr]">
          <div className="rm-offset overflow-hidden [--offset-surface:var(--bg-elev)]">
            <Image
              src="rohtre-media/images/team/rohan-trehan"
              alt="Rohan Trehan, CEO of RohTre Media"
              width={400}
              height={400}
              sizes="(max-width: 768px) 100vw, 320px"
              className="relative aspect-square w-full rounded-[16px] object-cover"
            />
          </div>
          <div className="flex flex-col items-start gap-4">
            <h3 className="text-3xl font-bold tracking-[-0.03em]">Rohan Trehan</h3>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">CEO &amp; Consultant</p>
            <p className="max-w-xl text-lg text-fg-2">
              A digital growth consultant who leads RohTre Media’s strategy, creative and campaigns.
            </p>
            <ButtonLink href={BOOK_CALL_HREF} variant="dark" track="book_call_click">
              Book a call with our team <ArrowRightIcon size={18} />
            </ButtonLink>
          </div>
        </div>
      </Section>

      <Section soft eyebrow="Team" title="People at RohTre Media">
        <p className="-mt-4 mb-10 max-w-3xl text-lg text-fg-2">
          Our people set us apart. Behind every job title is a whole person, bringing the perspective, passion and craft
          that shape our work, our values and the vision we share with our clients.
        </p>
        <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {TEAM.map((m) => (
            <li key={m.name} className="flex flex-col gap-3">
              <Image
                src={m.photo}
                alt={m.name}
                width={300}
                height={300}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
                loading="lazy"
                className="aspect-square w-full rounded-[16px] object-cover"
              />
              <div>
                <p className="font-bold">{m.name}</p>
                <p className="text-sm text-fg-2">{m.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section eyebrow="Culture" title="Creator-founded and performance-driven.">
        <div className="grid max-w-4xl gap-5 text-lg text-fg-2">
          <p>
            We’ve built a team where creativity meets execution, uniting strategists, editors, designers and marketers
            from around the globe. Our culture thrives on diversity of thought, skill and perspective, which gives us
            the edge to craft content and campaigns that outperform the competition.
          </p>
          <p>
            We believe great ideas come from everywhere. That’s why we hire talent from all backgrounds, industries and
            countries, so our clients benefit from a blend of insight and innovation.
          </p>
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
