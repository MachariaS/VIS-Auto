# Heroku production setup

## Status: COMPLETE ✅
- App: vis-auto-api-production
- URL: https://vis-auto-api-production-d71b4c628d38.herokuapp.com
- Database: heroku-postgresql:essential-0 (provisioned)
- Branch: main (auto-deploys on push via GitHub Actions)
- Account: samwelkaranja322@gmail.com

---

## What was done

1. Created app: `heroku create vis-auto-api-production`
2. Provisioned database: `heroku addons:create heroku-postgresql:essential-0`
3. Set all 13 environment variables (JWT secrets, SMTP, CORS, etc.)
4. Added HEROKU_API_KEY, HEROKU_APP_NAME, HEROKU_EMAIL to GitHub Secrets

---

## If you need to recreate from scratch

### Install Heroku CLI
```bash
# macOS
brew tap heroku/brew && brew install heroku
```

### Login
```bash
heroku login
```

### Create the production app
```bash
heroku create vis-auto-api-production
```

### Add PostgreSQL
```bash
heroku addons:create heroku-postgresql:essential-0 \
  --app vis-auto-api-production
```

### Set environment variables
```bash
heroku config:set NODE_ENV=production \
  JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))") \
  REFRESH_TOKEN_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))") \
  JWT_EXPIRES_IN=15m \
  FRONTEND_URL=https://vis-auto.vercel.app \
  SMTP_HOST=sandbox.smtp.mailtrap.io \
  SMTP_PORT=587 \
  SMTP_USER=your-mailtrap-username \
  SMTP_PASS=your-mailtrap-password \
  "MAIL_FROM=VIS Auto <noreply@vis-auto.com>" \
  DB_SYNCHRONIZE=false \
  LOCATION_LOOKUP_MODE=free \
  --app vis-auto-api-production
```

### One-time schema creation (new database only)
```bash
heroku config:set DB_SYNCHRONIZE=true --app vis-auto-api-production
heroku restart --app vis-auto-api-production
# Wait 30 seconds for TypeORM to create tables
heroku config:set DB_SYNCHRONIZE=false --app vis-auto-api-production
heroku restart --app vis-auto-api-production
```

### Check logs
```bash
heroku logs --tail --app vis-auto-api-production
```
