# Heroku production setup

Run these commands once to connect the repo to Heroku.

## Install Heroku CLI if not already installed
## macOS: brew tap heroku/brew && brew install heroku
## Windows: download from https://devcenter.heroku.com/articles/heroku-cli

## Login
heroku login

## Create the production app
heroku create vis-auto-api-production

## Add PostgreSQL
heroku addons:create heroku-postgresql:essential-0 \
  --app vis-auto-api-production

## Set environment variables
heroku config:set NODE_ENV=production \
  --app vis-auto-api-production

heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))") \
  --app vis-auto-api-production

heroku config:set REFRESH_TOKEN_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))") \
  --app vis-auto-api-production

heroku config:set FRONTEND_URL=https://vis-auto.vercel.app \
  --app vis-auto-api-production

heroku config:set SMTP_HOST=sandbox.smtp.mailtrap.io \
  --app vis-auto-api-production

heroku config:set SMTP_PORT=587 \
  --app vis-auto-api-production

heroku config:set SMTP_USER=your-mailtrap-username \
  --app vis-auto-api-production

heroku config:set SMTP_PASS=your-mailtrap-password \
  --app vis-auto-api-production

heroku config:set "MAIL_FROM=VIS Auto <noreply@vis-auto.com>" \
  --app vis-auto-api-production

heroku config:set DB_SYNCHRONIZE=false \
  --app vis-auto-api-production

heroku config:set LOCATION_LOOKUP_MODE=free \
  --app vis-auto-api-production

## Deploy
git push heroku main

## One-time schema creation
heroku config:set DB_SYNCHRONIZE=true --app vis-auto-api-production
heroku restart --app vis-auto-api-production
## Wait 30 seconds, then:
heroku config:set DB_SYNCHRONIZE=false --app vis-auto-api-production
heroku restart --app vis-auto-api-production

## Check logs
heroku logs --tail --app vis-auto-api-production
