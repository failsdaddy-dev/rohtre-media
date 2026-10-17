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

export function cloudinaryUrl(publicId: string, opts: DeliveryOptions = {}, cloud = CLOUDINARY_CLOUD_NAME): string {
  const t = ["f_auto", "q_auto"];
  if (opts.width) t.push(`w_${Math.round(opts.width)}`);
  if (opts.height) t.push(`h_${Math.round(opts.height)}`);
  if (opts.width || opts.height) t.push(`c_${opts.crop ?? "limit"}`);
  const id = publicId.split("/").map(encodeURIComponent).join("/");
  return `https://res.cloudinary.com/${cloud}/${opts.resourceType ?? "image"}/upload/${t.join(",")}/${id}`;
}

/** next/image custom loader: `src` is the Cloudinary public_id. */
export default function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  const url = cloudinaryUrl(src, { width });
  return quality ? url.replace("q_auto", `q_${quality}`) : url;
}
