// Contact details from the live site (docs/content/wordpress-inventory.md)
// and the founder. From Phase 1 these seed the global settings table and are
// edited in admin; nothing here is secret.

export const CONTACT = {
  email: "sales@rohtremedia.com",
  location: "Lucknow, India",
  phones: [
    { country: "IN", label: "India", display: "+91 96957 47475", tel: "+919695747475" },
    { country: "US", label: "US & Canada", display: "+1 229 463 2220", tel: "+12294632220" },
  ],
  // UAE has no number: the live site shows "Get a Callback" -> contact form.
  callbackCountries: ["AE"],
} as const;

/** PLACEHOLDER links: hidden on the site until a real URL is entered in admin. */
export const SOCIALS = [
  { network: "instagram", url: null },
  { network: "youtube", url: null },
  { network: "linkedin", url: null },
  { network: "facebook", url: null },
  { network: "x", url: null },
] as const;
