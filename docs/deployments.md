# VIS Auto — Live Deployment Reference

Last updated: 2026-05-09

---

## Environments

### Staging — Railway + Vercel
| Resource | URL |
|----------|-----|
| Web app | https://web-aavshlgam-machariass-projects.vercel.app |
| API | https://vis-auto-staging.up.railway.app |
| API health | https://vis-auto-staging.up.railway.app/health |
| Railway dashboard | https://railway.com/vis-auto (project: superb-nurturing, env: staging) |

- Branch: `develop`
- Auto-deploys when you push to `develop`
- Database: Railway PostgreSQL (provisioned, online)

### Production — Heroku + Vercel
| Resource | URL |
|----------|-----|
| Web app | https://vis-auto.vercel.app |
| API | https://vis-auto-api-production-d71b4c628d38.herokuapp.com |
| API health | https://vis-auto-api-production-d71b4c628d38.herokuapp.com/health |
| Heroku dashboard | https://dashboard.heroku.com/apps/vis-auto-api-production |

- Branch: `main`
- Auto-deploys when you push to `main` via GitHub Actions
- Database: Heroku PostgreSQL essential-0

---

## Deployment pipeline

```
Developer pushes to develop
       │
       ▼
GitHub Actions (.github/workflows/deploy.yml)
       │
       ├── develop branch → Railway staging (vis-auto-staging.up.railway.app)
       │                   + Vercel preview (web-aavshlgam-...)
       │
       └── main branch → Heroku production (vis-auto-api-production.herokuapp.com)
                        + Vercel production (vis-auto.vercel.app)
```

---

## Environment variables

### Set on Railway (staging)
| Variable | Value |
|----------|-------|
| NODE_ENV | production |
| PORT | 4000 |
| JWT_EXPIRES_IN | 15m |
| FRONTEND_URL | https://vis-auto-staging.vercel.app |
| SMTP_HOST | sandbox.smtp.mailtrap.io |
| DB_SYNCHRONIZE | false (set to true only for first boot to create schema) |
| LOCATION_LOOKUP_MODE | free |
| DATABASE_URL | ${{Postgres.DATABASE_URL}} — auto-injected by Railway |
| JWT_SECRET | set (96-char random) |
| REFRESH_TOKEN_SECRET | set (96-char random) |

### Set on Heroku (production)
| Variable | Value |
|----------|-------|
| NODE_ENV | production |
| JWT_EXPIRES_IN | 15m |
| FRONTEND_URL | https://vis-auto.vercel.app |
| SMTP_HOST | sandbox.smtp.mailtrap.io |
| DB_SYNCHRONIZE | false |
| LOCATION_LOOKUP_MODE | free |
| DATABASE_URL | auto-injected by Heroku PostgreSQL addon |
| JWT_SECRET | set (96-char random) |
| REFRESH_TOKEN_SECRET | set (96-char random) |

### Set on Vercel (both environments)
| Variable | Staging value | Production value |
|----------|--------------|-----------------|
| VITE_API_BASE_URL | https://vis-auto-staging.up.railway.app/api | https://vis-auto-api-production-d71b4c628d38.herokuapp.com/api |
| VITE_OSRM_URL | https://router.project-osrm.org | https://router.project-osrm.org |

---

## GitHub Actions secrets (already configured)
| Secret | Purpose |
|--------|---------|
| RAILWAY_TOKEN | Authenticates Railway staging deploys |
| HEROKU_API_KEY | Authenticates Heroku production deploys |
| HEROKU_APP_NAME | vis-auto-api-production |
| HEROKU_EMAIL | samwelkaranja322@gmail.com |

---

## First-time schema creation (one-off)

When deploying to a brand new database, set `DB_SYNCHRONIZE=true`, restart,
wait 30 seconds for TypeORM to create all tables, then set back to `false`
and restart again. Never leave `DB_SYNCHRONIZE=true` in a running environment.

**Railway:**
1. Variables tab → set DB_SYNCHRONIZE=true → Save (auto-restarts)
2. Wait 30s → set DB_SYNCHRONIZE=false → Save

**Heroku:**
```bash
heroku config:set DB_SYNCHRONIZE=true --app vis-auto-api-production
heroku restart --app vis-auto-api-production
# wait 30 seconds
heroku config:set DB_SYNCHRONIZE=false --app vis-auto-api-production
heroku restart --app vis-auto-api-production
```

---

## Useful commands

```bash
# Check Railway staging logs
RAILWAY_TOKEN=your-token railway logs --service vis-auto

# Check Heroku production logs
heroku logs --tail --app vis-auto-api-production

# Trigger manual production deploy
git push heroku main

# Check what's deployed on Vercel
vercel ls
```
