# Vercel frontend setup — staging and production

## Staging project (points at Railway)
1. Go to vercel.com → Add New Project → Import vis-auto from GitHub
2. Project name: vis-auto-staging
3. Root directory: apps/web
4. Build command: npm run build
5. Output directory: dist
6. Branch to deploy: develop
7. Environment variables:
   - VITE_API_BASE_URL = https://your-railway-url.railway.app
   - VITE_OSRM_URL = https://router.project-osrm.org

## Production project (points at Heroku)
1. Go to vercel.com → Add New Project → Import vis-auto from GitHub
2. Project name: vis-auto
3. Root directory: apps/web
4. Build command: npm run build
5. Output directory: dist
6. Branch to deploy: main
7. Environment variables:
   - VITE_API_BASE_URL = https://vis-auto-api-production.herokuapp.com
   - VITE_OSRM_URL = https://router.project-osrm.org
