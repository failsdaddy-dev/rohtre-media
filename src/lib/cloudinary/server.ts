import "server-only";
import { cloudinaryServerEnv } from "../env.server";
import { isOurPublicId } from "./kinds";
import { apiSignature } from "./sign";

/**
 * Deletes one asset from Cloudinary (used when an image is removed from the
 * site, Phase 4). Only public_ids inside our folder can be deleted.
 * verified: https://cloudinary.com/documentation/image_upload_api_reference#destroy
 */
export async function destroyAsset(
  publicId: string,
  resourceType: "image" | "video",
): Promise<"ok" | "not found" | "error"> {
  const env = cloudinaryServerEnv();
  if (!env || !isOurPublicId(publicId)) return "error";
  const params = { public_id: publicId, invalidate: "true", timestamp: Math.floor(Date.now() / 1000) };
  const body = new URLSearchParams({ ...params, timestamp: String(params.timestamp), api_key: env.apiKey });
  body.set("signature", await apiSignature(params, env.secret));
  const res = await fetch(`https://api.cloudinary.com/v1_1/${env.cloud}/${resourceType}/destroy`, {
    method: "POST",
    body,
  });
  if (!res.ok) return "error";
  const json = (await res.json()) as { result?: string };
  return json.result === "ok" ? "ok" : json.result === "not found" ? "not found" : "error";
}

export type CloudinaryResource = {
  publicId: string;
  width?: number;
  height?: number;
  bytes: number;
  format?: string;
  duration?: number;
};

/**
 * Cloudinary's own record of an uploaded file (Admin API), so sizes and
 * dimensions come from Cloudinary, not from the browser.
 * verified: https://cloudinary.com/documentation/admin_api#get_details_of_a_single_resource_by_public_id
 */
export async function fetchResource(
  publicId: string,
  resourceType: "image" | "video",
): Promise<CloudinaryResource | null> {
  const env = cloudinaryServerEnv();
  if (!env || !isOurPublicId(publicId)) return null;
  const auth = Buffer.from(`${env.apiKey}:${env.secret}`).toString("base64");
  const path = publicId.split("/").map(encodeURIComponent).join("/");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${env.cloud}/resources/${resourceType}/upload/${path}`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const j = (await res.json()) as {
    public_id: string;
    width?: number;
    height?: number;
    bytes: number;
    format?: string;
    duration?: number;
  };
  return {
    publicId: j.public_id,
    width: j.width,
    height: j.height,
    bytes: j.bytes,
    format: j.format,
    duration: j.duration,
  };
}
