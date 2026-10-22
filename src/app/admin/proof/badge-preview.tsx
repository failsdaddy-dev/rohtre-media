"use client";

import { cloudinaryUrl } from "@/lib/cloudinary/url";
import type { BadgeLogoStyle } from "@/lib/proof-schemas";

// Live preview of one partner-strip cell for the badge being edited: the
// red band, the logo drawn in the chosen style, the label and sub-label,
// at the strip's desktop logo height. Plus a warning when the logo is a JPG
// (no transparency: "White" would turn it into a white box).

export const LOGO_STYLE_LABELS: Record<BadgeLogoStyle, string> = {
  white: "White (logo as a white shape)",
  plate: "On a white plate (detailed or multi-colour logos)",
  original: "Original (exactly as uploaded)",
};

export function BadgePreview({
  values,
  format,
}: {
  values: Record<string, unknown>;
  /** The logo file's format when it was uploaded through the admin (null = unknown). */
  format: string | null;
}) {
  const id = typeof values.image_public_id === "string" ? values.image_public_id : null;
  const style = (values.logo_style as BadgeLogoStyle | undefined) ?? "white";
  const label = String(values.label ?? "");
  const number = /^\d/.test(label);
  const jpg = format ? /^jpe?g$/i.test(format) : false;
  const img = id && (
    // eslint-disable-next-line @next/next/no-img-element -- admin preview straight from Cloudinary
    <img
      src={cloudinaryUrl(id, { width: 480 })}
      alt=""
      className={`h-[72px] w-auto max-w-full object-contain ${style === "white" ? "[filter:brightness(0)_invert(1)]" : ""} ${style === "plate" ? "h-[56px]" : ""}`}
    />
  );
  return (
    <div className="mt-5 flex flex-col gap-2">
      <p className="text-sm font-semibold">Preview on the red strip</p>
      <div className="flex min-h-52 flex-col items-center justify-center gap-4 rounded-2xl bg-brand px-6 py-8 text-center text-brand-fg">
        <span className="grid h-[72px] max-w-full place-items-center">
          {img ? (
            style === "plate" ? (
              <span className="grid place-items-center rounded-xl bg-white px-3.5 py-2">{img}</span>
            ) : (
              img
            )
          ) : number ? (
            <span className="text-5xl font-bold tracking-[-0.05em]">{label.trim()}</span>
          ) : (
            <span className="text-sm opacity-80">No logo: a white award icon is shown</span>
          )}
        </span>
        <span>
          {!number && <span className="block text-sm font-bold uppercase tracking-[0.14em]">{label}</span>}
          {typeof values.sublabel === "string" && values.sublabel && (
            <span className="mt-1.5 block text-sm font-semibold">{values.sublabel}</span>
          )}
        </span>
      </div>
      {jpg && (
        <p role="status" className="rounded-xl bg-[color-mix(in_srgb,#f5a524_18%,transparent)] px-3 py-2 text-xs">
          This logo is a JPG, which has a solid background: “White” turns it into a white box. Upload a PNG, SVG or WebP
          with a transparent background, or choose “On a white plate”.
        </p>
      )}
    </div>
  );
}
