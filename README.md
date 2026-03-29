# VIS Assist

Local development workspace for a NestJS API and a lightweight Vite frontend.

## Start services
```bash
docker compose up -d
```

## Start API
```bash
cd apps/api
npm install
npm run build
npm run dev
```

The API listens on `http://localhost:4000`.

Available endpoints:
```text
GET  /health
POST /auth/register
POST /auth/login
POST /auth/verify-otp
```

Notes:
- `POST /auth/login` returns a development OTP in non-production mode.
- `POST /auth/verify-otp` returns a JWT access token.

## Start web app
```bash
cd apps/web
npm install
npm run dev
```

The web app runs on `http://localhost:3000` and talks to the API on `http://localhost:4000`.

## Environment
Copy `apps/api/.env.example` to `apps/api/.env` if you want to override the JWT settings.
