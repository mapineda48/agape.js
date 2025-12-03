# Repository Guidelines

## Project Structure & Module Organization
- `web/`: Entry at `web/index.tsx`; tests sit beside components; helpers in `web/test`.
- `svc/`: Backend RPC handlers; any exported function becomes an endpoint via Express middleware and is imported in the web app with `@agape/<path>`.
- `lib/`: Shared services (`lib/services`), RPC plumbing (`lib/rpc`), logging, and utilities; Drizzle migration output lands in `lib/db/migrations/scripts`.
- `models/`: Drizzle schemas that drive migrations.
- `bin/`: Runtime entrypoints (`bin/index.ts` server, `bin/build.ts` bundling); build artifacts land in `dist/` and `web/www/`.

## Build, Test, and Development Commands
- `pnpm dev` / `pnpm frontend`: Vite dev server for the web UI.
- `pnpm backend`: Watch-mode backend using `tsconfig.app.json`.
- `pnpm lint`: ESLint for TS + React hooks/refresh rules.
- `pnpm test`: Vitest (jsdom) with Testing Library from `web/test/setup.ts`.
- `pnpm generate`: Emit Drizzle SQL from `models/`.
- `pnpm build`: Custom bundler (`bin/build.ts`), runs `prebuild` to clean and type-check; `pnpm preview` serves the built SPA.
- Infra: `docker compose up` brings Postgres/Redis locally.

## Coding Style & Naming Conventions
- TypeScript + ESM with strict mode; prefer double quotes, semicolons, and 2-space indentation to match existing files.
- React components/providers in PascalCase; hooks start with `use`; utilities and variables in `camelCase`.
- Keep modules small and colocate related tests; favor aliases (`#lib/*`, `#utils/*`, `@/*`, `@agape/*`) over deep relative paths.
- Run `pnpm lint` before pushing; avoid disabling rules unless justified inline.

## Testing Guidelines
- Favor `*.test.ts`/`*.test.tsx` near the code under test; Testing Library assertions (`@testing-library/jest-dom`) are preloaded.
- Cover routing, form state, and RPC serialization edge cases; mock access/cms/spa APIs via `web/test/mocks`.
- Run `pnpm test -- --watch` while iterating; ship each feature with targeted tests.

## Commit & Pull Request Guidelines
- Use the repo’s conventional prefixes (`feat:`, `fix:`, `chore:`, `refactor:`) with a concise imperative summary.
- PRs should state scope, linked issues, and environments touched; list commands run (lint/tests/build) and add screenshots or GIFs for UI-visible changes.
- Call out new env vars, migration impacts, or API shape changes; keep diffs focused and avoid drive-by refactors.

## Security & Configuration Tips
- Backend bootstraps env vars in `bin/index.ts` (e.g., `AGAPE_SECRET`, `DATABASE_URI`, `CACHE_URL`, `AZURE_CONNECTION_STRING`); keep them in a local `.env` and never commit secrets.
- Local DB defaults (`postgresql://postgres:mypassword@localhost`) are for dev only; prefer `docker compose` to match Postgres/Redis versions.
- For new RPC endpoints, keep messagepack handling intact and require `Accept: application/msgpack` to avoid leaking alternate payloads.
