// What may appear on the public site (R11, R19). Pure, so it can be unit-tested
// and used in both server and client code. The database enforces the same rules.

/** Badges are a showcase (founder, 2026-10-17): switched on = shown. A proof link is optional. */
export const isLiveBadge = (b: { enabled: boolean }) => b.enabled;

/** Proof (testimonials, results) goes live only when approved and not a placeholder. */
export const isLiveProof = (p: { approved: boolean; is_placeholder: boolean }) => p.approved && !p.is_placeholder;

/** The badges the public strip shows (data query and component both use this). */
export const publicBadges = <T extends { enabled: boolean }>(badges: T[]): T[] => badges.filter(isLiveBadge);
