// Upload the About page's new photos (see src/content/about-schema.ts):
//   npm run seed:about
// Uploads, from scripts/seed-assets/about/ (already compressed WebP), to the
// Cloudinary ids the About defaults use:
//   rohan-trehan-youtube-stage.webp → rohtre-media/images/about/rohan-trehan-youtube-stage
//   mrunal.webp                     → rohtre-media/images/team/mrunal
//   harshil.webp                    → rohtre-media/images/team/harshil
// Existing files are kept (overwrite=false). Nothing is written to the
// database: the About page uses these ids until it is saved in the admin.
// Safe to run again. Reads NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
// CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET from .env.local; never prints them.
// verified: https://cloudinary.com/documentation/image_upload_api_reference (public_id, overwrite, asset_folder)

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { apiSignature } from "../src/lib/cloudinary/sign";

const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const secret = process.env.CLOUDINARY_API_SECRET;
if (!cloud || !apiKey || !secret) {
  console.error("Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET in .env.local");
  process.exit(1);
}

const DIR = join(process.cwd(), "scripts", "seed-assets", "about");
const FILES: [file: string, folder: string, name: string][] = [
  ["rohan-trehan-youtube-stage.webp", "rohtre-media/images/about", "rohan-trehan-youtube-stage"],
  ["mrunal.webp", "rohtre-media/images/team", "mrunal"],
  ["harshil.webp", "rohtre-media/images/team", "harshil"],
];

async function main() {
  let ok = true;
  for (const [file, folder, name] of FILES) {
    const params = {
      asset_folder: folder,
      overwrite: "false",
      public_id: `${folder}/${name}`,
      timestamp: Math.floor(Date.now() / 1000),
    };
    const form = new FormData();
    form.append("file", new Blob([readFileSync(join(DIR, file))]), file);
    for (const [k, v] of Object.entries(params)) form.append(k, String(v));
    form.append("api_key", apiKey!);
    form.append("signature", await apiSignature(params, secret!));
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: form });
    const json = (await res.json()) as { public_id?: string; existing?: boolean; error?: { message: string } };
    if (!res.ok || !json.public_id) {
      ok = false;
      console.error(`fail  ${file}: ${json.error?.message ?? res.status}`);
    } else console.log(`${json.existing ? "kept " : "added"} ${json.public_id}`);
  }
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
