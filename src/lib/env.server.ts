import "server-only";

// Server-only secrets. Importing this file from a Client Component fails the
// build ("server-only"), so these values can never reach the browser (R39).

function read(name: string): string | null {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : null;
}

export function supabaseSecretKey(): string | null {
  return read("SUPABASE_SECRET_KEY");
}

export function cloudinaryServerEnv(): { cloud: string; apiKey: string; secret: string } | null {
  const cloud = read("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  const apiKey = read("CLOUDINARY_API_KEY");
  const secret = read("CLOUDINARY_API_SECRET");
  return cloud && apiKey && secret ? { cloud, apiKey, secret } : null;
}
