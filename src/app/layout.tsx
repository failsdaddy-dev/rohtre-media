import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { Suspense } from "react";
import { PageScrollbar } from "@/components/page-scrollbar";
import { GoogleTagManager } from "@/components/tracking/google-tag-manager";
import { MetaPixel, MetaPixelClicks } from "@/components/tracking/meta-pixel";
import { SITE_URL } from "@/lib/env";
import { MOTION_BOOT_SCRIPT } from "@/lib/motion-boot";
import { OG_IMAGES } from "@/lib/seo";
import "./globals.css";
import "./design.css";

// Space Grotesk (SIL Open Font License 1.1). next/font downloads it at build
// time and serves it from this site, so browsers make no request to Google (R35).
// verified: https://github.com/google/fonts/blob/main/ofl/spacegrotesk/OFL.txt
const spaceGrotesk = Space_Grotesk({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "RohTre Media", template: "%s | RohTre Media" },
  description: "RohTre Media is a digital marketing and growth agency.",
  openGraph: { siteName: "RohTre Media", type: "website", images: OG_IMAGES },
  twitter: { card: "summary_large_image", images: OG_IMAGES },
};

// No theme toggle: the site is light with dark sections (see globals.css).
export const viewport: Viewport = {
  themeColor: "#0f0f0f",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the motion script sets data-* on <html> before React loads.
    <html lang="en" className={spaceGrotesk.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <Suspense fallback={null}>
          <GoogleTagManager />
        </Suspense>
        <a
          href="#main"
          className="sr-only-focusable fixed left-4 top-4 z-50 rounded-full bg-brand px-4 py-2 font-semibold text-brand-fg"
        >
          Skip to content
        </a>
        {children}
        <Suspense fallback={null}>
          <MetaPixel />
        </Suspense>
        <MetaPixelClicks />
        <PageScrollbar />
      </body>
    </html>
  );
}
