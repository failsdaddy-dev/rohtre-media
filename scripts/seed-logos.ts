// Upload the client logos (downloaded once from the live site's "Brands we've
// worked with" row into scripts/seed-assets/brands/) to Cloudinary, so the
// site never hotlinks the old WordPress files.
//   npm run seed:logos
// Each file goes to rohtre-media/images/brands/{file name}, the ids the home
// page content already uses (BRAND_LOGOS in src/content/home-schema.ts).
// Safe to run again: existing files are kept (overwrite=false).
// Reads CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET and
// NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME from .env.local; never prints them.
// verified: https://cloudinary.com/documentation/image_upload_api_reference (public_id, overwrite, asset_folder)

import { readdirSync, readFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { BRAND_LOGOS } from "../src/content/home-schema";
import { apiSignature } from "../src/lib/cloudinary/sign";

const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const secret = process.env.CLOUDINARY_API_SECRET;
if (!cloud || !apiKey || !secret) {
  console.error("Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET in .env.local");
  process.exit(1);
}

const DIR = join(process.cwd(), "scripts", "seed-assets", "brands");
const FOLDER = "rohtre-media/images/brands";
const known = new Map<string, string>(BRAND_LOGOS.map(([slug, name]) => [slug, name]));

async function main() {
  const files = readdirSync(DIR).filter((f) => /\.(png|jpe?g|webp|svg)$/i.test(f));
  let failed = 0;
  for (const file of files) {
    const slug = basename(file, extname(file));
    if (!known.has(slug)) {
      console.warn(`skip  ${file}: not listed in BRAND_LOGOS`);
      continue;
    }
    const params = {
      asset_folder: FOLDER,
      overwrite: "false",
      public_id: `${FOLDER}/${slug}`,
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
      failed++;
      console.error(`fail  ${file}: ${json.error?.message ?? res.status}`);
    } else console.log(`${json.existing ? "kept " : "added"} ${json.public_id} (${known.get(slug)})`);
  }
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
