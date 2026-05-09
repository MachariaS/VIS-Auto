# Railway staging setup

Run these commands once to connect the repo to Railway.

## Install Railway CLI
npm install -g @railway/cli

## Login
railway login

## Link to your Railway project (run from repo root)
railway link

## Set all environment variables
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

## DATABASE_URL is set automatically by Railway when you add the PostgreSQL plugin
## Add PostgreSQL in the Railway dashboard: New → Database → PostgreSQL

## Trigger first deploy
railway up --service vis-auto-api --detach

## Check logs
railway logs
