import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import {
  autoColor,
  autoIcon,
  headingId,
  LEGAL_COLORS,
  LEGAL_PAGES,
  type Block,
  type LegalPage,
  type LegalSection,
  type LegalSlug,
} from "@/content/legal-schema";
import { getLegalPage } from "@/lib/legal-data";
import { OG_IMAGES } from "@/lib/seo";
import { ArrowRightIcon, LockIcon, ServiceIcon } from "../icons";
import { MediaSlot } from "../media/media-slot";
import { Container } from "../page-parts";
import { LegalProgress, LegalToc, type TocItem } from "./legal-client";
import { LegalLink, plainText, RichText } from "./rich-text";

// The one template for the five legal pages (route files in
// src/app/(light-hero)/<slug>/page.tsx only pass their slug). Styles:
// design.css, .rm-legal*.
//   Page:    a soft sky-blue background with diagonal strips behind the whole
//            page; a thin red reading-progress bar under the header.
//   Hero:    the page's own icon tile and accent colour (LEGAL_PAGES), the
//            title, the live page's intro line, a dates pill, and chips to the
//            other four policies.
//   Cards:   every H2 section is a white square card (the Home "Who We Serve"
//            card: .rm-svc red glow and lift on hover / tap / focus) with a
//            red number, a tinted icon tile (section colour, never red) and
//            its heading; the H3 and heading-less sections after it sit
//            inside the same card. Sections before the first H2 form an
//            unnumbered summary card. Cards fade and rise in (the site's
//            [data-reveal]).
//   Contents: sticky desktop panel and a sticky phone/tablet bar, both with
//            scrollspy (legal-client.tsx). Every numbered card is listed.
//   End:     a closing card. A final live section like "Questions about these
//            terms?" with a button becomes it; otherwise "Questions about this
//            policy?". Its extra button goes to /contact (no new claims).
// Everything is server-rendered except the progress bar and contents.
// Reduced motion: no reveal, float, lift or animated bars.

export async function legalMetadata(slug: LegalSlug): Promise<Metadata> {
  const page = await getLegalPage(slug);
  return {
    title: page.seoTitle,
    description: page.seoDescription,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title: `${page.seoTitle} | RohTre Media`,
      description: page.seoDescription,
      url: `/${slug}`,
      type: "website",
      images: OG_IMAGES,
    },
  };
}

