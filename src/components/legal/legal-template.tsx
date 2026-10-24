import type { Metadata } from "next";
import { headingId, type Block, type LegalPage, type LegalSlug } from "@/content/legal-schema";
import { getLegalPage } from "@/lib/legal-data";
import { MediaSlot } from "../media/media-slot";
import { Container } from "../page-parts";
import { LegalLink, plainText, RichText } from "./rich-text";

// The one template for the five legal pages (route files in
// src/app/(light-hero)/<slug>/page.tsx only pass their slug). A compact
// sky-blue hero (title, intro, effective / last-updated line when the page
// has one), then a white square-cornered card with a readable column
// (design.css, .rm-legal*). Pages with two or more H2 headings get a table
// of contents: a sticky sidebar from 1024 px, a collapsible "On this page"
// block below. Everything is server-rendered; the only motion is a short
// fade-in (none for reduced motion). Print: header, footer and contents hidden.

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
    },
  };
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

export async function LegalTemplate({ slug }: { slug: LegalSlug }) {
  const page: LegalPage = await getLegalPage(slug);

  // Unique anchor ids for the headings; the contents list uses the H2s.
  const seen = new Map<string, number>();
  const ids = page.sections.map((s) => {
    if (!s.heading) return "";
    const base = headingId(plainText(s.heading));
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  });
  const toc = page.sections
    .map((s, i) => ({ s, id: ids[i] }))
    .filter(({ s, id }) => s.level === "h2" && id)
    .map(({ s, id }) => ({ id, label: [s.label, plainText(s.heading)].filter(Boolean).join(" · ") }));
  const hasToc = toc.length >= 2;
  const dates = [
    page.effective && `Effective ${page.effective}`,
    page.updated && `Last updated ${page.updated}`,
  ].filter(Boolean);

  const tocLinks = (
    <ol className="flex flex-col">
      {toc.map((t) => (
        <li key={t.id}>
          <a href={`#${t.id}`} className="rm-legal-toc-link">
            {t.label}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="rm-legal">
      <section aria-label="Introduction" className="rm-hero-dark rm-hero-sky overflow-hidden">
        <Container className="relative pb-12 pt-10 md:pb-16 md:pt-14">
          <div className="flex max-w-3xl flex-col items-start">
            <p className="rm-label mb-4">{page.eyebrow || "Legal"}</p>
            <h1 className="text-[clamp(2.1rem,5vw,3.6rem)] font-bold leading-[1.05] tracking-[-0.045em] text-[#0a0a0a] [overflow-wrap:anywhere]">
              {page.title}
            </h1>
            {page.intro && (
              <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-[#1f2a3a] md:text-lg">
                <RichText text={page.intro} />
              </p>
            )}
            {dates.length > 0 && <p className="mt-5 text-sm font-semibold text-[#3b4656]">{dates.join(" · ")}</p>}
          </div>
        </Container>
      </section>

      <Container className="py-10 md:py-14 lg:py-16">
        <div className={hasToc ? "grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10" : ""}>
          {hasToc && (
            <aside className="rm-legal-toc hidden lg:block">
              <nav aria-label="On this page" className="sticky top-28">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#5b6472]">On this page</p>
                {tocLinks}
              </nav>
            </aside>
          )}

          <div className="min-w-0">
            {hasToc && (
              <details className="rm-legal-toc rm-legal-toc-mobile mb-5 lg:hidden">
                <summary>On this page</summary>
                <nav aria-label="On this page" className="px-4 pb-3">
                  {tocLinks}
                </nav>
              </details>
            )}

            <div className={`rm-legal-card ${hasToc ? "" : "mx-auto max-w-[880px]"}`}>
              <div className="rm-legal-body">
                {page.sections.map((s, i) => {
                  const H = s.level;
                  return (
                    <section key={i} className={`rm-legal-section is-${s.level}`} aria-labelledby={ids[i] || undefined}>
                      {s.label && <p className="rm-legal-label">{s.label}</p>}
                      {s.heading && (
                        <H id={ids[i]}>
                          <RichText text={s.heading} />
                        </H>
                      )}
                      {s.subtitle && <p className="rm-legal-subtitle">{s.subtitle}</p>}
                      {s.blocks.map((b, j) => (
                        <BlockView key={j} block={b} />
                      ))}
                    </section>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
