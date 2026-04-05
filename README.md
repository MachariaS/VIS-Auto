# VIS Assist

Local development workspace for a NestJS API and a lightweight Vite frontend.

## Start services
```bash
docker compose up -d
```

This starts PostgreSQL for persistent application data.

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
GET  /vehicles
POST /vehicles
GET  /provider-services
GET  /provider-services/catalog
POST /provider-services
PUT  /provider-services/:serviceId
GET  /roadside-requests
POST /roadside-requests
POST /locations/suggest
POST /locations/resolve
```

Notes:
- `POST /auth/login` returns a development OTP in non-production mode.
- `POST /auth/verify-otp` returns a JWT access token.
- `POST /auth/register` now accepts `accountType` with `customer` or `provider`.
- Provider services support `basePriceKsh`, `pricePerKmKsh`, and optional fuel pricing for fuel delivery.
- Fuel delivery request estimates combine delivery pricing with the requested fuel litres and fuel type.
- Users, OTP challenges, vehicles, provider services, and roadside requests now persist in PostgreSQL.

## Start web app
```bash
cd apps/web
npm install
npm run dev
```

The web app runs on `http://localhost:3000` and talks to the API on `http://localhost:4000`.

## Environment
Copy `apps/api/.env.example` to `apps/api/.env` if you want to override the JWT or database settings.

For Google-level location suggestions, set:

```text
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

Enable these APIs for that key in Google Cloud:
- Places API
- Place Details API
- Geocoding API
