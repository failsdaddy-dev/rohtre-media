"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MediaField } from "@/components/admin/media-field";
import { Button, Panel } from "@/components/admin/ui";
import { cloudinaryUrl } from "@/lib/cloudinary/url";
import { deleteMedia } from "./actions";

// Every file uploaded through the admin. "In use" means a draft, published
// page, the home page or a proof record uses it; those can't be deleted.
// Deleting removes the file from Cloudinary too.

type Item = {
  public_id: string;
  resource_type: "image" | "video";
  width: number | null;
  height: number | null;
  bytes: number | null;
  created_at: string;
  inUse: boolean;
};

const kb = (b: number | null) =>
  b == null ? "" : b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;

export function MediaLibrary({ items, canDelete }: { items: Item[]; canDelete: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const unused = items.filter((i) => !i.inUse);

  const remove = (ids: string[]) =>
    start(async () => {
      const out = await deleteMedia(ids);
      const deleted = out.filter((o) => o.result === "deleted").length;
      const kept = out.length - deleted;
      setMessage(`${deleted} deleted from Cloudinary${kept ? `, ${kept} kept (in use or not ours)` : ""}.`);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-5">
      <Panel title="Upload">
        <div className="grid gap-4 md:grid-cols-2">
          <MediaField
            label="Image (JPG, PNG, WebP, AVIF; up to 10 MB)"
            value={null}
            onChange={() => router.refresh()}
          />
          <MediaField
            label="Video (MP4, WebM, MOV; up to 100 MB)"
            kind="video"
            value={null}
            onChange={() => router.refresh()}
          />
        </div>
      </Panel>
      <Panel title={`Files (${items.length})`}>
        {canDelete && unused.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-fg-2">{unused.length} file(s) aren’t used anywhere.</span>
            <Button variant="danger" disabled={pending} onClick={() => remove(unused.map((u) => u.public_id))}>
              Delete all unused
            </Button>
          </div>
        )}
        {message && <p className="mb-4 text-sm font-medium">{message}</p>}
        {items.length === 0 ? (
          <p className="text-fg-2">Nothing uploaded yet.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((m) => (
              <li key={m.public_id} className="flex flex-col gap-2 rounded-2xl border border-line p-2">
                {m.resource_type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail straight from Cloudinary
                  <img
                    src={cloudinaryUrl(m.public_id, { width: 300 })}
                    alt=""
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                ) : (
                  <span className="grid aspect-square place-items-center rounded-xl bg-chip text-xs">Video</span>
                )}
                <span className="truncate text-xs" title={m.public_id}>
                  {m.public_id.split("/").pop()}
                </span>
                <span className="flex items-center justify-between text-xs text-fg-2">
                  {kb(m.bytes)}
                  <span className={m.inUse ? "font-bold text-[#1f7a3a]" : ""}>{m.inUse ? "In use" : "Unused"}</span>
                </span>
                {canDelete && !m.inUse && (
                  <Button
                    variant="ghost"
                    className="h-8 text-xs"
                    disabled={pending}
                    onClick={() => remove([m.public_id])}
                  >
                    Delete
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
