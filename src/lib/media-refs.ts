// Finds every Cloudinary file a piece of content uses: any string that is
// one of our public_ids (rohtre-media/...). Pure, so it works on page
// sections, home content and table rows alike.

const OURS = /^rohtre-media\/[A-Za-z0-9_./-]+$/;

export function collectMediaIds(value: unknown, into = new Set<string>()): Set<string> {
  if (typeof value === "string") {
    if (OURS.test(value)) into.add(value);
  } else if (Array.isArray(value)) {
    for (const v of value) collectMediaIds(v, into);
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectMediaIds(v, into);
  }
  return into;
}

/** Files used before an edit but not after it. */
export function removedMedia(before: unknown, after: unknown): string[] {
  const now = collectMediaIds(after);
  return [...collectMediaIds(before)].filter((id) => !now.has(id));
}
