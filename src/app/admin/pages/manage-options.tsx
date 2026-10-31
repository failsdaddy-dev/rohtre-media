"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/admin/ui";
import { isCustomValue, type DimensionValue } from "@/lib/dimensions";
import { deleteOption, moveOption, setOptionActive, type OptionType } from "./option-actions";
import { OptionForm } from "./option-form";

// "Manage options": every Service, Niche and Country with rename, hide,
// reorder and delete. Delete is only offered for custom options; the server
// refuses it while a page or a proof tag uses the option.

const TITLES: Record<OptionType, string> = { service: "Services", niche: "Niches", country: "Countries" };

function Row({
  value,
  first,
  last,
  pending,
  run,
}: {
  value: DimensionValue;
  first: boolean;
  last: boolean;
  pending: boolean;
  run: (action: () => Promise<{ ok: boolean; error?: string }>) => void;
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
    <li className="flex flex-wrap items-center justify-between gap-2 py-2">
      <span className={`min-w-0 text-sm ${hidden ? "text-fg-2" : "font-semibold"}`}>
        {value.label}
        <span className="ml-2 text-xs font-normal text-fg-2">
          {custom ? "Custom" : "Built-in"}
          {hidden ? " · Hidden" : ""}
        </span>
      </span>
      <span className="flex flex-wrap items-center gap-1">
        <Button variant="ghost" aria-label={`Move ${value.label} up`} disabled={pending || first} onClick={() => run(() => moveOption(value.id, "up"))}>
          ↑
        </Button>
        <Button variant="ghost" aria-label={`Move ${value.label} down`} disabled={pending || last} onClick={() => run(() => moveOption(value.id, "down"))}>
          ↓
        </Button>
        <Button variant="ghost" onClick={() => setRenaming(true)}>
          Rename
        </Button>
        <Button variant="ghost" disabled={pending} onClick={() => run(() => setOptionActive(value.id, hidden))}>
          {hidden ? "Show" : "Hide"}
        </Button>
        {custom &&
          (confirming ? (
            <>
              <Button
                variant="danger"
                disabled={pending}
                onClick={() => {
                  setConfirming(false);
                  run(() => deleteOption(value.id));
                }}
              >
                Confirm delete
              </Button>
              <Button onClick={() => setConfirming(false)}>Keep</Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setConfirming(true)}>
              Delete
            </Button>
          ))}
      </span>
    </li>
  );
}

export function ManageOptions({ lists }: { lists: Record<OptionType, DimensionValue[]> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (action: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null);
      const res = await action();
      if (res.ok) router.refresh();
      else setError(res.error ?? "Couldn’t save that change.");
    });

  return (
    <div className="flex flex-col gap-4 rounded-[14px] border border-line bg-bg p-4">
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
      {(Object.keys(TITLES) as OptionType[]).map((type) => (
        <section key={type}>
          <h3 className="font-semibold">{TITLES[type]}</h3>
          <ul className="divide-y divide-line">
            {lists[type].map((value, i) => (
              <Row
                key={value.id}
                value={value}
                first={i === 0}
                last={i === lists[type].length - 1}
                pending={pending}
                run={run}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
