"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SaveBar } from "@/components/admin/save-bar";
import { COMMON_HINTS, SchemaForm, type Hints, type JsonSchema } from "@/components/admin/schema-form";
import { Select } from "@/components/admin/select";
import { Button, Field, INPUT_CLASS, Panel } from "@/components/admin/ui";
import type { PublishIssue } from "@/lib/publish-check";
import type { PageContent, Section, SectionType } from "@/sections/schemas";
import {
  checkPage,
  createPreviewLink,
  deletePage,
  duplicateForCountry,
  publish,
  restoreVersion,
  savePage,
  setPageSettings,
  unpublish,
} from "../actions";

// The landing-page editor (R23): meta, then every section with on/off,
// move up/down, layout (variant) and its fields; add a section; save as a
// new draft version. The side panel runs the publish check, publishes,
// makes preview links, changes the URL/visibility, duplicates for another
// country, restores older versions and (owner/developer) deletes the page.

const TYPE_LABELS: Record<SectionType, string> = {
  hero: "Hero + offer banner",
  badges: "Partner badges",
  painPoints: "Pain points",
  results: "Results",
  creatives: "Creatives & reels",
  platforms: "Platforms",
  testimonials: "Testimonials",
  process: "Process",
  faq: "FAQ",
  form: "Enquiry form",
  customHtml: "Custom HTML",
};

const VARIANTS: Record<SectionType, string[]> = {
  hero: ["banner-right", "banner-below"],
  badges: ["bar"],
  painPoints: ["cards", "list"],
  results: ["stack", "grid"],
  creatives: ["images-first", "reels-first"],
  platforms: ["cards"],
  testimonials: ["slider", "grid"],
  process: ["timeline"],
  faq: ["two-column"],
  form: ["split"],
  customHtml: ["contained", "full-width"],
};

const HINTS: Hints = {
  ...COMMON_HINTS,
  h1: { label: "Headline (H1)", help: "Filled from service + niche + country. Edit freely." },
  offerBanner: {
    label: "Offer banner",
    help: "This page’s own banner. The offer and any price live only inside the image (R16).",
  },
  desktop: { label: "Desktop image (about 1200×900)" },
  mobile: { label: "Mobile image (about 1080×1350)" },
  alt: { label: "Alt text (describe the banner)" },
  showConcept: { label: "Also show labelled concept work" },
  limit: { label: "How many to show" },
  html: {
    label: "HTML",
    help: "Sanitized mode removes scripts and embeds. Raw mode (owner/developer only) keeps them.",
  },
  mode: { label: "Mode" },
  status: { label: "Status", help: "Only “ready” answers can be published." },
  defaultInterest: { label: "Pre-selected “Interested in”" },
  cta: { label: "Button at the end of the section", help: "Button text and the small line under it." },
};

type Version = { id: string; number: number; note: string | null; created_at: string };

