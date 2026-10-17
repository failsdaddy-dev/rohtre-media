import type { NextConfig } from "next";

// Content Security Policy (production only; `next dev` needs eval for hot
// reload). Third parties are added here one by one as phases need them
// (booking embed, GTM, Meta Pixel), never as wildcards (R39).
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'", // Next.js inline bootstrap + theme boot script
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://res.cloudinary.com",
  "media-src 'self' https://res.cloudinary.com",
  "font-src 'self'",
  `connect-src 'self' ${supabase} https://api.cloudinary.com`.trim(),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");
const isProd = process.env.NODE_ENV === "production";

const noindex = { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" };

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
  images: {
    // Cloudinary does the resizing and format choice (f_auto, q_auto).
    loader: "custom",
    loaderFile: "./src/lib/cloudinary/url.ts",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          ...(isProd ? [{ key: "Content-Security-Policy", value: CSP }] : []),
        ],
      },
      // Unlisted landing pages: kept out of search and AI answers (R42).
      { source: "/lp/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" }] },
      // Never indexed.
      { source: "/admin/:path*", headers: [noindex] },
      { source: "/login", headers: [noindex] },
      { source: "/preview/:path*", headers: [noindex] },
      { source: "/api/:path*", headers: [noindex] },
    ];
  },
};

export default nextConfig;
