import { lineage, type DimensionValue } from "./dimensions";

// Proof matching (R18). Case studies, results, testimonials and creatives are
// tagged with dimension values. For a page:
//   - an item matches a dimension type if it has no tag of that type (it is
//     general), or one of its tags is the page's value or an ancestor of it
//     (a "fashion" result matches a "shoes" page; a "d2c-marketing" result
//     matches a "d2c-meta-ads" page);
//   - an item must match every dimension type to be shown;
//   - more specific matches rank first (exact > ancestor > untagged), then
//     the item's own sort order.
// Pure, so the admin can preview what matched and the tests can pin it down.

export type Tagged = { id: string; sort: number; tagIds: string[] };

export type MatchResult<T> = { item: T; score: number };

export function matchProof<T extends Tagged>(
  items: T[],
  pageValues: DimensionValue[],
  allValues: Map<string, DimensionValue>,
): MatchResult<T>[] {
  const out: MatchResult<T>[] = [];
  for (const item of items) {
    const tags = item.tagIds.map((id) => allValues.get(id)).filter((v): v is DimensionValue => Boolean(v));
    let score = 0;
    let ok = true;
    for (const pageValue of pageValues) {
      const tagsOfType = tags.filter((t) => t.type_key === pageValue.type_key);
      if (tagsOfType.length === 0) continue; // general for this dimension
      const chain = lineage(pageValue, allValues); // page value, then its parents
      const best = Math.min(
        ...tagsOfType.map((t) => {
          const at = chain.findIndex((v) => v.id === t.id);
          return at === -1 ? Infinity : at;
        }),
      );
      if (best === Infinity) {
        ok = false;
        break;
      }
      score += best === 0 ? 3 : 2; // exact beats ancestor
    }
    if (ok) out.push({ item, score });
  }
  return out.sort((a, b) => b.score - a.score || a.item.sort - b.item.sort);
}
