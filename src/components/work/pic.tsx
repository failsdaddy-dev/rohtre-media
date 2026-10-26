import { hasPic, type Pic as PicValue } from "@/content/work-schema";
import { MediaSlot } from "../media/media-slot";

// One image on the Work, brand and Recognition pages: the uploaded file
// (Cloudinary, at the slot's shape) or, until one is uploaded, the copy of
// the live site's image in public/images (its own shape, width and height
// set so nothing jumps). Lazy unless `priority`.

export function Pic({
  pic,
  sizes,
  className = "",
  priority,
  fit = "cover",
  fill,
}: {
  pic: PicValue;
  sizes: string;
  className?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  /** Cover the positioned parent (a background photo). */
  fill?: boolean;
}) {
  if (!hasPic(pic)) return null;
  if (fill)
    return (
      <div className={`absolute inset-0 ${className}`}>
        {pic.media.publicId ? (
          <MediaSlot slot={pic.media} sizes={sizes} priority={priority} className="h-full" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- a local file already sized and compressed
          <img
            src={pic.src}
            width={pic.w || undefined}
            height={pic.h || undefined}
            alt={pic.media.alt}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            className="size-full object-cover"
          />
        )}
      </div>
    );
  if (pic.media.publicId)
    return <MediaSlot slot={pic.media} sizes={sizes} priority={priority} fit={fit} className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a local file already sized and compressed (next/image here goes through the Cloudinary loader)
    <img
      src={pic.src}
      width={pic.w || undefined}
      height={pic.h || undefined}
      alt={pic.media.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={`block h-auto w-full ${fit === "contain" ? "object-contain" : "object-cover"} ${className}`}
    />
  );
}
