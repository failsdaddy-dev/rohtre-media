"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Select } from "@/components/admin/select";
import { Button, Field } from "@/components/admin/ui";
import type { DimensionValue } from "@/lib/dimensions";
import { createPage } from "./actions";
import { ManageOptions } from "./manage-options";
import { OptionForm } from "./option-form";
import type { OptionType } from "./option-actions";

const ADD = "__add";

export function NewPageForm({
  services,
  niches,
  countries,
  canManage,
}: {
  services: DimensionValue[];
  niches: DimensionValue[];
  countries: DimensionValue[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<{ text: string; existingId?: string } | null>(null);
  const [pick, setPick] = useState({ service: "", niche: "", country: "" });
  const [adding, setAdding] = useState<OptionType | null>(null);
  const [managing, setManaging] = useState(false);
  /** Saved just now, until the refreshed list arrives from the server. */
  const [added, setAdded] = useState<DimensionValue[]>([]);

  const lists = { service: services, niche: niches, country: countries };
  const withAdded = (key: OptionType) => [
    ...lists[key],
    ...added.filter((a) => a.type_key === key && !lists[key].some((v) => v.id === a.id)),
  ];
  const chosen = (key: OptionType) => withAdded(key).find((v) => v.id === pick[key]) ?? null;

  const select = (key: OptionType, label: string) => (
    <Field label={label}>
      <Select
        value={pick[key]}
        onChange={(v) => {
          if (v === ADD) setAdding(key);
          else setPick({ ...pick, [key]: v });
        }}
        options={[
          ...withAdded(key)
            .filter((v) => v.active !== false)
            .map((v) => ({ value: v.id, label: v.label })),
          ...(canManage ? [{ value: ADD, label: `+ Add new ${key}`, sticky: true }] : []),
        ]}
        placeholder="Choose…"
      />
    </Field>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        {select("service", "Service")}
        {select("niche", "Niche")}
        {select("country", "Country")}
      </div>
      {adding && (
        <OptionForm
          key={adding}
          type={adding}
          picks={{ service: chosen("service"), niche: chosen("niche"), country: chosen("country") }}
          onCancel={() => setAdding(null)}
          onSaved={(option) => {
            setAdded([...added, option]);
            setPick({ ...pick, [adding]: option.id });
            setAdding(null);
            router.refresh();
          }}
        />
      )}
      {error && (
        <p className="text-sm font-medium text-danger">
          {error.text}{" "}
          {error.existingId && (
            <Link href={`/admin/pages/${error.existingId}`} className="underline underline-offset-2">
              Open it
            </Link>
          )}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          disabled={pending || !pick.service || !pick.niche || !pick.country}
          onClick={() =>
            start(async () => {
              setError(null);
              const res = await createPage(pick.service, pick.niche, pick.country);
              if (res.ok) router.push(`/admin/pages/${res.id}`);
              else setError({ text: res.error, existingId: "existingId" in res ? res.existingId : undefined });
            })
          }
        >
          {pending ? "Creating…" : "Create draft page"}
        </Button>
        {canManage && (
          <Button variant="ghost" onClick={() => setManaging(!managing)} aria-expanded={managing}>
            Manage options
          </Button>
        )}
      </div>
      {managing && <ManageOptions lists={{ service: withAdded("service"), niche: withAdded("niche"), country: withAdded("country") }} />}
    </div>
  );
}
