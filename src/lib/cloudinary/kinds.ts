// What the admin may upload (R39): the server picks the folder, the file name
// and the allowed formats, so a signature can't be reused for anything else.
// A signature can't cap file size, so the browser checks `maxMb` before
// uploading and the server re-checks `bytes` when the upload is saved.
// verified: https://cloudinary.com/documentation/image_upload_api_reference (asset_folder, allowed_formats)

export const ROOT_FOLDER = "rohtre-media";

export const UPLOAD_KINDS = {
  image: { resourceType: "image", folder: `${ROOT_FOLDER}/images`, formats: "jpg,jpeg,png,webp,avif", maxMb: 10 },
  video: { resourceType: "video", folder: `${ROOT_FOLDER}/video`, formats: "mp4,webm,mov", maxMb: 100 },
} as const;

export type UploadKind = keyof typeof UPLOAD_KINDS;

export const isUploadKind = (v: unknown): v is UploadKind => typeof v === "string" && v in UPLOAD_KINDS;

/** A public_id we issued: inside our folder, safe characters, no traversal. */
export const isOurPublicId = (v: unknown): v is string =>
  typeof v === "string" && v.startsWith(`${ROOT_FOLDER}/`) && /^[A-Za-z0-9_./-]+$/.test(v) && !v.includes("..");
