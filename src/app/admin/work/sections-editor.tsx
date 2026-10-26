"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { SaveBar } from "@/components/admin/save-bar";
import { SchemaForm, type Hints, type JsonSchema } from "@/components/admin/schema-form";
import { Select } from "@/components/admin/select";
import { Button } from "@/components/admin/ui";
import { ServiceIcon } from "@/components/icons";

// The Work and Recognition page editors: the About editor's pattern (a rail
// of the page's sections, a dropdown below 1024 px; the chosen section's
// fields from the generic schema form; the save bar). A section can instead
// be a custom panel (`panel`, e.g. the Brands manager), saved on its own.

export type EditorSection = {
  key: string;
  name: string;
  icon: string;
  about: string;
  /** A custom panel instead of the section's fields (not part of the page save). */
  panel?: ReactNode;
};

type Saved = { ok: true } | { ok: false; error: string; fieldErrors: Record<string, string> };

export function SectionsEditor<T extends Record<string, unknown>>({
  initial,
  schemas,
  sections,
  hints,
  tabHints,
  pagePath,
  pageName,
  save,
}: {
  initial: T;
  schemas: Record<string, JsonSchema>;
  sections: EditorSection[];
  hints: Hints;
  tabHints: Record<string, Hints>;
  pagePath: string;
  pageName: string;
  save: (data: T) => Promise<Saved>;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState<T>(initial);
  const [data, setData] = useState<T>(initial);
  const [tab, setTab] = useState(sections[0].key);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const current = sections.find((s) => s.key === tab)!;
  const schema = schemas[tab];
  const value = data[tab] as unknown;
  const enabledSwitch = Boolean(schema?.properties?.enabled);
  const shown = (k: string) => (data[k] as { enabled?: boolean } | undefined)?.enabled !== false;
  const hasErrors = (k: string) => Object.keys(errors).some((p) => p === k || p.startsWith(`${k}.`));
  const tabErrors = Object.fromEntries(
    Object.entries(errors)
      .filter(([p]) => p === tab || p.startsWith(`${tab}.`))
      .map(([p, v]) => [p.slice(tab.length + 1), v]),
  );
  const update = (v: unknown) => {
    setData({ ...data, [tab]: v });
    setDirty(true);
    setMessage(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <label className="flex flex-col gap-1.5 text-sm lg:hidden">
          <span className="font-semibold">Section</span>
          <Select
            value={tab}
            onChange={(v) => setTab(v)}
            options={sections.map((s, i) => ({
              value: s.key,
              label: `${i + 1}. ${s.name}${shown(s.key) ? "" : " (hidden)"}`,
              icon: <ServiceIcon name={s.icon} size={17} />,
            }))}
          />
        </label>
        <nav
          aria-label={`${pageName} sections`}
          className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-[18px] border border-line bg-bg-elev p-2 lg:block"
        >
          <ul className="flex flex-col gap-0.5">
            {sections.map((s) => {
              const on = s.key === tab;
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => setTab(s.key)}
                    aria-current={on ? "true" : undefined}
                    className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-sm ${
                      on ? "bg-chip-on-bg font-semibold text-chip-on-fg" : "hover:bg-chip-hover"
                    } ${hasErrors(s.key) && !on ? "text-danger" : ""}`}
                  >
                    <ServiceIcon name={s.icon} size={17} className="shrink-0 opacity-80" />
                    <span className="min-w-0 flex-1 truncate">{s.name}</span>
                    {!s.panel && (
                      <>
                        <span
                          aria-hidden="true"
                          className={`size-2 shrink-0 rounded-full ${shown(s.key) ? "bg-[#1f9d4c]" : "bg-[#9a9a9a]"}`}
                        />
                        <span className="sr-only">{shown(s.key) ? "shown" : "hidden"}</span>
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <section aria-labelledby="section-name" className="flex min-w-0 flex-col gap-4">
          <header className="flex flex-wrap items-start justify-between gap-4 rounded-[18px] border border-line bg-bg-elev p-5 sm:p-6">
            <div className="min-w-0 flex-1 basis-72">
              <h2 id="section-name" className="text-xl font-bold tracking-[-0.01em]">
                {current.name}
              </h2>
              <p className="mt-1 text-sm text-fg-2">{current.about}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {current.panel ? null : enabledSwitch ? (
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-full border border-line px-4 text-sm font-semibold">
                  <input
                    type="checkbox"
                    role="switch"
                    className="size-5 accent-[var(--brand)]"
                    checked={(value as { enabled?: boolean }).enabled !== false}
                    onChange={(e) => update({ ...(value as object), enabled: e.target.checked })}
                  />
                  Show this section
                </label>
              ) : (
                <span className="text-sm text-fg-2">Always shown</span>
              )}
              <a
                href={pagePath}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-11 items-center rounded-full bg-chip px-4 text-sm font-semibold hover:bg-chip-hover"
              >
                View on site ↗
              </a>
            </div>
          </header>

          {current.panel ?? (
            <div className="rounded-[18px] border border-line bg-bg-elev p-5 sm:p-6">
              <SchemaForm
                key={tab}
                schema={
                  schema.properties?.enabled
                    ? {
                        ...schema,
                        properties: Object.fromEntries(
                          Object.entries(schema.properties).filter(([k]) => k !== "enabled"),
                        ),
                      }
                    : schema
                }
                value={value}
                onChange={update}
                hints={{ ...hints, ...tabHints[tab], enabled: { hidden: true } }}
                errors={tabErrors}
              />
            </div>
          )}
        </section>
      </div>

      <SaveBar
        dirty={dirty}
        pending={pending}
        message={message}
        idle={`Saved. Changes go live on the ${pageName} when you save.`}
        onDiscard={() => {
          setData(saved);
          setErrors({});
          setDirty(false);
          setMessage(null);
        }}
      >
        <Button
          variant="primary"
          disabled={pending || !dirty}
          onClick={() =>
            start(async () => {
              const res = await save(data);
              if (res.ok) {
                setErrors({});
                setDirty(false);
                setSaved(data);
                setMessage({ tone: "ok", text: `Saved. The ${pageName} is updated.` });
                router.refresh();
              } else {
                setErrors(res.fieldErrors);
                setMessage({ tone: "error", text: res.error });
              }
            })
          }
        >
          Save {pageName}
        </Button>
      </SaveBar>
    </div>
  );
}
