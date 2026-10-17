import type { ReactNode } from "react";
import { Container } from "./page-parts";

// Layout for the Privacy Notice and Terms of Service.

export const LEGAL_UPDATED = "17 October 2026";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <article className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">Legal</p>
          <h1 className="mt-3 text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.02] tracking-[-0.04em]">{title}</h1>
          <p className="mt-3 text-sm text-fg-2">Last updated: {LEGAL_UPDATED}</p>
          <div className="mt-10 flex flex-col gap-4 text-[17px] leading-relaxed text-fg-2 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-[-0.02em] [&_h2]:text-fg [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-fg">
            {children}
          </div>
        </article>
      </Container>
    </section>
  );
}
