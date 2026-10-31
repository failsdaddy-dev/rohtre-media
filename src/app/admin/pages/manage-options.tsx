"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Button, INPUT_CLASS } from "@/components/admin/ui";
import { isCustomValue, type DimensionValue } from "@/lib/dimensions";
import { deleteOption, moveOption, setOptionActive, type OptionType } from "./option-actions";
import { OptionForm } from "./option-form";

// "Manage options": one list at a time (Services, Niches or Countries) with
// search, rename, hide, reorder and delete. Delete is only offered for custom
// options; the server refuses it while a page or a proof tag uses the option.

const TABS: { type: OptionType; title: string }[] = [
  { type: "service", title: "Services" },
  { type: "niche", title: "Niches" },
  { type: "country", title: "Countries" },
];

type Run = (action: () => Promise<{ ok: boolean; error?: string }>) => void;

function Action({ className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={`rm-press inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-semibold enabled:hover:bg-hover disabled:cursor-not-allowed disabled:opacity-35 ${className}`}
    />
  );
}

function Arrow({ up }: { up?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={up ? "rotate-180" : ""}
    >
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  );
}

function Tag({ children, tone }: { children: ReactNode; tone: "custom" | "muted" }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        tone === "custom" ? "bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-brand" : "bg-chip text-fg-2"
      }`}
    >
      {children}
    </span>
  );
}

function Row({
  value,
  first,
  last,
  canMove,
  pending,
  run,
}: {
  value: DimensionValue;
  first: boolean;
  last: boolean;
  canMove: boolean;
  pending: boolean;
  run: Run;
}) {
  const [renaming, setRenaming] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();
  const custom = isCustomValue(value);
  const hidden = value.active === false;
  if (renaming)
    return (
      <li className="py-2">
        <OptionForm
          type={value.type_key as OptionType}
          editing={value}
          onCancel={() => setRenaming(false)}
          onSaved={() => {
            setRenaming(false);
            router.refresh();
          }}
        />
      </li>
    );
  return (
    <li className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-[10px] px-3 py-1.5 hover:bg-hover">
      <span className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
        <span className={hidden ? "text-fg-2" : "font-semibold"}>{value.label}</span>
        {custom && <Tag tone="custom">Custom</Tag>}
        {hidden && <Tag tone="muted">Hidden</Tag>}
      </span>
      {confirming ? (
        <span className="flex items-center gap-1 text-xs">
          <span className="mr-1 text-fg-2">Delete for good?</span>
          <Action
            disabled={pending}
            className="bg-brand text-brand-fg enabled:hover:bg-brand enabled:hover:opacity-90"
            onClick={() => {
              setConfirming(false);
              run(() => deleteOption(value.id));
            }}
          >
            Delete
          </Action>
          <Action onClick={() => setConfirming(false)}>Keep</Action>
        </span>
      ) : (
        <span className="flex items-center gap-0.5">
          {canMove && (
            <>
              <Action
                aria-label={`Move ${value.label} up`}
                title="Move up"
                className="w-8 !px-0"
                disabled={pending || first}
                onClick={() => run(() => moveOption(value.id, "up"))}
              >
                <Arrow up />
              </Action>
              <Action
                aria-label={`Move ${value.label} down`}
                title="Move down"
                className="w-8 !px-0"
                disabled={pending || last}
                onClick={() => run(() => moveOption(value.id, "down"))}
              >
                <Arrow />
              </Action>
            </>
          )}
          <Action className="w-[72px]" onClick={() => setRenaming(true)}>
            Rename
          </Action>
          <Action
            className="w-[60px]"
            disabled={pending}
            onClick={() => run(() => setOptionActive(value.id, hidden))}
          >
            {hidden ? "Show" : "Hide"}
          </Action>
          {/* Same width with or without Delete, so the columns line up. */}
          <span className="w-[64px]">
            {custom && (
              <Action className="w-full text-danger" onClick={() => setConfirming(true)}>
                Delete
              </Action>
            )}
          </span>
        </span>
      )}
    </li>
  );
}

export function ManageOptions({
  lists,
  onAdd,
}: {
  lists: Record<OptionType, DimensionValue[]>;
  onAdd: (type: OptionType) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<OptionType>("service");
  const [search, setSearch] = useState("");
  const run: Run = (action) =>
    start(async () => {
      setError(null);
      const res = await action();
      if (res.ok) router.refresh();
      else setError(res.error ?? "Couldn’t save that change.");
    });

  const all = lists[tab];
  const query = search.trim().toLowerCase();
  const shown = query ? all.filter((v) => v.label.toLowerCase().includes(query)) : all;

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-line bg-bg p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Option type" className="flex gap-1">
          {TABS.map(({ type, title }) => (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={tab === type}
              onClick={() => {
                setTab(type);
                setSearch("");
                setError(null);
              }}
              className={`rm-press inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${
                tab === type ? "bg-chip-on-bg text-chip-on-fg" : "bg-chip hover:bg-chip-hover"
              }`}
            >
              {title}
              <span className="text-xs font-medium opacity-65">{lists[type].length}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${TABS.find((t) => t.type === tab)?.title.toLowerCase()}…`}
          aria-label="Search options"
          className={`${INPUT_CLASS} !w-auto min-w-44 flex-1 !py-1.5`}
        />
        <Button onClick={() => onAdd(tab)}>Add new {tab}</Button>
      </div>
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
      {shown.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-fg-2">Nothing matches “{search.trim()}”.</p>
      ) : (
        <ul data-lenis-prevent="" className="flex max-h-[420px] flex-col overflow-y-auto overscroll-contain">
          {shown.map((value, i) => (
            <Row
              key={value.id}
              value={value}
              first={i === 0}
              last={i === all.length - 1}
              canMove={!query}
              pending={pending}
              run={run}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
