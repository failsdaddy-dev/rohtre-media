import { z } from "zod";
import { AD_ICONS, mediaSchema, TINTS } from "./home-schema";
import { emptySlot, slotSchema } from "./media-slot";

// The About page (R33), edited in Admin → About page and stored like the
// home page: one JSON row in public.page_content (key "about"). Every field
// has a default, so the page renders before anything is saved. The words
// are the live page's (https://rohtremedia.com/about/, read 2026-10-23),
// kept exactly as written, typos included, until the founder changes them.

const line = (max: number) => z.string().max(max);
/** Internal links ("/contact"), anchors ("#team") or https links only. */
const href = z.string().regex(/^(\/|#|https:\/\/)/, "Start with /, # or https://");
const icon = z.enum(AD_ICONS);
/** Same as BOOK_CALL_HREF in the site header. */
const BOOK_CALL_HREF = "/contact#enquiry";

/** The wide founder photo: one image, cropped per screen around `focusX` (0 = left edge, 100 = right edge). */
const storyImage = slotSchema(["12:5"]);

export const aboutSchema = z.object({
  seo: z
    .object({ title: line(70).min(1), description: line(170).min(1) })
    .default({
      title: "About",
      description:
        "Led by Rohan Trehan — digital growth consultant driving billions of views and record-breaking engagement.",
    }),
  hero: z
    .object({
      eyebrow: line(40),
      title: line(120).min(1),
      accent: line(80),
      intro: line(300),
      primaryLabel: line(30).min(1),
      primaryHref: href,
      secondaryLabel: line(30),
      secondaryHref: href,
      image: storyImage,
      focusX: z.number().int().min(0).max(100).default(67),
    })
    .default({
      eyebrow: "About us",
      title: "Built on creative vision and",
      accent: "digital mastery.",
      intro: "Led by Rohan Trehan — digital growth consultant driving billions of views and record-breaking engagement.",
      primaryLabel: "Learn more",
      primaryHref: "/contact",
      secondaryLabel: "Hire us",
      secondaryHref: BOOK_CALL_HREF,
      image: {
        ...emptySlot("12:5", "image"),
        publicId: "rohtre-media/images/about/rohan-trehan-youtube-stage",
        format: "webp",
        alt: "Rohan Trehan, founder of RohTre Media, on a YouTube stage holding a Social Media Summit & Awards bag",
      },
      focusX: 67,
    }),
  highlights: z
    .object({
      enabled: z.boolean(),
      items: z.array(z.object({ value: line(16).min(1), text: line(200) })).max(6),
    })
    .default({
      enabled: true,
      items: [
        { value: "+2B", text: "views generated for our clients’ YouTube channels – driving unmatched visibility and engagement." },
        { value: "+5M", text: "subscribers gained for creators we’ve worked with, across multiple niches and platforms." },
        { value: "+10M mins", text: "of average monthly watch time delivered through optimized, high-retention content strategies." },
        { value: "+₹25Cr", text: "in combined revenue impact for brands and creators powered by our marketing and content expertise." },
      ],
    }),
  intro: z
    .object({ eyebrow: line(40), title: line(140).min(1), body: line(1200) })
    .default({
      eyebrow: "We",
      title: "We raise the bar for what a marketing agency should be.",
      body: "RohTreMedia is the growth partner you’ve been looking for, whether you’re a creator, a small business, or a global brand. We create powerful systems, innovative strategies, and scalable teams that drive real results. For startups, we build fast-growth roadmaps, and for established enterprises, we execute with precision at scale. No matter where you are in your journey, we’ve got the blueprint to help you go further, faster",
    }),
  values: z
    .object({
      enabled: z.boolean(),
      items: z
        .array(z.object({ icon, tint: z.enum(TINTS), title: line(60).min(1), text: line(400) }))
        .max(6),
    })
    .default({
      enabled: true,
      items: [
        {
          icon: "megaphone",
          tint: "coral",
          title: "Disrupt the Norm",
          text: "We don’t follow trends-we set them.Every strategy we build is designed to break through the noise, challenge the status quo, and put our clients ahead of the curve.",
        },
        {
          icon: "target",
          tint: "blue",
          title: "Execute Relentlessly",
          text: "Ideas are only as good as their executuion. We operate with precision, speed, and accountability-turning bold concepts into measurable wins, again and again.",
        },
        {
          icon: "growth",
          tint: "green",
          title: "Play to Win",
          text: "We treat every project like a championship match-high energy, creative flair and the drive to outperform the competition. when we win, our clients win bigger.",
        },
      ],
    }),
  numbers: z
    .object({
      enabled: z.boolean(),
      items: z
        .array(z.object({ icon, value: line(16).min(1), label: line(40).min(1), text: line(200) }))
        .max(6),
    })
    .default({
      enabled: true,
      items: [
        {
          icon: "sparkles",
          value: "+15",
          label: "INDUSTRY AWARDS",
          text: "Recognized for breakthrough content strategies, high-performing campaigns, and creative excellence across platforms.",
        },
        {
          icon: "users",
          value: "+200",
          label: "CLIENTS SERVED",
          text: "From YouTube creators to global brands—long-term partnerships built on trust, results, and innovation.",
        },
        {
          icon: "eye",
          value: "+80M",
          label: "HOURS WATCHED",
          text: "Driving massive audience engagement with content that hooks, entertains, and converts.",
        },
        {
          icon: "play",
          value: "5",
          label: "GLOBAL TEAMS",
          text: "Remote-first, performance-driven teams delivering results across multiple time zones.",
        },
      ],
    }),
  diversity: z
    .object({
      enabled: z.boolean(),
      eyebrow: line(40),
      title: line(140).min(1),
      body: line(1200),
      highlight: line(200),
      body2: line(1200),
      ctaLabel: line(30),
      ctaHref: href,
      bars: z.array(z.object({ label: line(60).min(1), percent: z.number().int().min(0).max(100) })).max(10),
    })
    .default({
      enabled: true,
      eyebrow: "DIVERSITY & INCLUSION",
      title: "We’re creator-founded and performance-driven.",
      body: "We’ve built a team where creativity meets execution—uniting strategists, editors, designers, and marketers from around the globe. Our culture thrives on diversity of thought, skill, and perspective, giving us the edge to craft content and campaigns that outperform the competition.",
      highlight: "We believe great ideas come from everywhere.",
      body2:
        "That’s why we hire talent from all backgrounds, industries, and countries, ensuring our clients benefit from a blend of insights and innovation that’s impossible to replicate.",
      ctaLabel: "We're Hiring",
      ctaHref: "/careers",
      bars: [
        { label: "Video Production Experts", percent: 35 },
        { label: "Marketing Strategies", percent: 25 },
        { label: "Design & Animation", percent: 20 },
        { label: "Content Writers & Researchers", percent: 15 },
        { label: "Ops & Management", percent: 5 },
      ],
    }),
  review: z
    .object({
      enabled: z.boolean(),
      eyebrow: line(40),
      title: line(140).min(1),
      body: line(1200),
      /** Landscape 19:10 video (or image); plays with controls, never autoplays. */
      video: slotSchema(["19:10"]),
    })
    .default({
      enabled: true,
      eyebrow: "YEAR IN REVIEW",
      title: "Another year of record-breaking growth.",
      body: "2024 was a milestone year for RohTreMedia—expanding our client base, scaling creator channels to millions of subscribers, and delivering campaigns that set new performance benchmarks. From pioneering AI-powered content pipelines to securing high-profile collaborations, we’ve turned vision into measurable wins across every project.",
      video: { ...emptySlot("19:10", "video"), loop: false },
    }),
  team: z
    .object({
      eyebrow: line(40),
      title: line(140).min(1),
      intro: line(600),
      leadershipTitle: line(60),
      leader: z.object({ name: line(60).min(1), role: line(60), photo: mediaSchema.nullable() }),
      membersTitle: line(60),
      members: z
        .array(
          z.object({
            name: line(60).min(1),
            role: line(60),
            photo: mediaSchema.nullable(),
            bio: line(280),
          }),
        )
        .max(24),
    })
    .default({
      eyebrow: "TEAM",
      title: "People at ROHTRE Media",
      intro:
        "At RohtreMedia, our people set us apart. Behind every job title is a whole person—bringing perspective, passion, and craft that shape our work, our values, and the vision we share with our clients.",
      leadershipTitle: "Global Executive Leadership",
      leader: {
        name: "Rohan Trehan",
        role: "CEO & Consultant",
        photo: { publicId: "rohtre-media/images/team/rohan-trehan", width: 400, height: 400 },
      },
      membersTitle: "Meet Our Team",
      members: [
        {
          name: "Himesh Chaurasia",
          role: "Human Resource Department",
          photo: { publicId: "rohtre-media/images/team/himesh-chaurasia", width: 1024, height: 1024 },
          bio: "",
        },
        {
          name: "Mrunal",
          role: "Back-End Engineer",
          photo: { publicId: "rohtre-media/images/team/mrunal", width: 400, height: 400 },
          bio: "",
        },
        {
          name: "Harshil",
          role: "Back-End Engineer",
          photo: { publicId: "rohtre-media/images/team/harshil", width: 800, height: 800 },
          bio: "",
        },
      ],
    }),
  cta: z
    .object({ eyebrow: line(40), title: line(80).min(1), accent: line(80), text: line(200), label: line(40).min(1) })
    .default({ eyebrow: "RohTre Media", title: "Ready to unlock growth", accent: "Let’s talk!", text: "", label: "Book a Call" }),
});

export type AboutContent = z.infer<typeof aboutSchema>;

export const DEFAULT_ABOUT: AboutContent = aboutSchema.parse({});

/** Parse stored JSON section by section, so one bad section never wipes the others. */
export function parseAbout(raw: unknown): AboutContent {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(aboutSchema.shape) as (keyof AboutContent)[]) {
    const parsed = aboutSchema.shape[key].safeParse(input[key]);
    out[key] = parsed.success ? parsed.data : DEFAULT_ABOUT[key];
  }
  return out as AboutContent;
}
