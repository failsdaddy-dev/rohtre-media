// Social links for the footer (Settings → Social links). Pure, so the admin,
// the footer and the tests share one set of rules.
//   - A link must be https (javascript:, data:, plain http and anything that
//     isn't a web address are refused when saving).
//   - A host that doesn't belong to the platform is only a soft warning
//     (e.g. a link shortener is still allowed).
//   - Render rule: an icon shows on the live site only when it is switched
//     on AND its link passes the check; with none, the footer has no icon
//     row at all. Builds other than production also show switched-on icons
//     without a link, dimmed and unlinked ("no link yet"), for layout review.

export const SOCIAL_NETWORKS = [
  "instagram",
  "facebook",
  "x",
  "youtube",
  "linkedin",
  "threads",
  "telegram",
  "pinterest",
] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X (Twitter)",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  threads: "Threads",
  telegram: "Telegram",
  pinterest: "Pinterest",
};
/** The name in the icon's aria-label ("RohTre Media on X"). */
const SPOKEN: Record<SocialNetwork, string> = { ...SOCIAL_LABELS, x: "X" };

/** Example link shown as the URL field's placeholder and hint. */
export const SOCIAL_EXAMPLES: Record<SocialNetwork, string> = {
  instagram: "https://instagram.com/yourname",
  facebook: "https://facebook.com/yourpage",
  x: "https://x.com/yourname",
  youtube: "https://youtube.com/@yourchannel",
  linkedin: "https://linkedin.com/company/yourcompany",
  threads: "https://threads.net/@yourname",
  telegram: "https://t.me/yourname",
  pinterest: "https://pinterest.com/yourname",
};

/** The platform's own hosts (subdomains such as www. or m. count too). */
const HOSTS: Record<SocialNetwork, RegExp> = {
  instagram: /(^|\.)instagram\.com$/,
  facebook: /(^|\.)(facebook\.com|fb\.com|fb\.me)$/,
  x: /(^|\.)(x\.com|twitter\.com)$/,
  youtube: /(^|\.)(youtube\.com|youtu\.be)$/,
  linkedin: /(^|\.)(linkedin\.com|lnkd\.in)$/,
  threads: /(^|\.)(threads\.net|threads\.com)$/,
  telegram: /(^|\.)(t\.me|telegram\.me|telegram\.org)$/,
  pinterest: /(^|\.)(pinterest\.[a-z]{2,3}(\.[a-z]{2})?|pin\.it)$/,
};

export type SocialLink = { network: SocialNetwork; url: string | null; enabled: boolean };

/** The link as a safe https URL string, or null when it isn't one. */
export function safeSocialUrl(raw: string | null | undefined): string | null {
  const text = raw?.trim();
  if (!text || /\s/.test(text)) return null;
  let u: URL;
  try {
    u = new URL(text);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || u.username || u.password || !u.hostname.includes(".")) return null;
  return u.href;
}

/** Why a link can't be saved (null = fine; an empty link is fine too). */
export function socialUrlError(network: SocialNetwork, raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  return safeSocialUrl(raw) ? null : `Use a full https:// link, for example ${SOCIAL_EXAMPLES[network]}`;
}

/** A soft warning when the link's host isn't the platform's (it can still be saved). */
export function socialHostWarning(network: SocialNetwork, raw: string | null | undefined): string | null {
  const url = safeSocialUrl(raw);
  if (!url) return null;
  return HOSTS[network].test(new URL(url).hostname.toLowerCase())
    ? null
    : `This doesn’t look like a ${SOCIAL_LABELS[network]} address. Check it’s the right link.`;
}

export type FooterSocial = { network: SocialNetwork; href: string | null; label: string };

/** What the footer shows (see the render rule at the top of this file). */
export function footerSocials(links: SocialLink[], showUnlinked: boolean): FooterSocial[] {
  return links.flatMap((l) => {
    if (!l.enabled) return [];
    const href = safeSocialUrl(l.url);
    if (!href && !showUnlinked) return [];
    return [
      {
        network: l.network,
        href,
        label: href ? `RohTre Media on ${SPOKEN[l.network]} (opens in a new tab)` : `${SPOKEN[l.network]}: no link yet`,
      },
    ];
  });
}