export function PageEditor(props: {
  page: { id: string; slug: string; status: string; visibility: string; isDraftNewer: boolean };
  initial: PageContent;
  invalidStored: boolean;
  schemas: Record<SectionType, JsonSchema>;
  defaults: Record<string, Section>;
  initialIssues: PublishIssue[];
  versions: Version[];
  badgeOptions: { value: string; label: string }[];
  countries: { id: string; label: string }[];
  canManage: boolean;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [content, setContent] = useState<PageContent>(props.initial);
  const [saved, setSaved] = useState<PageContent>(props.initial);
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [issues, setIssues] = useState(props.initialIssues);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [settings, setSettings] = useState({ slug: props.page.slug, visibility: props.page.visibility });
  const [country, setCountry] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const update = (next: PageContent) => {
    setContent(next);
    setDirty(true);
  };
  const setSection = (i: number, s: Section) =>
    update({ ...content, sections: content.sections.map((x, j) => (j === i ? s : x)) });
  const move = (i: number, d: number) => {
    const list = [...content.sections];
    [list[i], list[i + d]] = [list[i + d], list[i]];
    update({ ...content, sections: list });
  };
  const addSection = (type: SectionType) => {
    const base = structuredClone(props.defaults[type]);
    const taken = new Set(content.sections.map((x) => x.id));
    let n = 2;
    while (taken.has(`${type}-${n}`)) n++;
    const id = `${type}-${n}`;
    const formAt = content.sections.findIndex((s) => s.type === "form");
    const list = [...content.sections];
    list.splice(formAt === -1 ? list.length : formAt, 0, { ...base, id, enabled: true } as Section);
    update({ ...content, sections: list });
    setOpen(id);
  };

  const run = (fn: () => Promise<void>) =>
    start(async () => {
      setMessage(null);
      try {
        await fn();
      } catch (e) {
        setMessage({ tone: "error", text: e instanceof Error ? e.message : "Something went wrong." });
      }
    });

  const save = () =>
    run(async () => {
      const res = await savePage(props.page.id, content, note);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setMessage({ tone: "error", text: res.error });
        return;
      }
      setErrors({});
      setDirty(false);
      setSaved(content);
      setNote("");
      setMessage({ tone: "ok", text: `Saved as version ${res.number}.` });
      setIssues(await checkPage(props.page.id));
      router.refresh();
    });

  const sectionErrors = (i: number) =>
    Object.fromEntries(
      Object.entries(errors)
        .filter(([k]) => k.startsWith(`sections.${i}.props`))
        .map(([k, v]) => [k.replace(`sections.${i}.props.`, "props.").replace(/^props\./, ""), v]),
    );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col gap-5">
        {props.invalidStored && (
          <p className="rounded-xl bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] px-4 py-3 text-sm">
            The saved content no longer matched the section schemas, so the editor started from the master template.
          </p>
        )}
        <Panel title="Search engine text">
          <div className="grid gap-4">
            <Field label={`Meta title (${content.meta.title.length}/70, aim for 50-60)`} error={errors["meta.title"]}>
              <input
                className={INPUT_CLASS}
                maxLength={70}
                value={content.meta.title}
                onChange={(e) => update({ ...content, meta: { ...content.meta, title: e.target.value } })}
              />
            </Field>
            <Field
              label={`Meta description (${content.meta.description.length}/170, aim for 120-160)`}
              error={errors["meta.description"]}
            >
              <textarea
                className={`${INPUT_CLASS} min-h-20`}
                maxLength={170}
                value={content.meta.description}
                onChange={(e) => update({ ...content, meta: { ...content.meta, description: e.target.value } })}
              />
            </Field>
          </div>
        </Panel>

        <section aria-label="Sections" className="flex flex-col gap-3">
          {content.sections.map((s, i) => {
            const isOpen = open === s.id;
            const hasError = Object.keys(errors).some((k) => k.startsWith(`sections.${i}.`));
            return (
              <div
                key={s.id}
                className={`rounded-[18px] border bg-bg-elev ${hasError ? "border-danger" : "border-line"}`}
              >
                <div className="flex flex-wrap items-center gap-2 p-3 pl-4">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : s.id)}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left font-semibold"
                  >
                    <span className="text-fg-2">{isOpen ? "▾" : "▸"}</span>
                    <span className={s.enabled ? "" : "text-fg-2 line-through"}>{TYPE_LABELS[s.type]}</span>
                  </button>
                  {VARIANTS[s.type].length > 1 && (
                    <Select
                      aria-label="Layout"
                      size="sm"
                      value={s.variant}
                      onChange={(v) => setSection(i, { ...s, variant: v } as Section)}
                      options={VARIANTS[s.type].map((v) => ({ value: v, label: v }))}
                    />
                  )}
                  <label className="flex min-w-[5.5rem] cursor-pointer items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      role="switch"
                      className="size-4 accent-[var(--brand)]"
                      checked={s.enabled}
                      onChange={(e) => setSection(i, { ...s, enabled: e.target.checked } as Section)}
                    />
                    {s.enabled ? "On" : "Off"}
                  </label>
                  <Button
                    variant="ghost"
                    className="h-8 px-2.5"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    aria-label="Move up"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-8 px-2.5"
                    disabled={i === content.sections.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label="Move down"
                  >
                    ↓
                  </Button>
                  {s.type !== "hero" && s.type !== "form" && (
                    <Button
                      variant="ghost"
                      className="h-8 px-2.5"
                      aria-label="Remove section"
                      onClick={() => update({ ...content, sections: content.sections.filter((_, j) => j !== i) })}
                    >
                      ✕
                    </Button>
                  )}
                </div>
                {isOpen && (
                  <div className="border-t border-line p-4">
                    <SchemaForm
                      schema={props.schemas[s.type]}
                      value={s.props}
                      onChange={(v) => setSection(i, { ...s, props: v } as Section)}
                      hints={{
                        ...HINTS,
                        badgeIds: { label: "Badges to show (none = all switched on)", options: props.badgeOptions },
                      }}
                      errors={sectionErrors(i)}
                    />
                  </div>
                )}
              </div>
            );
          })}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-fg-2">Add a section:</span>
            {(Object.keys(TYPE_LABELS) as SectionType[])
              .filter((t) => t !== "hero" && t !== "form")
              .map((t) => (
                <Button key={t} className="h-8 px-3 text-xs" onClick={() => addSection(t)}>
                  + {TYPE_LABELS[t]}
                </Button>
              ))}
          </div>
        </section>

        <SaveBar
          dirty={dirty}
          pending={pending}
          idle="Saved"
          onDiscard={() => {
            setContent(saved);
            setErrors({});
            setDirty(false);
          }}
        >
          {dirty && (
            <input
              aria-label="Note for this version (optional)"
              className="rm-field h-10 min-w-0 flex-1 basis-48 px-3 text-sm outline-none"
              placeholder="Optional note for this version…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          )}
          <Button variant="primary" disabled={pending || !dirty} onClick={save}>
            {pending ? "Saving…" : "Save draft"}
          </Button>
        </SaveBar>
        {message && (
          <p
            role="status"
            className={`text-sm font-medium ${message.tone === "ok" ? "text-[#1f7a3a]" : "text-danger"}`}
          >
            {message.text}
          </p>
        )}
      </div>

      <aside className="flex flex-col gap-5 lg:sticky lg:top-20">
        <Panel title="Publish">
          <p className="mb-3 text-sm text-fg-2">
            Status: <strong className="text-fg">{props.page.status}</strong> · {props.page.visibility}
            {props.page.isDraftNewer && props.page.status === "published" ? " · draft has unpublished changes" : ""}
          </p>
          {issues.length === 0 ? (
            <p className="mb-3 text-sm font-semibold text-[#1f7a3a]">Ready to publish.</p>
          ) : (
            <ul className="mb-3 flex flex-col gap-1.5 text-sm">
              {issues.map((i, n) => (
                <li key={n} className="flex gap-2">
                  <span className="text-danger">●</span>
                  {i.message}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => run(async () => setIssues(await checkPage(props.page.id)))} disabled={pending}>
              Re-check
            </Button>
            {props.canPublish && (
              <Button
                variant="danger"
                disabled={pending || dirty || issues.length > 0}
                title={dirty ? "Save first" : undefined}
                onClick={() =>
                  run(async () => {
                    const res = await publish(props.page.id);
                    if (!res.ok) return setMessage({ tone: "error", text: res.error });
                    setIssues(res.issues);
                    setMessage(
                      res.issues.length
                        ? { tone: "error", text: "Not published: see the checklist." }
                        : { tone: "ok", text: "Published." },
                    );
                    router.refresh();
                  })
                }
              >
                Publish
              </Button>
            )}
            {props.canPublish && props.page.status === "published" && (
              <Button
                variant="ghost"
                onClick={() =>
                  run(async () => {
                    const res = await unpublish(props.page.id);
                    setMessage(res.ok ? { tone: "ok", text: "Taken offline." } : { tone: "error", text: res.error });
                    router.refresh();
                  })
                }
              >
                Take offline
              </Button>
            )}
          </div>
          {!props.canPublish && <p className="mt-3 text-xs text-fg-2">Publishing is done by the developer.</p>}
        </Panel>

        <Panel title="Preview">
          <p className="mb-3 text-sm text-fg-2">
            A private link to the saved draft that expires in 7 days. Search engines never see it.
          </p>
          <Button
            disabled={pending}
            onClick={() =>
              run(async () => {
                const res = await createPreviewLink(props.page.id);
                if (res.ok) setPreview(`${window.location.origin}${res.path}`);
                else setMessage({ tone: "error", text: res.error });
              })
            }
          >
            Make preview link
          </Button>
          {preview && (
            <input
              readOnly
              className={`${INPUT_CLASS} mt-3 text-xs`}
              value={preview}
              onFocus={(e) => e.target.select()}
            />
          )}
        </Panel>

        {props.canManage && (
          <Panel title="URL and visibility">
            <div className="flex flex-col gap-3">
              <Field label="URL" hint="Changing it adds a 301 redirect from the old address.">
                <span className="rm-field flex items-center px-3 text-sm">
                  <span className="text-fg-2">/lp/</span>
                  <input
                    className="h-10 min-w-0 flex-1 bg-transparent outline-none"
                    value={settings.slug}
                    onChange={(e) => setSettings({ ...settings, slug: e.target.value })}
                  />
                </span>
              </Field>
              <Field label="Visibility" hint="Unlisted: anyone with the link, no search engines or AI crawlers.">
                <Select
                  value={settings.visibility}
                  onChange={(v) => setSettings({ ...settings, visibility: v })}
                  options={[
                    { value: "unlisted", label: "Unlisted" },
                    { value: "public", label: "Public" },
                    { value: "private", label: "Private (preview links only)" },
                  ]}
                />
              </Field>
              <Button
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    const res = await setPageSettings(props.page.id, settings as never);
                    setMessage(
                      res.ok ? { tone: "ok", text: "URL and visibility saved." } : { tone: "error", text: res.error },
                    );
                    router.refresh();
                  })
                }
              >
                Save URL and visibility
              </Button>
            </div>
          </Panel>
        )}

        <Panel title="Duplicate for another country">
          <div className="flex gap-2">
            <Select
              value={country}
              onChange={setCountry}
              aria-label="Country"
              placeholder="Choose a country…"
              options={props.countries.map((c) => ({ value: c.id, label: c.label }))}
            />
            <Button
              disabled={pending || !country}
              onClick={() =>
                run(async () => {
                  const res = await duplicateForCountry(props.page.id, country);
                  if (res.ok) router.push(`/admin/pages/${res.id}`);
                  else setMessage({ tone: "error", text: res.error });
                })
              }
            >
              Copy
            </Button>
          </div>
          <p className="mt-2 text-xs text-fg-2">
            The copy gets a new headline; its banner and FAQ answers must be redone.
          </p>
        </Panel>

        <Panel title="Version history">
          <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto text-sm">
            {props.versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <strong>v{v.number}</strong>{" "}
                  <span className="text-fg-2">
                    {new Date(v.created_at).toLocaleString("en-IN")}
                    {v.note ? ` · ${v.note}` : ""}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  className="h-8 shrink-0 px-3 text-xs"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      const res = await restoreVersion(props.page.id, v.id);
                      setMessage(
                        res.ok
                          ? { tone: "ok", text: `Restored as version ${res.number}.` }
                          : { tone: "error", text: res.error },
                      );
                      router.refresh();
                    })
                  }
                >
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        </Panel>

        {props.canManage && (
          <Panel title="Delete page">
            <p className="mb-3 text-sm text-fg-2">
              Removes /lp/{props.page.slug} from the website and the sitemap at once, with all its versions and
              preview links. Leads it brought in are kept. This can’t be undone.
            </p>
            {confirmDelete === null ? (
              <Button variant="danger" disabled={pending} onClick={() => setConfirmDelete("")}>
                Delete this page
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                <Field label={`Type ${props.page.slug} to confirm`}>
                  <input
                    className={INPUT_CLASS}
                    value={confirmDelete}
                    onChange={(e) => setConfirmDelete(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="danger"
                    disabled={pending || confirmDelete.trim() !== props.page.slug}
                    onClick={() =>
                      run(async () => {
                        const res = await deletePage(props.page.id, confirmDelete);
                        if (!res.ok) return setMessage({ tone: "error", text: res.error });
                        setDirty(false);
                        router.push("/admin/pages");
                        router.refresh();
                      })
                    }
                  >
                    Delete for good
                  </Button>
                  <Button variant="ghost" disabled={pending} onClick={() => setConfirmDelete(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Panel>
        )}
      </aside>
    </div>
  );
}
