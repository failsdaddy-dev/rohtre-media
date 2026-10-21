import { resolveHeaderTone, type HeaderTone } from "../lib/header-tone";
import { SECTION_TYPES, type PageContent } from "./schemas";

/**
 * A page takes its header tone from its first enabled section; if that
 * section type declares none (or nothing is enabled), the header is "solid".
 */
export function pageHeaderTone(content: Pick<PageContent, "sections"> | null | undefined): HeaderTone {
  const first = content?.sections.find((s) => s.enabled);
  return resolveHeaderTone(first ? SECTION_TYPES[first.type].headerTone : undefined);
}
