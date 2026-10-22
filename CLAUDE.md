# CLAUDE.md

Start every session by reading `website.md` (project memory). Don't re-scan the codebase.

- The contract is `docs/claude-build-prompt.md` (hard constraints in Part 0, requirements R1-R45). Work phase by phase and stop at each gate.
- Keep `website.md` accurate: update it at the end of every phase and whenever a decision changes. No secrets in any file; env var names only.
- Next.js 16 is newer than most training data: check `node_modules/next/dist/docs/` before using an API.
- Git: only two branches. Commit all work to `dev`; `main` gets the whole code once the website is finished. Never create other branches.
- Commands: `npm run dev`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.

## Token saving (these override anything above)
- Do only what the prompt says. No extras, no refactors.
- After code changes, do NOT run tests, lint, build or typecheck. I run them myself. Only if the prompt has a "CHECK:" line, run that one command, trimmed with `| tail -5`.
- Don't write new test files unless the prompt says "full check".
- Don't read `website.md` at session start. Read it only when the prompt says so. Update it only when I say "update memory".
- Read `docs/claude-build-prompt.md` only for the requirement the prompt cites (e.g. "R25").
- Read only the files the prompt names. Targeted search; don't scan the repo.
- Keep going without asking, except at a gate the prompt names. Don't narrate steps.

## Screenshots and websites (only when I ask)
- If my prompt says "attached", "screenshot", "image N" or has an IMAGE KEY: look at every attached image before editing. Treat it as the visual target (red boxes = the area to change).
- If my prompt gives a URL or says "visit/see/check this site": WebFetch it once, before editing, and take only what the prompt asks for. Don't crawl other pages.
- If a fetch fails or lacks detail, say so in one line and continue from the written spec and screenshots. Never guess what a page contains.
- Reference sites are for ideas only. Don't copy their text, images, logos or branding unless I say the site is mine.
- Don't take your own screenshots or render the app. I check in my own browser.

## Replies
- Final reply: max 8 lines. One line per change: "what - file". Then anything I must do.