# Docker and deployment

## The image

Multi-stage `Dockerfile`:

1. **build** — `node:20-alpine`, `npm ci`, `npm run build` into `/app/dist`.
2. **runtime** — `nginx:1.27-alpine` serves `dist/` with `nginx.conf`: SPA fallback to `index.html`,
   gzip, one-year cache for hashed `/assets/`, security headers,
   `/sitemap.xml` and `/robots.txt` as real files, and `/healthz` for health checks.

```bash
docker build -t team262-frontend:local .
docker run -d --name team262\_frontend -p 8080:80 team262-frontend:local
curl http://localhost:8080/healthz
```

The container serves only the static app. It does not proxy `/api`.

## Production routing

The whole stack is defined in the **infra** repository (`compose/docker-compose.yml`), which also holds
the Nginx gateway config and the server `.env` template:

- `https://what2watch.duckdns.org/` → gateway → this container (`frontend:80`)
- `/api/\*` → gateway → backend (`backend:8080/`, the `/api` prefix is removed)
- `/swagger-ui/\*`, `/v3/api-docs` → backend

Because the browser sees one origin, the backend needs no CORS. For local runs of the full stack see
the infra README (`COMPOSE\_PROFILES=local` starts a local MySQL; the HTTPS gateway needs a local
HTTP-only config).

## CI / CD

- **CI** (`.github/workflows/ci.yml`, every PR and push to `develop`/`main`): `npm ci`, lint, build and a
  Docker smoke test (`/healthz`, `/`).
- **CD** (on merge to `main`): builds the image, pushes it to GHCR and deploys it to the EC2 server
  over SSH. The pipeline and the server are maintained by DevOps; details live in the infra repo.
