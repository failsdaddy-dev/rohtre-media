// POST { kind: "image" | "video" }  Signed-in staff only.
// Returns what the admin's browser needs to upload ONE file straight to
// Cloudinary (signed upload); the file never passes through our server and
// the API secret never leaves it (R39).
import { getStaff } from "@/lib/auth";
import { cloudinaryServerEnv } from "@/lib/env.server";
import { isUploadKind, UPLOAD_KINDS } from "@/lib/cloudinary/kinds";
import { apiSignature } from "@/lib/cloudinary/sign";

export async function POST(request: Request) {
  const staff = await getStaff();
  if (!staff) return Response.json({ error: "not_signed_in" }, { status: 401 });

  const env = cloudinaryServerEnv();
  if (!env) return Response.json({ error: "cloudinary_not_configured" }, { status: 500 });

  const body = (await request.json().catch(() => null)) as { kind?: unknown } | null;
  if (!isUploadKind(body?.kind)) return Response.json({ error: "bad_request" }, { status: 400 });
  const spec = UPLOAD_KINDS[body.kind];

  const params = {
    allowed_formats: spec.formats,
    asset_folder: spec.folder,
    public_id: `${spec.folder}/${crypto.randomUUID()}`,
    timestamp: Math.floor(Date.now() / 1000),
  };
  return Response.json(
    {
      upload_url: `https://api.cloudinary.com/v1_1/${env.cloud}/${spec.resourceType}/upload`,
      api_key: env.apiKey,
      signature: await apiSignature(params, env.secret),
      max_mb: spec.maxMb,
      params,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
