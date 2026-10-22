"use client";

import { useRef, useState } from "react";
import { cloudinaryUrl } from "@/lib/cloudinary/url";
import { CLOUDINARY_CLOUD_NAME } from "@/lib/env";
import { checkUpload, IMAGE_MIME, VIDEO_MIME } from "@/lib/media-limits";
import { uploadToCloudinary } from "./upload";

// One image or video upload field (upload with progress, replace, remove).
// `value` is either a media object {publicId, width, height} or a plain
// public_id string, depending on the field. Image/video slots use
// MediaSlotField instead.

type MediaObject = { publicId: string; width: number; height: number };
type Value = MediaObject | string | null;

function idOf(v: Value): string | null {
  return v == null ? null : typeof v === "string" ? v : v.publicId;
}

export function MediaField({
  value,
  onChange,
  kind = "image",
  asString = false,
  label,
}: {
  value: Value;
  onChange: (v: Value) => void;
  kind?: "image" | "video";
  asString?: boolean;
  label: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const id = idOf(value);

  async function upload(file: File) {
    setError(null);
    const check = checkUpload(file, kind);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setProgress(0);
    try {
      const media = await uploadToCloudinary(file, kind, setProgress);
      onChange(asString ? media.publicId : { publicId: media.publicId, width: media.width, height: media.height });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-line p-3">
        {id ? (
          kind === "video" ? (
            <span className="rounded-lg bg-chip px-3 py-2 text-xs">{id.split("/").pop()} (video)</span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail straight from Cloudinary
            <img
              src={CLOUDINARY_CLOUD_NAME ? cloudinaryUrl(id, { width: 240 }) : ""}
              alt=""
              className="h-20 w-auto max-w-[200px] rounded-lg border border-line object-contain"
            />
          )
        ) : (
          <span className="text-sm text-fg-2">No file yet</span>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={progress !== null}
            className="rm-press inline-flex h-9 items-center rounded-full bg-chip-on-bg px-4 text-sm font-semibold text-chip-on-fg disabled:opacity-60"
          >
            {progress !== null ? `Uploading ${progress}%` : id ? "Replace" : "Upload"}
          </button>
          {id && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex h-9 items-center rounded-full bg-chip px-4 text-sm font-semibold hover:bg-chip-hover"
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept={(kind === "video" ? VIDEO_MIME : IMAGE_MIME).join(",")}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>
      {error && <span className="text-xs font-medium text-danger">{error}</span>}
      <span className="text-xs text-fg-2">
        Removing or replacing a file deletes it from Cloudinary when you save, if nothing else on the site uses it.
      </span>
    </div>
  );
}
