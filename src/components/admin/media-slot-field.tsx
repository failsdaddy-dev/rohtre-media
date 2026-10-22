"use client";

import { useRef, useState } from "react";
import {
  ASPECT_LABELS,
  ASPECT_UPLOAD,
  ASPECTS,
  familyOf,
  isGif,
  SHAPE_FAMILIES,
  type Aspect,
  type MediaSlotValue,
  type SlotFit,
} from "@/content/media-slot";
import { cloudinaryUrl, stillUrl } from "@/lib/cloudinary/url";
import {
  checkUpload,
  IMAGE_MIME,
  LOOP_CLIP_MAX_SECONDS,
  LOOP_CLIP_RECOMMENDED_MB,
  loopClipWarnings,
  MEDIA_IMAGE_MAX_MB,
  MEDIA_VIDEO_MAX_MB,
  VIDEO_MIME,
} from "@/lib/media-limits";
import { MediaField } from "./media-field";
import { Select, type SelectOption } from "./select";
import { uploadToCloudinary } from "./upload";

// Editor for one image-or-video slot (see src/content/media-slot.ts): switch
// between image and video, upload with progress, replace, remove, alt text
// (required for images), aspect ratio, loop-clip toggle, optional poster,
// and the size/length warnings. Phone screens (phone frames, Video Ads
// cards) call the shape "Screen shape" (phone shapes only) and add
// Fill/Fit with a note on cropping. Removed files are deleted from Cloudinary on
// save when nothing else uses them.

const INPUT = "rm-field w-full px-3.5 py-2.5 text-[15px] outline-none";

/** The Shape list: the slot's shapes under their family headings, each with its best upload size. */
export function shapeOptions(aspects: Aspect[]): SelectOption[] {
  const multi = new Set(aspects.map(familyOf)).size > 1;
  return SHAPE_FAMILIES.flatMap((f) =>
    (f.aspects as readonly Aspect[])
      .filter((a) => aspects.includes(a))
      .map((a) => ({
        value: a,
        label: ASPECT_LABELS[a] ?? a,
        hint: ASPECT_UPLOAD[a],
        group: multi || f.key !== "other" ? f.label : undefined,
      })),
  );
}

