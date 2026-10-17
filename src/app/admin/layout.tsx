import type { Metadata } from "next";

// Every admin page reads the session, so navigations wait for the server by
// design. verified: node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · RohTre Media" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
