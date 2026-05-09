# Railway staging setup

## Status: COMPLETE ✅
- Project: superb-nurturing / staging
- Service URL: https://vis-auto-staging.up.railway.app
- Database: PostgreSQL (online)
- Branch: develop (auto-deploys on push)

---

## What was done

1. Created Railway project at railway.app → linked to MachariaS/VIS-Auto → branch: develop
2. Added PostgreSQL plugin (DATABASE_URL auto-injected as ${{Postgres.DATABASE_URL}})
3. Generated public domain on port 4000
4. Set all environment variables via Variables tab (see docs/deployments.md for full list)
5. Added RAILWAY_TOKEN to GitHub Secrets for CI/CD

---

## If you need to recreate from scratch

### Install Railway CLI
```bash
npm install -g @railway/cli
```

### Login
```bash
railway login
```

### Link to your Railway project (run from repo root)
```bash
railway link
```

### Set all environment variables
```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
railway variables set REFRESH_TOKEN_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
railway variables set FRONTEND_URL=https://vis-auto-staging.vercel.app
railway variables set SMTP_HOST=sandbox.smtp.mailtrap.io
railway variables set SMTP_PORT=587
railway variables set SMTP_USER=your-mailtrap-username
railway variables set SMTP_PASS=your-mailtrap-password
railway variables set "MAIL_FROM=VIS Auto Staging <noreply@vis-auto.com>"
railway variables set DB_SYNCHRONIZE=false
railway variables set LOCATION_LOOKUP_MODE=free
railway variables set PORT=4000
```

> DATABASE_URL is injected automatically — add PostgreSQL plugin in the Railway dashboard

### Trigger first deploy
```bash
railway up --service vis-auto --detach
```

### Check logs
```bash
railway logs
```
