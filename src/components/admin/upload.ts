"use client";

import { registerUpload, type Uploaded } from "@/app/admin/media/actions";

// Upload one file straight from the browser to Cloudinary with a signature
// from our server (the API secret never reaches the browser), then record
// it in the media library. Size, format and length come from Cloudinary.

export async function uploadToCloudinary(
  file: File,
  kind: "image" | "video",
  onProgress: (percent: number) => void,
): Promise<Uploaded> {
  const signRes = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
  });
  if (!signRes.ok) throw new Error(signRes.status === 401 ? "Sign in again, then retry." : "Upload not allowed.");
  const sign = (await signRes.json()) as {
    upload_url: string;
    api_key: string;
    signature: string;
    params: Record<string, string | number>;
  };
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sign.api_key);
  form.append("signature", sign.signature);
  for (const [k, v] of Object.entries(sign.params)) form.append(k, String(v));
  const uploaded = await new Promise<{ publicId: string; duration: number | null }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", sign.upload_url);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      try {
        const j = JSON.parse(xhr.responseText) as {
          public_id?: string;
          duration?: number;
          error?: { message: string };
        };
        if (xhr.status < 300 && j.public_id) resolve({ publicId: j.public_id, duration: j.duration ?? null });
        else reject(new Error(j.error?.message ?? "Upload failed."));
      } catch {
        reject(new Error("Upload failed."));
      }
    };
    xhr.onerror = () => reject(new Error("Network error while uploading."));
    xhr.send(form);
  });
  const saved = await registerUpload(uploaded.publicId, kind);
  if (!saved.ok) throw new Error(saved.error);
  // The Admin API doesn't always report a video's length; the upload response does.
  return { ...saved.media, duration: saved.media.duration ?? uploaded.duration };
}
