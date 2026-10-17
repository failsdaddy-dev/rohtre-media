import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { SITE_URL } from "@/lib/env";
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
};

// No theme toggle: the site is light with dark sections (see globals.css).
export const viewport: Viewport = {
  themeColor: "#0f0f0f",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only-focusable fixed left-4 top-4 z-50 rounded-full bg-brand px-4 py-2 font-semibold text-brand-fg"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
