"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Field, SELECT_CLASS } from "@/components/admin/ui";
import { createPage } from "./actions";

type Option = { id: string; label: string };

export function NewPageForm({
  services,
  niches,
  countries,
}: {
  services: Option[];
  niches: Option[];
  countries: Option[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pick, setPick] = useState({ service: "", niche: "", country: "" });

  const select = (key: keyof typeof pick, label: string, options: Option[]) => (
    <Field label={label}>
      <select className={SELECT_CLASS} value={pick[key]} onChange={(e) => setPick({ ...pick, [key]: e.target.value })}>
        <option value="">Choose…</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        {select("service", "Service", services)}
        {select("niche", "Niche", niches)}
        {select("country", "Country", countries)}
      </div>
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
      <Button
        variant="primary"
        className="self-start"
        disabled={pending || !pick.service || !pick.niche || !pick.country}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await createPage(pick.service, pick.niche, pick.country);
            if (res.ok) router.push(`/admin/pages/${res.id}`);
            else setError(res.error);
          })
        }
      >
        {pending ? "Creating…" : "Create draft page"}
      </Button>
    </div>
  );
}
