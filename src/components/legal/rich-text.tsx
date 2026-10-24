import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { LINK_RE } from "@/content/legal-schema";

// Renders legal-page text: plain text with **bold**, *italic*,
// [link text](url) and line breaks. Nothing else is interpreted, and React
// escapes all text, so no HTML can reach the page. Links that don't pass the
// allow-list are shown as plain text. External links open in a new tab with
// rel="noopener noreferrer".

const TOKEN = /\*\*(.+?)\*\*|\*([^*\s](?:[^*]*?[^*\s])?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function LegalLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  if (href.startsWith("/") || href.startsWith("#"))
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  const external = href.startsWith("https://");
  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const k = `${key}-${n++}`;
    if (m[1] !== undefined) out.push(<strong key={k}>{inline(m[1], k)}</strong>);
    else if (m[2] !== undefined) out.push(<em key={k}>{inline(m[2], k)}</em>);
    else if (LINK_RE.test(m[4]))
      out.push(
        <LegalLink key={k} href={m[4]}>
          {inline(m[3], k)}
        </LegalLink>,
      );
    else out.push(m[3]);
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {inline(line, String(i))}
        </Fragment>
      ))}
    </>
  );
}

/** The text without its marks (for headings in the table of contents). */
export const plainText = (text: string) =>
  text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
