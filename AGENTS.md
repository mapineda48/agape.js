# AGENTS.md

Purpose: quick guidance for agentic coding in this repo.

## Repo Overview
- TypeScript monorepo (backend + frontend) with Vite + Vitest.
- Backend lives in `bin/`, `svc/`, `lib/`, `models/`.
- Frontend lives in `web/` (React, Vite, Tailwind v4 theme).
- Package manager: `pnpm` (see `package.json`).
- ESM only: `"type": "module"` in `package.json`.

## Commands

### Install
- `pnpm install`

### Dev / Run
- `pnpm app` (backend watch, uses `tsx` and `bin/index.ts`)
- `pnpm web` (Vite dev server for frontend)
- `pnpm tsx` (generic tsx watch using `tsconfig.app.json`)

### Build
- `pnpm build` (runs `tsx bin/build.ts`)
- `pnpm prebuild` (cleans `dist`, runs `tsc` + `vite build`)
- `pnpm preview` (Vite preview)

### Lint
- `pnpm lint` (ESLint)

### Typecheck
- `pnpm tsc:app` (backend types)
- `pnpm tsc:web` (frontend types)

### Tests (Vitest)
- `pnpm test` (all projects)
- `pnpm test:app` (backend tests, runs `drizzle-kit generate` then Vitest)
- `pnpm test:web` (frontend tests)

### Run a Single Test (Vitest)
- Single file (app): `pnpm test -- svc/inventory/item.test.ts`
- Single file (web): `pnpm test:web -- web/app/login/page.test.tsx`
- Single test name: `pnpm test -- -t "should create payment"`
- Single test with project: `pnpm test -- --project app -t "name"`

Notes:
- Vitest config is in `vitest.config.ts` with `app` and `frontend` projects.
- The `app` project is limited to 3 workers because of Postgres usage.

## Code Style & Conventions

### General TypeScript
- Strict type checking is enabled (see `tsconfig.app.json`, `tsconfig.web.json`).
- Prefer explicit return types on exported functions in services.
- Use `type` imports for type-only usage.
- Keep files ESM; use `import`/`export` syntax only.

### Formatting
- No repo-wide formatter configuration is present; follow the local file style.
- Backend files typically use 2-space indentation; some legacy code uses 4 spaces.
- Align multi-line arguments and object literals with existing file style.

### Imports
- Use path aliases from `tsconfig`:
  - Backend: `#utils/*`, `#models/*`, `#lib/*`, `#svc/*`, `#session`, `#logger`.
  - Frontend: `@/*`, `@agape/*`, `@utils/*`, plus shared `#*` aliases.
- Group imports: external packages first, then internal aliases, then relative paths.
- Prefer `import type` for DTOs and type-only symbols.

### Naming
- Files: backend service files use `snake_case` (`svc/catalogs/price_list.ts`).
- Tests: `*.test.ts` or `*.test.tsx` next to the module or in test folders.
- Functions/variables: `camelCase`.
- Classes/types/interfaces: `PascalCase`.
- Constants: `UPPER_SNAKE_CASE` for exported consts.

### Service Layer (`svc/`)
- Use the custom error types from `lib/error.ts`:
  - `BusinessRuleError`, `NotFoundError`, `ValidationError`, `ConflictError`, `ForbiddenError`.
- Use `@permission` JSDoc tags on exported functions (see `svc/*` usage).
- Keep DB access via Drizzle ORM models in `models/`.
- Use `Decimal` (`#utils/data/Decimal`) for money/precision-sensitive values.
- Use `DateTime` (`#utils/data/DateTime`) for date handling.

### Models (`models/`)
- Follow current table definitions and naming patterns.
- Prefer snake_case DB names, but expose TS-friendly types.

### Frontend (`web/`)
- React + TypeScript + Vite, JSX in `.tsx`.
- Keep UI components in `web/components` and pages in `web/app`.
- Tailwind v4 theme variables are defined in `web/index.css`.
- Error handling: use `ErrorBoundary` (`web/components/util/error-boundary.tsx`).

### Tests
- Tests use Vitest with `app` and `frontend` projects.
- Name tests with descriptive strings; prefer `describe`/`it`.
- Backend tests often depend on database state; keep transactions isolated.

### Error Handling
- Throw custom errors for business rules and missing data.
- Avoid `throw new Error` in service logic unless truly unexpected.
- In frontend, report errors through existing notification utilities.

### Data & Utilities
- Prefer shared DTOs in `#utils/dto/*` for frontend-backend shape alignment.
- Use `#utils/data/*` helpers for `DateTime`, `Decimal`, and error helpers.

### Permissions
- Services annotate permissions using `@permission` in JSDoc.
- Keep permissions consistent with existing modules (e.g., `catalogs.item.read`).

## Lint Rules Snapshot
- ESLint uses `@eslint/js`, `typescript-eslint`, `react-hooks`, `react-refresh`.
- Targeted to `**/*.{ts,tsx}` only, ignores `dist/`.

## Agent Skills
The project uses a **Skill System** to standardize complex operations. These skills are located in `.agent/skills/` and contain specific instructions (in `SKILL.md`) that **must** be followed when performing related tasks.

### Available Skills
1.  **drizzle-schema-generator**: Use when creating new tables/models in Drizzle ORM.
2.  **dto-conventions**: Use when managing Data Transfer Objects (DTOs).
3.  **rbac-permissions**: Use when managing permissions and RBAC catalog.
4.  **react-component-patterns**: Use when creating/editing React components.
5.  **service-layer-architecture**: Use when working on backend services (`svc/`).

**Important**: If a task involves these areas, READ the corresponding `SKILL.md` first.

## Agent Notes
- No Cursor rules or Copilot instructions were found in this repo.
- If you add scripts, update `package.json` accordingly.
- Avoid editing generated files or `dist/`.
- Keep new code consistent with nearby module style.
