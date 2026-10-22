"use client";

import { useState } from "react";
import { Select } from "@/components/admin/select";
import { INPUT_CLASS } from "@/components/admin/ui";
import { BrandIcon } from "@/components/brand-icons";
import {
  SOCIAL_EXAMPLES,
  SOCIAL_LABELS,
  SOCIAL_NETWORKS,
  socialHostWarning,
  socialUrlError,
  type SocialLink,
} from "@/lib/social-links";

// Settings → Social links: one row per link (platform, link, shown/hidden,
// up/down, delete with a confirm click) and "+ Add social link". Posted with
// the settings form as socials.{i}.network / .url / .enabled + socialsCount
// (the platform through the Select's hidden input); the server checks every
// link again (https only).

const ROUND =
  "grid size-11 shrink-0 place-items-center rounded-full bg-chip text-sm hover:bg-chip-hover disabled:opacity-40";

export function SocialLinksField({ initial, onDirty }: { initial: SocialLink[]; onDirty: () => void }) {
  const [rows, setRows] = useState(initial);
  const [confirm, setConfirm] = useState<number | null>(null);
  const set = (next: SocialLink[]) => {
    setRows(next);
    setConfirm(null);
    onDirty();
  };
  const patch = (i: number, p: Partial<SocialLink>) => set(rows.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const move = (i: number, d: number) => {
    const next = [...rows];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    set(next);
  };
  const unused = SOCIAL_NETWORKS.filter((n) => !rows.some((r) => r.network === n));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-fg-2">
          Icons show at the end of the footer. A link shows only when it’s switched on and starts with https://.
        </p>
        <button
          type="button"
          disabled={unused.length === 0}
          onClick={() => set([...rows, { network: unused[0], url: null, enabled: true }])}
          className="min-h-11 rounded-full bg-chip px-4 text-sm font-semibold hover:bg-chip-hover disabled:opacity-50"
        >
          + Add social link
        </button>
      </div>
      <input type="hidden" name="socialsCount" value={rows.length} />
      {rows.length === 0 && <p className="text-sm text-fg-2">No social links: the footer shows no icons.</p>}
      <ul className="flex flex-col gap-2">
        {rows.map((r, i) => {
          // Same check as the server (src/lib/social-links.ts), live while typing.
          const error = socialUrlError(r.network, r.url);
          const warning = error ? null : socialHostWarning(r.network, r.url);
          const name = SOCIAL_LABELS[r.network];
          return (
            <li key={i} className={`rounded-2xl border bg-bg p-3 ${error ? "border-danger" : "border-line"}`}>
              <div className="grid items-center gap-2 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto]">
                <Select
                  name={`socials.${i}.network`}
                  aria-label={`Platform for link ${i + 1}`}
                  value={r.network}
                  onChange={(v) => patch(i, { network: v as SocialLink["network"] })}
                  options={SOCIAL_NETWORKS.map((n) => ({
                    value: n,
                    label: SOCIAL_LABELS[n],
                    icon: <BrandIcon network={n} size={18} />,
                    disabled: n !== r.network && rows.some((x) => x.network === n),
                  }))}
                />
                <input
                  name={`socials.${i}.url`}
                  type="url"
                  inputMode="url"
                  aria-label={`${name} link`}
                  aria-invalid={error ? true : undefined}
                  placeholder={SOCIAL_EXAMPLES[r.network]}
                  value={r.url ?? ""}
                  onChange={(e) => patch(i, { url: e.target.value || null })}
                  className={`${INPUT_CLASS} min-h-12`}
                />
                <div className="flex items-center gap-1.5">
                  <label className="mr-1 flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      role="switch"
                      name={`socials.${i}.enabled`}
                      checked={r.enabled}
                      onChange={(e) => patch(i, { enabled: e.target.checked })}
                      className="size-5 accent-[var(--brand)]"
                    />
                    {r.enabled ? "Shown" : "Hidden"}
                  </label>
                  <button
                    type="button"
                    className={ROUND}
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    aria-label={`Move ${name} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={ROUND}
                    disabled={i === rows.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label={`Move ${name} down`}
                  >
                    ↓
                  </button>
                  {confirm === i ? (
                    <button
                      type="button"
                      autoFocus
                      onClick={() => set(rows.filter((_, j) => j !== i))}
                      onBlur={() => setConfirm(null)}
                      className="h-11 rounded-full bg-brand px-3 text-xs font-bold text-brand-fg"
                    >
                      Delete?
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={ROUND}
                      onClick={() => setConfirm(i)}
                      aria-label={`Delete ${name} link`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              {error ? (
                <p className="mt-2 text-xs font-medium text-danger">{error}</p>
              ) : warning ? (
                <p
                  role="status"
                  className="mt-2 rounded-xl bg-[color-mix(in_srgb,#f5a524_18%,transparent)] px-3 py-2 text-xs"
                >
                  {warning}
                </p>
              ) : (
                <p className="mt-2 text-xs text-fg-2">For example {SOCIAL_EXAMPLES[r.network]}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
