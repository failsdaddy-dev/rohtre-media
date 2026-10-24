import { LegalTemplate, legalMetadata } from "@/components/legal/legal-template";

// Legal page: content in Admin → Legal (defaults: src/content/legal-defaults.ts).
export const generateMetadata = () => legalMetadata("terms-of-service");

export default function Page() {
  return <LegalTemplate slug="terms-of-service" />;
}
