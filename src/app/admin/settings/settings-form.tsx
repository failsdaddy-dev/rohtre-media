"use client";

import { useActionState } from "react";
import { Button, Field, INPUT_CLASS, Panel } from "@/components/admin/ui";
import { callbacksToText, phonesToText } from "@/lib/settings-form";
import type { SiteSettings } from "@/lib/settings-schema";
import { saveSettings, type SaveState } from "./actions";

const AREA = `${INPUT_CLASS} font-mono text-[13px] leading-6`;
const CHECK = "size-4 accent-[var(--brand)]";

const networkLabel = (n: string) => (n === "x" ? "X (Twitter)" : n[0].toUpperCase() + n.slice(1));

export function SettingsForm({ settings, isOwner }: { settings: SiteSettings; isOwner: boolean }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveSettings, { status: "idle", errors: {} });
  const e = state.errors;
  const status = pending
    ? "Saving…"
    : state.status === "saved"
      ? "Saved. The website is updated."
      : (state.message ?? "Changes go live on the website when you save.");

  return (
    <form action={action} className="flex flex-col gap-6">
      <Panel title="Contact details">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Email" error={e.email}>
            <input name="email" type="email" defaultValue={settings.email} required className={INPUT_CLASS} />
          </Field>
          <Field label="Location (short)" error={e.location}>
            <input name="location" defaultValue={settings.location} className={INPUT_CLASS} />
          </Field>
          <Field label="Full address (optional)" hint="Shown instead of the location when filled in." error={e.address}>
            <input name="address" defaultValue={settings.address ?? ""} className={INPUT_CLASS} />
          </Field>
          <Field label="Footer tagline" error={e.tagline}>
            <input name="tagline" defaultValue={settings.tagline} className={INPUT_CLASS} />
          </Field>
          <Field
            label="Phone numbers"
            hint="One per line: country code | label | number as shown | number to dial"
            error={e.phones}
            className="md:col-span-2"
          >
            <textarea name="phones" rows={3} defaultValue={phonesToText(settings)} className={AREA} />
          </Field>
          <Field
            label="Callback-only countries"
            hint="One per line: country code | label. Shows “Get a Callback” linking to the form."
            error={e.callbackCountries}
            className="md:col-span-2"
          >
            <textarea name="callbackCountries" rows={2} defaultValue={callbacksToText(settings)} className={AREA} />
          </Field>
        </div>
      </Panel>

      <Panel title="WhatsApp">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="WhatsApp number"
            hint="Country code and number, digits only, e.g. 919695747475"
            error={e["whatsapp.number"]}
          >
            <input name="whatsappNumber" defaultValue={settings.whatsapp.number} className={INPUT_CLASS} />
          </Field>
          <Field
            label="HR WhatsApp number (Careers page)"
            hint="Leave empty to hide “Chat with HR”."
            error={e.hrWhatsapp}
          >
            <input name="hrWhatsapp" defaultValue={settings.hrWhatsapp ?? ""} className={INPUT_CLASS} />
          </Field>
          <Field
            label="Pre-filled message"
            hint="Variables: {page}, {service}, {niche}, {country}"
            error={e["whatsapp.template"]}
            className="md:col-span-2"
          >
            <input name="whatsappTemplate" defaultValue={settings.whatsapp.template} className={INPUT_CLASS} />
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="whatsappEnabled"
              defaultChecked={settings.whatsapp.enabled}
              className={CHECK}
            />
            Show the floating WhatsApp button
          </label>
        </div>
      </Panel>

      <Panel title="Social links">
        <p className="-mt-2 mb-4 text-sm text-fg-2">Empty links stay hidden on the website.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {settings.socials.map((s) => (
            <Field key={s.network} label={networkLabel(s.network)} error={e.socials}>
              <input
                name={`social_${s.network}`}
                type="url"
                defaultValue={s.url ?? ""}
                placeholder="https://"
                className={INPUT_CLASS}
              />
            </Field>
          ))}
        </div>
      </Panel>

      <Panel title="Lead form">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Monthly ad-spend choices" hint="One per line" error={e.adSpendRanges}>
            <textarea name="adSpendRanges" rows={6} defaultValue={settings.adSpendRanges.join("\n")} className={AREA} />
          </Field>
          <Field label="“Interested in” choices" hint="One per line" error={e.interests}>
            <textarea name="interests" rows={6} defaultValue={settings.interests.join("\n")} className={AREA} />
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="careersLineEnabled"
              defaultChecked={settings.careersLineEnabled}
              className={CHECK}
            />
            Show “Looking for a job? See Careers” under the form
          </label>
        </div>
      </Panel>

      <Panel title="Privacy and publishing">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Delete leads after (days)"
            hint="Shown in the Privacy Notice. 730 days = 24 months."
            error={e.leadRetentionDays}
          >
            <input
              name="leadRetentionDays"
              type="number"
              min={30}
              max={3650}
              defaultValue={settings.leadRetentionDays}
              className={INPUT_CLASS}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="founderCanPublish"
              defaultChecked={settings.founderCanPublish}
              disabled={!isOwner}
              className={CHECK}
            />
            Owner can publish pages {isOwner ? "" : "(only the owner can change this)"}
          </label>
        </div>
      </Panel>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-full border border-line bg-bg-elev p-2 pl-5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)]">
        <p role="status" className="flex-1 text-sm">
          {status}
        </p>
        <Button type="submit" variant="primary" disabled={pending}>
          Save settings
        </Button>
      </div>
    </form>
  );
}
