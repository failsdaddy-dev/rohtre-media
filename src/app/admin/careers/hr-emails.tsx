"use client";

import { useState, useTransition } from "react";
import { Button, INPUT_CLASS, Panel } from "@/components/admin/ui";
import { saveHrEmails } from "./actions";

/** Where applications are emailed. Private: never part of the public page data. */
export function HrEmails({ initial, mailReady }: { initial: string[]; mailReady: boolean }) {
  const [text, setText] = useState(initial.join("\n"));
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <Panel title="HR emails for applications">
      <p className="-mt-2 mb-3 text-sm text-fg-2">
        Each application is emailed here (with the resume attached, if one was sent) and saved in Admin → Applications.
        One address per line. Empty = the sending mailbox itself.
      </p>
      {!mailReady && (
        <p className="mb-3 text-sm font-medium text-danger">
          Email sending is not set up yet: add SMTP_USER and SMTP_PASS to .env.local (see docs/setup/careers-email.md).
        </p>
      )}
      <textarea
        rows={3}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setNote(null);
        }}
        className={`${INPUT_CLASS} font-mono text-[13px]`}
        aria-label="HR email addresses"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await saveHrEmails(text);
              setNote(res.ok ? { ok: true, text: "Saved." } : { ok: false, text: res.error ?? "Couldn’t save." });
            })
          }
        >
          Save HR emails
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
