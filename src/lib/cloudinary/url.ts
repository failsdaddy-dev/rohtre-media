// Delivery URLs. f_auto + q_auto let Cloudinary pick the format and quality
// per browser; `w` requests a responsive width (R35).
// verified: https://cloudinary.com/documentation/image_optimization
import { CLOUDINARY_CLOUD_NAME } from "../env";

export type DeliveryOptions = {
  width?: number;
  height?: number;
  crop?: "fill" | "limit";
  resourceType?: "image" | "video";
};

const encodeId = (publicId: string) => publicId.split("/").map(encodeURIComponent).join("/");

export function cloudinaryUrl(publicId: string, opts: DeliveryOptions = {}, cloud = CLOUDINARY_CLOUD_NAME): string {
  const t = ["f_auto", "q_auto"];
  if (opts.width) t.push(`w_${Math.round(opts.width)}`);
  if (opts.height) t.push(`h_${Math.round(opts.height)}`);
  if (opts.width || opts.height) t.push(`c_${opts.crop ?? "limit"}`);
  return `https://res.cloudinary.com/${cloud}/${opts.resourceType ?? "image"}/upload/${t.join(",")}/${encodeId(publicId)}`;
}

/**
 * A playable MP4 for a video, or for an animated GIF (an "image" resource):
 * changing the extension to .mp4 makes Cloudinary deliver the GIF as video.
 * verified: https://cloudinary.com/documentation/animated_images
 *   ("To deliver an animated GIF as a video file, simply change the file
 *   extension to either the webm or the mp4 video format.")
 */
export function clipUrl(
  publicId: string,
  opts: { width: number; gif?: boolean },
  cloud = CLOUDINARY_CLOUD_NAME,
): string {
  const type = opts.gif ? "image" : "video";
  return `https://res.cloudinary.com/${cloud}/${type}/upload/q_auto,w_${Math.round(opts.width)},c_limit/${encodeId(publicId)}.mp4`;
}

/**
 * A still frame for a video (start offset 0 = the first frame) or a GIF
 * (pg_1 = its first frame), as a JPG.
 * verified: https://cloudinary.com/documentation/transformation_reference_so_start_offset
 *   (so_ "indicate[s] the frame of the video to use for generating video
 *   thumbnails"; example /video/upload/so_auto/<id>.jpg)
 * verified: https://cloudinary.com/documentation/animated_images ("Use the
 *   page parameter (pg in URLs) to deliver only a single frame")
 */
export function stillUrl(
  publicId: string,
  opts: { width: number; gif?: boolean },
  cloud = CLOUDINARY_CLOUD_NAME,
): string {
  const [type, frame] = opts.gif ? ["image", "pg_1"] : ["video", "so_0"];
  return `https://res.cloudinary.com/${cloud}/${type}/upload/${frame},q_auto,w_${Math.round(opts.width)},c_limit/${encodeId(publicId)}.jpg`;
}

/** next/image custom loader: `src` is the Cloudinary public_id. */
export default function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  const url = cloudinaryUrl(src, { width });
  return quality ? url.replace("q_auto", `q_${quality}`) : url;
}
