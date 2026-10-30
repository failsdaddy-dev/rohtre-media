"use client";

import { useState, useTransition } from "react";
import { Button, INPUT_CLASS, Panel } from "@/components/admin/ui";
import { saveSalesEmails } from "./actions";

/** Where Contact enquiries are emailed. Private: never part of the public page data. */
export function SalesEmails({ initial }: { initial: string[] }) {
  const [text, setText] = useState(initial.join("\n"));
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <Panel title="Sales emails for enquiries">
      <p className="-mt-2 mb-3 text-sm text-fg-2">
        Each Contact page enquiry is emailed here and saved in Admin → Leads. One address per line. Empty = the sending
        mailbox itself.
      </p>
      <textarea
        rows={3}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setNote(null);
        }}
        className={`${INPUT_CLASS} font-mono text-[13px]`}
        aria-label="Sales email addresses"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await saveSalesEmails(text);
              setNote(res.ok ? { ok: true, text: "Saved." } : { ok: false, text: res.error ?? "Couldn’t save." });
            })
          }
        >
          Save sales emails
        </Button>
        {note && (
          <span role="status" className={`text-sm ${note.ok ? "" : "font-medium text-danger"}`}>
            {note.text}
          </span>
        )}
      </div>
    </Panel>
  );
}
