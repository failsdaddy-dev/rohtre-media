"use client";

import { useRef, useState } from "react";
import { registerUpload } from "@/app/admin/media/actions";
import { cloudinaryUrl } from "@/lib/cloudinary/url";
import { CLOUDINARY_CLOUD_NAME } from "@/lib/env";

// Upload an image or video straight from the browser to Cloudinary with a
// signature from our server (the API secret never reaches the browser),
// then record it in the media library. `value` is either a media object
// {publicId, width, height} or a plain public_id string, depending on the field.

type MediaObject = { publicId: string; width: number; height: number };
type Value = MediaObject | string | null;

const LIMITS = { image: 10, video: 100 };

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
    if (file.size > LIMITS[kind] * 1024 * 1024) {
      setError(`The file is larger than ${LIMITS[kind]} MB.`);
      return;
    }
    setProgress(0);
    try {
      const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      if (!signRes.ok)
        throw new Error(signRes.status === 403 ? "Confirm your 2-step code first (Security)." : "Upload not allowed.");
      const sign = (await signRes.json()) as {
        upload_url: string;
        api_key: string;
        signature: string;
        params: Record<string, string | number>;
      };
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sign.api_key);
      form.append("signature", sign.signature);
      for (const [k, v] of Object.entries(sign.params)) form.append(k, String(v));
      const publicId = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", sign.upload_url);
        xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
        xhr.onload = () => {
          try {
            const j = JSON.parse(xhr.responseText) as { public_id?: string; error?: { message: string } };
            if (xhr.status < 300 && j.public_id) resolve(j.public_id);
            else reject(new Error(j.error?.message ?? "Upload failed."));
          } catch {
            reject(new Error("Upload failed."));
          }
        };
        xhr.onerror = () => reject(new Error("Network error while uploading."));
        xhr.send(form);
      });
      const saved = await registerUpload(publicId, kind);
      if (!saved.ok) throw new Error(saved.error);
      onChange(
        asString
          ? saved.media.publicId
          : { publicId: saved.media.publicId, width: saved.media.width, height: saved.media.height },
      );
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
          accept={
            kind === "video" ? "video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp,image/avif"
          }
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
