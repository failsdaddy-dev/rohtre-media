import { z } from "zod";
import { mediaSchema } from "./home-schema";
import { emptySlot, slotSchema } from "./media-slot";

// The Careers page (R33), edited in Admin → Careers page and stored like
// Home and About: one JSON row in public.page_content (key "careers"). Every
// field has a default, so the page renders before anything is saved. Words
// are the live page's (https://rohtremedia.com/careers/, read 2026-10-23)
// except where marked: the three benefit cards (the live text read like a
// US template: 401K, dental, vision; rewritten from the live page's own
// statements), the two engineers' spotlights and the closing card (drafts).
// Not here on purpose: the Diversity section and its progress bars (About
// only), and Hassan Ahmad (no longer with the company).

const line = (max: number) => z.string().max(max);
/** Internal links, anchors or https links. "#apply" opens the application form. */
const href = z.string().regex(/^(\/|#|https:\/\/)/, "Start with /, # or https://");

/** Card icons (ServiceIcon names). */
export const CAREER_ICONS = [
  "heart",
  "calendar",
  "growth",
  "sparkles",
  "key",
  "star",
  "trend",
  "target",
  "leaf",
  "globe",
  "users",
  "book",
  "network",
  "clock",
  "briefcase",
  "eye",
] as const;

/** Icon colours (never red, each card its own): a fixed palette. */
export const CARD_COLORS = {
  amber: "#F59E0B",
  blue: "#2563EB",
  violet: "#7C3AED",
  teal: "#0D9488",
  green: "#16A34A",
  pink: "#DB2777",
  orange: "#EA580C",
  sky: "#0284C7",
  indigo: "#4F46E5",
} as const;
export type CardColor = keyof typeof CARD_COLORS;
const COLOR_KEYS = Object.keys(CARD_COLORS) as [CardColor, ...CardColor[]];

const card = z.object({
  icon: z.enum(CAREER_ICONS),
  color: z.enum(COLOR_KEYS),
  title: line(60).min(1),
  text: line(500),
});
type Card = z.infer<typeof card>;
const c = (icon: Card["icon"], color: CardColor, title: string, text: string): Card => ({ icon, color, title, text });

const block = z.object({
  eyebrow: line(40),
  title: line(120).min(1),
  body: line(1200),
  body2: line(1200),
  linkLabel: line(40),
  linkHref: href,
  /** 4:3 photo; empty = a marked placeholder frame while building. */
  image: slotSchema(["4:3"]),
  side: z.enum(["left", "right"]),
});

const spotlight = z.object({
  headline: line(120),
  name: line(60).min(1),
  role: line(60),
  story: line(500),
  photo: mediaSchema.nullable(),
});

export const careersSchema = z.object({
  seo: z
    .object({ title: line(70).min(1), description: line(170).min(1) })
    .default({
      title: "Careers",
      description:
        "Develop a career in digital marketing at RohTre Media: autonomy, a direct impact and room to grow. See open roles and apply.",
    }),
  hero: z
    .object({
      eyebrow: line(40),
      title: line(120).min(1),
      intro: line(400),
      primaryLabel: line(30).min(1),
      primaryHref: href,
      /** "Chat with HR": opens WhatsApp to the HR number in Settings (hidden when that is empty). */
      hrLabel: line(30),
      image: slotSchema(["12:5"]),
      focusX: z.number().int().min(0).max(100),
      focusXMobile: z.number().int().min(0).max(100),
    })
    .default({
      eyebrow: "Careers",
      title: "Develop a career in digital marketing.",
      intro:
        "If you're eager to have autonomy in your role to make decisions with a direct impact, learn from a group of veterans, and have opportunities for continued growth, let's start the conversation about your career in digital marketing today.",
      primaryLabel: "View open positions",
      primaryHref: "#apply",
      hrLabel: "Chat with HR",
      image: {
        ...emptySlot("12:5", "image"),
        publicId: "rohtre-media/images/about/rohan-trehan-youtube-stage",
        format: "webp",
        alt: "Rohan Trehan, founder of RohTre Media, on a YouTube stage holding a Social Media Summit & Awards bag",
      },
      focusX: 66,
      focusXMobile: 66,
    }),
  strip: z
    .object({
      enabled: z.boolean(),
      items: z
        .array(
          z.object({
            /** Logo (white or light artwork works best on the red). */
            logo_public_id: z.string().regex(/^rohtre-media\/[A-Za-z0-9_./-]+$/).nullable(),
            /** Big text instead of a logo, e.g. 2Billion+. */
            value: line(20),
            label: line(60),
          }),
        )
        .max(8),
    })
    .default({
      enabled: true,
      items: [
        { logo_public_id: "rohtre-media/images/careers/lbs-digital-icon-award", value: "", label: "Digital Icon Award at LBS" },
        {
          logo_public_id: "rohtre-media/images/careers/indian-government-award",
          value: "",
          label: "Awarded by the Indian Government",
        },
        { logo_public_id: "rohtre-media/images/careers/google-logo-white", value: "", label: "Partner" },
        { logo_public_id: "rohtre-media/images/badges/youtube-icon-white", value: "", label: "Youtube Certified" },
        { logo_public_id: null, value: "2Billion+", label: "Views Generated for Clients" },
      ],
    }),
  blocks: z
    .object({ enabled: z.boolean(), items: z.array(block).max(6) })
    .default({
      enabled: true,
      items: [
        {
          eyebrow: "WHY ROHTREMEDIA?",
          title: "Our team makes us successful.",
          body: "We hire only the most outstanding, forward-thinking candidates and invest in their continued professional development. We want to help you grow as you help us grow.",
          body2: "",
          linkLabel: "Meet some of our colleagues",
          linkHref: "#spotlights",
          image: emptySlot("4:3", "image"),
          side: "left",
        },
        {
          eyebrow: "",
          title: "We're big on work-life balance.",
          body: "We know that having a healthy work-life balance is essential for productivity and creativity. Everyone needs time off to recharge and take care of personal things – we get it.",
          body2: "That's why we offer our employees a flexible paid time off plan so that they can be fresh and productive.",
          linkLabel: "View open positions",
          linkHref: "#apply",
          image: emptySlot("4:3", "image"),
          side: "right",
        },
        {
          eyebrow: "",
          title: "Work from anywhere!",
          body: "We're an innovative marketing agency focused on helping brands disrupt their industry through next-level digital marketing. We're all about collaboration and creativity, meaning we skipped the cubicles and stuffy dress code. Instead, we provide amazing work-flexibility, push for good work-life balance, and organize local team meet-ups on a regular basis.",
          body2:
            "We know that happy employees = happy clients. And, that career growth is just as important as revenue growth. We've worked hard to create an environment that puts our people first, and we're always looking to grow our team.",
          linkLabel: "Learn more",
          linkHref: "#benefits",
          image: emptySlot("4:3", "image"),
          side: "left",
        },
      ],
    }),
  benefits: z
    .object({
      enabled: z.boolean(),
      eyebrow: line(40),
      title: line(140).min(1),
      intro: line(600),
      items: z.array(card).max(6),
      linkLabel: line(40),
      linkHref: href,
    })
    .default({
      enabled: true,
      eyebrow: "BENEFITS",
      title: "Physical, mental and financial well-being is our priority.",
      intro:
        "We're passionate about giving back to our employees, and to the communities where we live. That's why we have such a positive culture and are consistently rated a great place to work by our own people.",
      items: [
        c("heart", "pink", "Health & Wellness", "We keep work human and sustainable: a sane pace, realistic deadlines and support from the team when you need it."),
        c("calendar", "blue", "Paid Time Off", "We're big on work-life balance. Our flexible paid time off plan lets you recharge and come back fresh and productive."),
        c("growth", "green", "Career Growth", "We invest in your continued professional development. Learn from veterans, take ownership early and grow into bigger roles."),
      ],
      linkLabel: "See all benefits",
      linkHref: "#all-benefits",
    }),
  spotlights: z
    .object({ enabled: z.boolean(), title: line(80).min(1), intro: line(600), items: z.array(spotlight).max(12) })
    .default({
      enabled: true,
      title: "Employee Spotlights",
      intro:
        "We're not stuck within rigid lanes or held back by big company politics. We have well-defined roles, but we also encourage our team members to work outside of their comfort zone and explore all facets of the organization.",
      items: [
        {
          headline: "Junior Video Editor promoted to Head of Video Production.",
          name: "Kartikay Singh Rawal",
          role: "Video Production",
          story:
            "Started 1.5 years ago. Kartikay came from a finance background and, with our support, transitioned into video editing—now creating standout, on-brand content across channels.",
          photo: { publicId: "rohtre-media/images/team/kartikay-singh-rawal", width: 400, height: 400 },
        },
        {
          headline: "Turning repetitive work into AI automations",
          name: "Mrunal Patel",
          role: "Back-End Engineer",
          story:
            "Mrunal is an AI automation and AI full-stack developer who designs AI agents and automated workflows that connect our tools and take repetitive tasks off the team's plate.",
          photo: { publicId: "rohtre-media/images/team/mrunal", width: 400, height: 400 },
        },
        {
          headline: "Building AI chatbots and full-stack websites",
          name: "Harshil Makwana",
          role: "Back-End Engineer",
          story:
            "Harshil is an AI full-stack developer who builds AI chatbots, the back-end systems behind them, and fast, modern websites for our clients and our own team.",
          photo: { publicId: "rohtre-media/images/team/harshil", width: 800, height: 800 },
        },
        {
          headline: "Graphics Design Intern to Leading the Creative Output",
          name: "Nitish",
          role: "Graphic Design",
          story:
            "Started as a Graphics Designer intern. Nitish began as a junior video editor intern and is now one of our top designers, steering the creative engine.",
          photo: { publicId: "rohtre-media/images/team/nitish", width: 400, height: 400 },
        },
      ],
    }),
  values: z
    .object({
      enabled: z.boolean(),
      eyebrow: line(40),
      title: line(80).min(1),
      subtitle: line(160),
      intro: line(800),
      items: z.array(card).max(6),
    })
    .default({
      enabled: true,
      eyebrow: "VALUES",
      title: "We run the show",
      subtitle: "We raise the bar for what a marketing agency should be.",
      intro:
        "RohtreMedia is your partner, whether you're a small business or a global enterprise. We've built systems, strategies, and teams that can handle any scale. For startups, we have tailored solutions to help you grow fast. For enterprises, we bring the expertise, structure, and execution to match your size and ambition. No matter where you are, you're safe with us—there's a plan for everything.",
      items: [
        c("sparkles", "amber", "Think Big", "\"Think Big\" challenges our teams in all aspects of the business. For our clients, it requires that we expand their vision beyond what's expected, while pushing us to become a committed partner who provides strategic recommendations and measurable business outcomes."),
        c("key", "violet", "Own It", "\"Own It\" plays a key role in encouraging employee autonomy. We believe owning it inspires employees to build skillsets within their roles, carve out career paths, and gain valuable leadership tools. \"Own It\" highlights the need to exercise responsibility and accountability."),
        c("star", "teal", "Have Fun", "\"Have Fun\" means we enjoy working together and cultivating an enjoyable work environment for all. Our passion for what we do is visible throughout the organization. Anything we enjoy, we're naturally going to do better, so we make our job something we look forward to, rather than simply a responsibility."),
      ],
    }),
  perks: z
    .object({
      enabled: z.boolean(),
      title: line(80).min(1),
      intro: line(800),
      items: z.array(card).max(12),
    })
    .default({
      enabled: true,
      title: "Benefits",
      intro:
        "Every organization is unique. Instead of assuming which benefits matter most to our team, we ask directly through employee surveys. That way, this list can evolve to ensure RohtreMedia remains one of the best places to work. Please note, benefits may also vary by country.",
      items: [
        c("heart", "pink", "Well-Being & Support", "We aim to keep work human, respectful, and sustainable."),
        c("trend", "blue", "Future-Focused", "We plan thoughtfully and use resources wisely for lasting impact."),
        c("target", "orange", "Outcomes Over Hours", "We focus on results and clear goals rather than busywork."),
        c("leaf", "green", "Sustainable Pace", "We try to plan sanely so great work can happen consistently."),
        c("globe", "sky", "Work, Wherever You Thrive", "We collaborate across locations; teams choose what works best."),
        c("users", "violet", "People-First Mindset", "We aim to keep work human, respectful, and collaborative."),
        c("book", "amber", "Learn Together", "We share knowledge, review work, and improve as a team."),
        c("network", "teal", "Community & Belonging", "Different backgrounds, shared purpose, supportive environment."),
        c("growth", "indigo", "Ownership & Impact", "You'll have responsibility and the chance to move the needle."),
      ],
    }),
  faq: z
    .object({
      enabled: z.boolean(),
      eyebrow: line(40),
      title: line(160).min(1),
      items: z.array(z.object({ q: line(200).min(1), a: line(1200).min(1) })).max(30),
    })
    .default({
      enabled: true,
      eyebrow: "FAQ'S",
      title: "What do you want to know about the hiring process at ROHTREMEDIA?",
      items: [
        { q: "What is the main selection criteria?", a: "We focus on your ability to complete the assigned task within the given deadline. Speed, creativity, and attention to detail matter most." },
        { q: "Do I need prior experience to apply?", a: "Not always. We value skills and dedication over just experience. If you can prove yourself through the task, you stand a good chance." },
        { q: "How does the hiring process work?", a: "Step 1: Apply.\nStep 2: Shortlisted candidates receive a task.\nStep 3: Submit the task within the deadline.\nStep 4: If selected, we'll schedule an interview/discussion." },
        { q: "What type of tasks can I expect?", a: "Tasks depend on the role. For creative roles, it could be editing, design, or content samples. For HR/BD roles, it may involve outreach, research, or strategy assignments." },
        { q: "How quickly will I know the results?", a: "Usually within 2-3 working days after task submission. We try to be quick, but timelines may vary depending on the role." },
        { q: "Do you provide remote opportunities?", a: "Yes. Many of our roles and internships are remote, unless specifically mentioned otherwise." },
        { q: "How important is meeting deadlines?", a: "Very important. At Rohtre Media, deadlines define reliability. Missing them without reason can reduce your chances of selection." },
        { q: "Do you consider freshers?", a: "Yes. If you're skilled, eager to learn, and can prove yourself with the task, we welcome you." },
        { q: "What qualities do you look for in candidates?", a: "Accountability, adaptability, speed, creativity, and willingness to take ownership." },
        { q: "Will I get a certificate/experience letter?", a: "Yes. Interns and employees completing their tenure or project successfully receive official recognition." },
      ],
    }),
  cta: z
    .object({
      eyebrow: line(40),
      title: line(80).min(1),
      accent: line(80),
      text: line(200),
      label: line(40).min(1),
      animated: z.boolean(),
    })
    .default({
      eyebrow: "Careers",
      title: "Ready to join",
      accent: "RohTre Media?",
      text: "Tell us about yourself and we'll get back to you.",
      label: "Apply Now",
      animated: true,
    }),
  /** The application form's choices (public: the form shows them). HR emails are private (careers_private). */
  form: z
    .object({
      roles: z.array(line(60).min(1)).min(1).max(30),
      experience: z.array(line(30).min(1)).min(1).max(10),
      success: line(200).min(1),
    })
    .default({
      roles: [
        "Social Media Management",
        "Meta Ads",
        "Google Ads",
        "Video Editing",
        "AI Automation Engineering",
        "Graphic Design",
        "Data Management",
      ],
      experience: ["Fresher", "Under 1 year", "1-2 years", "2-3 years", "3-5 years", "5+ years"],
      success: "Thanks, our HR team will contact you.",
    }),
});

export type CareersContent = z.infer<typeof careersSchema>;

export const DEFAULT_CAREERS: CareersContent = careersSchema.parse({});

/** Parse stored JSON section by section, so one bad section never wipes the others. */
export function parseCareers(raw: unknown): CareersContent {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(careersSchema.shape) as (keyof CareersContent)[]) {
    const parsed = careersSchema.shape[key].safeParse(input[key]);
    out[key] = parsed.success ? parsed.data : DEFAULT_CAREERS[key];
  }
  return out as CareersContent;
}

/** The two application categories (fixed; the form's segmented toggle). */
export const CAREER_CATEGORIES = ["Internship", "Full-time"] as const;
