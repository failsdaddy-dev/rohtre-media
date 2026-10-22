// Seed the home page's starter content (see docs/seed-manifest.md):
//   npm run seed:home
// 1. Uploads the five product mockups (downloaded once from the live
//    e-commerce page's product carousel into scripts/seed-assets/products/)
//    to Cloudinary rohtre-media/images/products/{name}, the ids the home
//    content already uses (PRODUCT_IMAGES in src/content/home-schema.ts).
//    Existing files are kept (overwrite=false).
// 2. If the home page has been saved in the admin (page_content "home"),
//    fills what that saved copy is missing: empty product slots get the
//    mockups, and the client showcase gets the two client slides (Rama
//    Chikan, Harmiche) when it has no slide with a brand yet. Nothing that
//    was filled in by hand is overwritten. With no saved copy, the code
//    defaults already contain all of this.
// Safe to run again. Reads NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
// CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, NEXT_PUBLIC_SUPABASE_URL and
// SUPABASE_SECRET_KEY from .env.local; never prints them.
// verified: https://cloudinary.com/documentation/image_upload_api_reference (public_id, overwrite, asset_folder)

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_HOME, homeSchema, PRODUCT_IMAGES } from "../src/content/home-schema";
import { apiSignature } from "../src/lib/cloudinary/sign";

const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const secret = process.env.CLOUDINARY_API_SECRET;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!cloud || !apiKey || !secret || !url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local",
  );
  process.exit(1);
}

const DIR = join(process.cwd(), "scripts", "seed-assets", "products");
const FOLDER = "rohtre-media/images/products";

async function uploadProducts(): Promise<boolean> {
  let ok = true;
  for (const slug of PRODUCT_IMAGES) {
    const params = {
      asset_folder: FOLDER,
      overwrite: "false",
      public_id: `${FOLDER}/${slug}`,
      timestamp: Math.floor(Date.now() / 1000),
    };
    const form = new FormData();
    form.append("file", new Blob([readFileSync(join(DIR, `${slug}.png`))]), `${slug}.png`);
    for (const [k, v] of Object.entries(params)) form.append(k, String(v));
    form.append("api_key", apiKey!);
    form.append("signature", await apiSignature(params, secret!));
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: form });
    const json = (await res.json()) as { public_id?: string; existing?: boolean; error?: { message: string } };
    if (!res.ok || !json.public_id) {
      ok = false;
      console.error(`fail  ${slug}.png: ${json.error?.message ?? res.status}`);
    } else console.log(`${json.existing ? "kept " : "added"} ${json.public_id}`);
  }
  return ok;
}

type Json = Record<string, unknown>;

/** Fill only what the saved home copy is missing. */
async function fillSavedHome() {
  const db = createClient(url!, key!, { auth: { persistSession: false } });
  const { data, error } = await db.from("page_content").select("data").eq("key", "home").maybeSingle();
  if (error) throw new Error(`Reading the saved home page failed: ${error.message}`);
  if (!data) return console.log("home  not saved in the admin yet: the code defaults already include the seed");

  const home = structuredClone(data.data ?? {}) as Json;
  let changed = false;

  const products = home.products as { items?: { media?: { publicId?: string | null } }[] } | undefined;
  if (products?.items) {
    products.items.forEach((item, i) => {
      const seed = DEFAULT_HOME.products.items[i]?.media;
      if (seed && item.media && !item.media.publicId) {
        item.media = { ...seed };
        changed = true;
      }
    });
  }

  const showcase = homeSchema.shape.showcase.safeParse(home.showcase);
  const hasBrand = showcase.success && showcase.data.slides.some((s) => s.brand.trim());
  if (!hasBrand) {
    const base = showcase.success ? showcase.data : DEFAULT_HOME.showcase;
    home.showcase = { ...base, slides: DEFAULT_HOME.showcase.slides };
    changed = true;
  }

  if (!changed) return console.log("home  saved copy already has products and client slides: nothing changed");
  const { error: saveError } = await db.from("page_content").update({ data: home }).eq("key", "home");
  if (saveError) throw new Error(`Saving the home page failed: ${saveError.message}`);
  console.log("home  saved copy updated (empty product slots and/or client slides filled)");
}

async function main() {
  const uploaded = await uploadProducts();
  await fillSavedHome();
  if (!uploaded) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
