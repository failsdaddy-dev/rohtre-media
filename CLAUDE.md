# CLAUDE.md

Start every session by reading `website.md` (project memory). Don't re-scan the codebase.

- The contract is `docs/claude-build-prompt.md` (hard constraints in Part 0, requirements R1-R45). Work phase by phase and stop at each gate.
- Keep `website.md` accurate: update it at the end of every phase and whenever a decision changes. No secrets in any file; env var names only.
- Next.js 16 is newer than most training data: check `node_modules/next/dist/docs/` before using an API.
- Commands: `npm run dev`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
