import type { Metadata } from "next";
import { Awards, ClientQuotes, RecognitionHero, TeamBlock } from "@/components/recognition/recognition-sections";
import { getRecognitionContent } from "@/lib/work-data";

// Recognition. Same content and order as the live page
// (https://rohtremedia.com/recognition-2/): the slider, the award cards, the
// client quotes and the team block, drawn with the site's design system.
// Edited in Admin → Recognition page.

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getRecognitionContent();
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: "/recognition" },
    openGraph: {
      title: `${seo.title} | RohTre Media`,
      description: seo.description,
      url: "/recognition",
      type: "website",
    },
  };
}

export default async function RecognitionPage() {
  const rec = await getRecognitionContent();
  return (
    <>
      <RecognitionHero slides={rec.hero.slides} />
      {rec.awards.enabled && <Awards s={rec.awards} />}
      {rec.clients.enabled && <ClientQuotes s={rec.clients} />}
      {rec.team.enabled && <TeamBlock s={rec.team} />}
    </>
  );
}
