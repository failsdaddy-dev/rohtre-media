import type { Metadata } from "next";
import Image from "next/image";
import { ChatIcon } from "@/components/icons";
import { ButtonLink, Card, CtaBand, PageHero, Section } from "@/components/page-parts";
import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/whatsapp";

// Careers (R12, R33). Wording from the live Careers page
// (docs/content/wordpress-text/careers.txt). Left out until confirmed: the
// benefits list (it reads like a US template: 401K, dental) and award badges.

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Build a career in digital marketing at RohTre Media. Remote-friendly roles in video, design, social media and growth.",
  alternates: { canonical: "/careers" },
};

const VALUES = [
  {
    title: "Think Big",
    text: "For our clients, it means expanding their vision beyond what’s expected. For us, it means being a committed partner who brings strategic recommendations and measurable business outcomes.",
  },
  {
    title: "Own It",
    text: "We encourage autonomy. Owning it means building skills in your role, carving out your career path and taking responsibility and accountability for your work.",
  },
  {
    title: "Have Fun",
    text: "We enjoy working together and keep the workplace enjoyable for everyone. Anything we enjoy, we naturally do better.",
  },
];

const SPOTLIGHTS = [
  {
    name: "Kartikay Singh Rawal",
    role: "Video Production",
    headline: "Junior video editor to Head of Video Production",
    text: "Kartikay came from a finance background and, with our support, moved into video editing. He now creates standout, on-brand content across channels.",
    photo: "rohtre-media/images/team/kartikay-singh-rawal",
  },
  {
    name: "Nitish",
    role: "Graphic Design",
    headline: "Design intern to leading the creative output",
    text: "Nitish started as an intern and is now one of our top designers, steering the creative engine.",
    photo: "rohtre-media/images/team/nitish",
  },
  {
    name: "Hassan Ahmad",
    role: "Social Media",
    headline: "Video editor intern to leading social media",
    text: "Hassan is known for relentless creativity and strong time management, turning complex tasks into polished work on time.",
    photo: "rohtre-media/images/team/hassan-ahmad",
  },
];

const STEPS = [
  "Apply.",
  "Shortlisted candidates receive a task.",
  "Submit the task before the deadline.",
  "If selected, we schedule an interview.",
];

const FAQ = [
  {
    q: "What is the main selection criterion?",
    a: "Your ability to complete the assigned task within the deadline. Speed, creativity and attention to detail matter most.",
  },
  {
    q: "Do I need prior experience to apply?",
    a: "Not always. We value skills and dedication over experience alone. If you can prove yourself through the task, you stand a good chance.",
  },
  {
    q: "What kind of tasks can I expect?",
    a: "It depends on the role. Creative roles may get an editing, design or content task. HR or business development roles may get outreach, research or strategy assignments.",
  },
  {
    q: "How quickly will I know the result?",
    a: "Usually within 2–3 working days after you submit the task, though timelines can vary by role.",
  },
  {
    q: "Do you offer remote roles?",
    a: "Yes. Many of our roles and internships are remote unless the job says otherwise.",
  },
  {
    q: "How important are deadlines?",
    a: "Very. Deadlines define reliability, and missing one without a reason can reduce your chances of selection.",
  },
  {
    q: "Do you consider freshers?",
    a: "Yes. If you’re skilled, eager to learn and can prove yourself with the task, you’re welcome to apply.",
  },
  {
    q: "What qualities do you look for?",
    a: "Accountability, adaptability, speed, creativity and a willingness to take ownership.",
  },
  {
    q: "Will I get a certificate or experience letter?",
    a: "Yes. Interns and employees who complete their tenure or project successfully receive official recognition.",
  },
];

export default async function CareersPage() {
  const settings = await getSettings();
  const hr = settings.hrWhatsapp
    ? whatsappLink(settings.hrWhatsapp, "Hi RohTre Media HR, I'd like to apply for a role.")
    : null;

  return (
    <>
      <PageHero
        eyebrow="Careers"
        title={
          <>
            Develop a career in <span className="rm-text-grad">digital marketing.</span>
          </>
        }
        intro="If you want autonomy to make decisions with direct impact, to learn from experienced people and to keep growing, let’s start the conversation about your career."
      >
        {hr && (
          <ButtonLink href={hr} external>
            <ChatIcon size={18} /> Chat with HR
          </ButtonLink>
        )}
        <ButtonLink href="#how-we-hire" variant="plain">
          How we hire
        </ButtonLink>
      </PageHero>

      <Section eyebrow="Why RohTre Media" title="Work from anywhere.">
        <div className="grid max-w-4xl gap-5 text-lg text-fg-2">
          <p>
            We’re all about collaboration and creativity, so we skipped the cubicles and the stuffy dress code. Instead,
            we offer flexible work and push for a good work-life balance.
          </p>
          <p>
            Happy people make happy clients, and career growth matters as much as revenue growth. We’ve worked hard to
            build a place that puts people first, and we’re always looking to grow the team.
          </p>
        </div>
      </Section>

      <Section soft eyebrow="Values" title="We raise the bar for what an agency should be.">
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

      <Section eyebrow="Employee spotlights" title="Grow beyond your job title.">
        <ul className="grid gap-6 md:grid-cols-3">
          {SPOTLIGHTS.map((s) => (
            <li key={s.name}>
              <Card>
                <div className="flex items-center gap-4">
                  <Image
                    src={s.photo}
                    alt={s.name}
                    width={128}
                    height={128}
                    sizes="64px"
                    loading="lazy"
                    className="size-16 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold">{s.name}</p>
                    <p className="text-sm text-fg-2">{s.role}</p>
                  </div>
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-[-0.01em]">{s.headline}</h3>
                <p className="mt-2 text-fg-2">{s.text}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section soft id="how-we-hire" eyebrow="How we hire" title="Four simple steps.">
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-col gap-3 rounded-[18px] border border-line bg-bg-elev p-6">
              <span className="grid size-10 place-items-center rounded-full bg-brand font-bold text-brand-fg">
                {i + 1}
              </span>
              <p className="font-medium">{s}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="FAQ" title="Questions about hiring at RohTre Media">
        <div className="flex max-w-3xl flex-col gap-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-[16px] border border-line bg-bg-elev px-5 py-4 open:pb-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {f.q}
                <span aria-hidden="true" className="text-xl text-brand transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-fg-2">{f.a}</p>
            </details>
          ))}
        </div>
        {hr && (
          <div className="mt-10">
            <ButtonLink href={hr} external variant="dark">
              <ChatIcon size={18} /> Apply via WhatsApp
            </ButtonLink>
          </div>
        )}
      </Section>

      <CtaBand />
    </>
  );
}
