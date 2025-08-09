# Muralla Frontend (React + Vite)

This SPA consumes the Muralla API and requires a JWT in `localStorage` under the key **`authToken`**.

## Quick start
```bash
pnpm -C muralla-frontend install
pnpm -C muralla-frontend dev     # http://localhost:5173
```

During `pnpm dev` Vite will proxy API calls to `http://localhost:3000` by default.  Override with:
```bash
VITE_API_BASE_URL=http://localhost:4000 pnpm -C muralla-frontend dev
```

## Environment variables
| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Base URL of backend (default `http://localhost:3000`) |
| `VITE_ENABLE_DEMO`  | `true` to preload a demo token in dev/staging |

## Production build
```bash
pnpm -C muralla-frontend build   # outputs to dist/
```
The Railway Frontend service serves the `dist` directory via Nixpacks’ static file runner.

---
### Authentication workflow
1. User logs in via form (to be built) → `POST /auth/login` returns `access_token`.
2. Token is saved with `AuthService.setToken()`.
3. Subsequent `AuthService.apiCall()` requests include `Authorization: Bearer <token>`. 401 responses should trigger a redirect to login.

---
Made with ❤️ and Vite.
