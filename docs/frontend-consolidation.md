# Frontend Consolidation (Safe, Incremental)

This repo currently has two frontends:
- `apps/web` (active, workspace-managed)
- `frontend` (legacy, not in workspaces)

To avoid confusion and 404s, `apps/web` is the source of truth.

## Current State
- Landing page, auth, and branded components live in `apps/web`.
- Assets are served from `apps/web/public`.
- `frontend/` has no `package.json`, so `npm install` fails.

## Safe Cleanup Plan
1) **Keep both for now** while verifying `apps/web` is stable.
2) **Update docs** to point to `apps/web` for dev commands.
3) **Move assets** into `apps/web/public` (done for hero video + logo).
4) **Archive legacy `frontend`** after confirmation.

## Run the App
```bash
cd apps/web
pnpm install
pnpm dev
```

## Next Step (Optional)
If you confirm, I can:
- Rename `frontend` → `frontend-legacy`
- Remove it from docs
- Delete only after final verification
