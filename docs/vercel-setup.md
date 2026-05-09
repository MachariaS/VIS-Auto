# Vercel frontend setup

## Status: COMPLETE ✅

| Environment | URL | Branch | Points at |
|-------------|-----|--------|-----------|
| Staging (preview) | https://web-aavshlgam-machariass-projects.vercel.app | develop | Railway |
| Production | https://vis-auto.vercel.app | main | Heroku |

---

## What was done

1. Linked `apps/web` to Vercel project `web` (machariass-projects)
2. Set `VITE_API_BASE_URL` and `VITE_OSRM_URL` for both environments
3. Production points at Heroku API
4. Staging preview points at Railway API

---

## Environment variables set

### Production
```
VITE_API_BASE_URL=https://vis-auto-api-production-d71b4c628d38.herokuapp.com/api
VITE_OSRM_URL=https://router.project-osrm.org
```

### Staging (preview / develop branch)
```
VITE_API_BASE_URL=https://vis-auto-staging.up.railway.app/api
VITE_OSRM_URL=https://router.project-osrm.org
```

---

## If you need to recreate from scratch

### Install Vercel CLI
```bash
npm install -g vercel
```

### Login and link
```bash
cd apps/web
vercel login
vercel link
```

### Add environment variables
```bash
# Production
vercel env add VITE_API_BASE_URL production \
  --value "https://vis-auto-api-production-d71b4c628d38.herokuapp.com/api" --yes
vercel env add VITE_OSRM_URL production \
  --value "https://router.project-osrm.org" --yes

# Staging (develop branch preview)
vercel env add VITE_API_BASE_URL preview develop \
  --value "https://vis-auto-staging.up.railway.app/api" --yes
vercel env add VITE_OSRM_URL preview develop \
  --value "https://router.project-osrm.org" --yes
```

### Deploy
```bash
# Preview (staging)
vercel deploy

# Production
vercel deploy --prod
```

### List all deployments
```bash
vercel ls
```
