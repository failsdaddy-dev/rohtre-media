// Cloudinary API signing as pure functions (Web Crypto only), so the unit
// tests can check them against Cloudinary's own worked examples.
// Sort the signed params by name, join as "k=v&k=v", append the API secret,
// SHA-1, hex. Every param is signed except file, cloud_name, resource_type
// and api_key. A signature is valid for one hour from `timestamp`.
// verified: https://cloudinary.com/documentation/authentication_signatures

const enc = new TextEncoder();
const UNSIGNED = ["file", "cloud_name", "resource_type", "api_key"];

export type Params = Record<string, string | number | boolean>;

export function stringToSign(params: Params): string {
  return Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== "" && !UNSIGNED.includes(k))
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
}

export async function apiSignature(params: Params, secret: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-1", enc.encode(stringToSign(params) + secret)));
  return Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
}
