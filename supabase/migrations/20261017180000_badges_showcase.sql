-- Badges are a showcase (founder decision, 2026-10-17): they no longer need a
-- proof link to be switched on. Replaces R11's proof rule.
alter table public.badges drop constraint badges_enabled_needs_proof;

update public.badges set sublabel = 'Premier Partner' where label = 'Google Partner';

-- Switch on the badges the founder showcases. "2B+" stays off until the
-- founder confirms whether it counts conversions or views.
update public.badges set enabled = true where label <> '2B+';
