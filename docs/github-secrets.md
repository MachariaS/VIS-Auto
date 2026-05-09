# GitHub Actions secrets required

Go to: GitHub repo → Settings → Secrets and variables → Actions → New repository secret

## For Railway (staging)
RAILWAY_TOKEN
  → Get from: railway.com → Account Settings → Tokens → Create token
  → Name it: github-actions

## For Heroku (production)
HEROKU_API_KEY
  → Get from: heroku.com → Account Settings → API Key → Reveal
HEROKU_APP_NAME
  → Value: vis-auto-api-production
HEROKU_EMAIL
  → Value: your Heroku account email