function Glyph({ name, size }: { name: string; size: number }) {
  return name === "lock" ? (
    <LockIcon size={size} strokeWidth={1.8} />
  ) : (
    <ServiceIcon name={name} size={size} strokeWidth={1.8} />
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p>
          <RichText text={block.text} />
        </p>
      );
    case "bullets":
    case "numbered": {
      const List = block.type === "bullets" ? "ul" : "ol";
      return (
        <List>
          {block.items.map((item, i) => (
            <li key={i}>
              <RichText text={item} />
            </li>
          ))}
        </List>
      );
    }
    case "table":
      return (
        // Wide tables scroll sideways inside their own box, never the page.
        <div className="rm-legal-table" role="region" aria-label="Table" tabIndex={0}>
          <table>
            {block.header.some(Boolean) && (
              <thead>
                <tr>
                  {block.header.map((h, i) => (
                    <th key={i} scope="col">
                      <RichText text={h} />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c}>
                      <RichText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "button":
      return (
        <p>
          <LegalLink href={block.href} className="rm-legal-button">
            {block.label}
          </LegalLink>
        </p>
      );
    case "media":
      return block.media.publicId ? (
        <figure className="rm-legal-media">
          <MediaSlot slot={block.media} sizes="(min-width: 1024px) 760px, 100vw" />
        </figure>
      ) : null;
  }
}

const isNumber = (label: string) => /^\d+$/.test(label.trim());

/** An H3 or heading-less section inside a card. */
function Sub({ s }: { s: LegalSection }) {
  return (
    <div className={s.heading ? "rm-legal-sub" : "rm-legal-cont"}>
      {s.label && <p className="rm-legal-sublabel">{s.label}</p>}
      {s.heading && (
        <h3>
          <RichText text={s.heading} />
        </h3>
      )}
      {s.subtitle && <p className="rm-legal-subtitle">{s.subtitle}</p>}
      {s.blocks.map((b, j) => (
        <BlockView key={j} block={b} />
      ))}
    </div>
  );
}

type Group = { head: LegalSection | null; subs: LegalSection[] };

export async function LegalTemplate({ slug, top }: { slug: LegalSlug; top?: ReactNode }) {
  const page: LegalPage = await getLegalPage(slug);
  const meta = LEGAL_PAGES.find((p) => p.slug === slug)!;
  const others = LEGAL_PAGES.filter((p) => p.slug !== slug);

  // One card per H2; following H3 and heading-less sections join it.
  const groups: Group[] = [];
  for (const s of page.sections) {
    if (s.level === "h2" && s.heading) groups.push({ head: s, subs: [] });
    else if (groups.length === 0) groups.push({ head: null, subs: [s] });
    else groups[groups.length - 1].subs.push(s);
  }
  const lastGroup = groups[groups.length - 1];
  const closing =
    lastGroup?.head &&
    plainText(lastGroup.head.heading).trim().endsWith("?") &&
    lastGroup.head.blocks.some((b) => b.type === "button")
      ? groups.pop()!
      : null;

  const seen = new Map<string, number>();
  const uid = (text: string) => {
    const base = headingId(plainText(text));
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
  let k = 0;
  const cards = groups.map((g) => {
    if (!g.head) return { g, id: "", num: "", color: "", icon: "" };
    const color = (g.head.color && LEGAL_COLORS[g.head.color]) || autoColor(k);
    const icon = g.head.icon || autoIcon(plainText(g.head.heading));
    k += 1;
    return { g, id: uid(g.head.heading), num: String(k).padStart(2, "0"), color, icon };
  });
  const toc: TocItem[] = cards
    .filter((c) => c.id)
    .map((c) => ({ id: c.id, num: c.num, label: plainText(c.g.head!.heading), color: c.color }));
  const hasToc = toc.length >= 2;
  const dates = [page.effective && `Effective ${page.effective}`, page.updated && `Last updated ${page.updated}`].filter(
    Boolean,
  );

  return (
    <div className="rm-legal" style={{ "--accent": meta.accent } as CSSProperties}>
      <LegalProgress />

      <section aria-label="Introduction" className="rm-hero-dark rm-legal-hero">
        <Container className="pb-8 pt-8 md:pb-10 md:pt-14">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:gap-6">
            <span aria-hidden="true" className="rm-legal-hero-icon">
              <Glyph name={meta.icon} size={34} />
            </span>
            <div className="min-w-0 max-w-3xl">
              {page.eyebrow && <p className="rm-label mb-3">{page.eyebrow}</p>}
              <h1 className="text-[clamp(1.9rem,5vw,3.4rem)] font-bold leading-[1.06] tracking-[-0.045em] text-[#0a0a0a] [overflow-wrap:anywhere]">
                {page.title}
              </h1>
              {page.intro && (
                <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-[#1f2a3a] md:text-lg">
                  <RichText text={page.intro} />
                </p>
              )}
              {dates.length > 0 && <p className="rm-legal-pill">{dates.join(" · ")}</p>}
            </div>
          </div>
          <nav aria-label="Other policies" className="rm-legal-others">
            <span className="rm-legal-others-title">Other policies</span>
            <ul className="flex flex-wrap gap-2">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link href={`/${o.slug}`} className="rm-legal-chip">
                    <span aria-hidden="true" className="rm-legal-toc-dot" style={{ background: o.accent }} />
                    {o.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </section>

      <Container className="pb-24 lg:pb-28">
        <div className={hasToc ? "grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8" : ""}>
          {hasToc && (
            <aside className="rm-legal-aside hidden lg:block">
              <LegalToc items={toc} variant="panel" />
            </aside>
          )}

          <div className="flex min-w-0 flex-col gap-5 md:gap-6">
            {hasToc && (
              <div className="rm-legal-barwrap lg:hidden">
                <LegalToc items={toc} variant="bar" />
              </div>
            )}

            {top}

            {cards.map(({ g, id, num, color, icon }, i) =>
              g.head ? (
                <section
                  key={i}
                  data-toc-id={id}
                  aria-labelledby={`${id}-title`}
                  data-reveal=""
                  className="rm-svc rm-legal-card"
                  style={{ "--tint": color } as CSSProperties}
                >
                  <span id={id} aria-hidden="true" className="rm-legal-anchor" />
                  <header className="rm-legal-card-head">
                    <span aria-hidden="true" className="rm-legal-icon">
                      <Glyph name={icon} size={24} />
                    </span>
                    <div className="min-w-0">
                      <p className="rm-legal-num">
                        {num}
                        {g.head.label && !isNumber(g.head.label) && <span> · {g.head.label}</span>}
                      </p>
                      <h2 id={`${id}-title`}>
                        <RichText text={g.head.heading} />
                      </h2>
                      {g.head.subtitle && <p className="rm-legal-subtitle">{g.head.subtitle}</p>}
                    </div>
                  </header>
                  <div className="rm-legal-body">
                    {g.head.blocks.map((b, j) => (
                      <BlockView key={j} block={b} />
                    ))}
                    {g.subs.map((s, j) => (
                      <Sub key={j} s={s} />
                    ))}
                  </div>
                </section>
              ) : (
                <section key={i} aria-label="Summary" data-reveal="" className="rm-svc rm-legal-card">
                  <div className="rm-legal-body">
                    {g.subs.map((s, j) => (
                      <Sub key={j} s={s} />
                    ))}
                  </div>
                </section>
              ),
            )}

            <section aria-labelledby="legal-closing" data-reveal="" className="rm-legal-closing">
              <h2 id="legal-closing">
                <RichText text={closing?.head?.heading ?? "Questions about this policy?"} />
              </h2>
              <div className="rm-legal-body">
                {closing?.head?.blocks
                  .filter((b) => b.type !== "button")
                  .map((b, j) => (
                    <BlockView key={j} block={b} />
                  ))}
                {closing?.subs.map((s, j) => (
                  <Sub key={j} s={s} />
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {closing?.head?.blocks
                  .filter((b) => b.type === "button")
                  .map((b, j) =>
                    b.type === "button" ? (
                      <LegalLink key={j} href={b.href} className="rm-legal-button">
                        {b.label}
                      </LegalLink>
                    ) : null,
                  )}
                <Link href="/contact" className="rm-legal-button is-ghost">
                  Contact us <ArrowRightIcon size={18} />
                </Link>
              </div>
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
}
