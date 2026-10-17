// What may appear on the public site (R11, R19). Pure, so it can be unit-tested
// and used in both server and client code. The database enforces the same rules.

/** A badge goes live only when switched on and it has a proof link. */
export const isLiveBadge = (b: { enabled: boolean; proof_url: string | null }) => b.enabled && Boolean(b.proof_url);

/** Proof (testimonials, results) goes live only when approved and not a placeholder. */
export const isLiveProof = (p: { approved: boolean; is_placeholder: boolean }) => p.approved && !p.is_placeholder;