export function MediaSlotField({
  label,
  value,
  onChange,
  error,
  altError,
  aspects = Object.keys(ASPECTS) as Aspect[],
  phone = false,
  showShape = false,
}: {
  label: string;
  value: MediaSlotValue & { fit?: SlotFit };
  onChange: (v: MediaSlotValue & { fit?: SlotFit }) => void;
  error?: string;
  altError?: string;
  /** The shapes this slot allows (from its schema). */
  aspects?: Aspect[];
  /** A phone screen: called "Screen shape", with the 9:16 cropping note. */
  phone?: boolean;
  /** Show the chosen shape in the box title, e.g. "Video (4:3)". */
  showShape?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const v = value;
  const set = (patch: Partial<MediaSlotValue & { fit: SlotFit }>) => onChange({ ...v, ...patch });
  const gif = isGif(v);
  const isLoop = v.type === "video" ? v.loop : gif;
  const warnings = isLoop ? loopClipWarnings(v.bytes, v.duration) : [];

  async function upload(file: File) {
    setProblem(null);
    setNotes([]);
    const check = checkUpload(file, v.type);
    if (!check.ok) return setProblem(check.error);
    setNotes(check.warnings);
    setProgress(0);
    try {
      const media = await uploadToCloudinary(file, v.type, setProgress);
      onChange({
        ...v,
        publicId: media.publicId,
        format: media.format,
        bytes: media.bytes,
        duration: media.duration,
        poster: v.type === "video" ? v.poster : null,
      });
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  }

  const preview = v.publicId
    ? v.type === "video"
      ? v.poster
        ? cloudinaryUrl(v.poster, { width: 320 })
        : stillUrl(v.publicId, { width: 320 })
      : gif
        ? stillUrl(v.publicId, { width: 320, gif: true })
        : cloudinaryUrl(v.publicId, { width: 320 })
    : null;

  return (
    <fieldset className="flex flex-col gap-3 rounded-2xl border border-line p-4">
      <legend className="px-1 text-sm font-semibold">{showShape ? `${label} (${v.aspect})` : label}</legend>

      <div className="flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label="Media type" className="inline-flex rounded-full bg-chip p-1">
          {(["image", "video"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={v.type === t}
              onClick={() =>
                v.type !== t &&
                // Switching type empties the slot: the old file is cleaned up on save.
                onChange({ ...v, type: t, publicId: null, format: null, bytes: null, duration: null, poster: null })
              }
              className={`h-8 rounded-full px-4 text-sm font-semibold ${v.type === t ? "bg-brand text-brand-fg" : ""}`}
            >
              {t === "image" ? "Image" : "Video"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="font-semibold">{phone ? "Screen shape" : "Shape"}</span>
          <Select
            size="sm"
            value={v.aspect}
            onChange={(a) => set({ aspect: a as Aspect })}
            options={shapeOptions(aspects)}
          />
        </label>
        {v.fit && (
          <div role="radiogroup" aria-label="Fit" className="inline-flex flex-wrap rounded-[22px] bg-chip p-1">
            {(
              [
                ["fill", "Fill (crop to the frame)"],
                ["fit", "Fit (show the whole video)"],
              ] as const
            ).map(([f, text]) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={v.fit === f}
                onClick={() => set({ fit: f })}
                className={`min-h-8 rounded-full px-3.5 text-sm font-semibold ${v.fit === f ? "bg-brand text-brand-fg" : ""}`}
              >
                {text}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-fg-2">
        Best upload size: {ASPECT_UPLOAD[v.aspect]} px ({v.aspect}).
        {v.fit &&
          " Fill crops the edges when the video’s shape differs from the frame; Fit shows the whole video with dark bars."}
        {phone &&
          " A 9:16 video in a 9:19.5 screen loses about 18% of its width when filled, so export at 9:19.5 (for example 1080×2340), or choose Fit."}
      </p>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-line p-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail straight from Cloudinary
          <img
            src={preview}
            alt=""
            className="h-24 w-auto max-w-[200px] rounded-lg border border-line bg-chip object-contain"
          />
        ) : (
          <span className="text-sm text-fg-2">Empty: shows a neutral frame on the site</span>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={progress !== null}
            className="rm-press inline-flex h-9 items-center rounded-full bg-chip-on-bg px-4 text-sm font-semibold text-chip-on-fg disabled:opacity-60"
          >
            {progress !== null ? `Uploading ${progress}%` : v.publicId ? "Replace" : "Upload"}
          </button>
          {v.publicId && (
            <button
              type="button"
              onClick={() =>
                onChange({ ...v, publicId: null, format: null, bytes: null, duration: null, poster: null })
              }
              className="inline-flex h-9 items-center rounded-full bg-chip px-4 text-sm font-semibold hover:bg-chip-hover"
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept={(v.type === "video" ? VIDEO_MIME : IMAGE_MIME).join(",")}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>
      <p className="text-xs text-fg-2">
        {v.type === "image"
          ? `JPG, PNG, WebP, AVIF or GIF, up to ${MEDIA_IMAGE_MAX_MB} MB. A GIF plays as a looping video; an MP4 is much lighter.`
          : `MP4 (recommended), WebM or MOV, up to ${MEDIA_VIDEO_MAX_MB} MB. Loop clips: ${LOOP_CLIP_MAX_SECONDS} s and ${LOOP_CLIP_RECOMMENDED_MB} MB or less.`}
      </p>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold">
          Alt text {v.type === "image" ? "(required)" : "(optional: describe the clip if it shows something important)"}
        </span>
        <input className={INPUT} maxLength={250} value={v.alt} onChange={(e) => set({ alt: e.target.value })} />
        {altError && <span className="text-xs font-medium text-danger">{altError}</span>}
      </label>

      {v.type === "video" && (
        <>
          <label className="flex items-center gap-2.5 text-sm font-medium">
            <input
              type="checkbox"
              className="size-4 accent-[var(--brand)]"
              checked={v.loop}
              onChange={(e) => set({ loop: e.target.checked })}
            />
            Loop clip (muted, plays by itself while on screen). Off = a player with controls.
          </label>
          <MediaField
            label="Poster image (optional; default is the first frame)"
            kind="image"
            asString
            value={v.poster}
            onChange={(p) => set({ poster: (p as string | null) ?? null })}
          />
        </>
      )}

      {[...notes, ...warnings].map((w) => (
        <p
          key={w}
          role="status"
          className="rounded-xl bg-[color-mix(in_srgb,#f5a524_18%,transparent)] px-3 py-2 text-xs"
        >
          {w}
        </p>
      ))}
      {(problem || error) && <span className="text-xs font-medium text-danger">{problem ?? error}</span>}
    </fieldset>
  );
}
