import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { SITE_URL } from "@/lib/env";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={spaceGrotesk.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
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
