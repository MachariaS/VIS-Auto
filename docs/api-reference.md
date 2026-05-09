# VIS Auto — API Reference

## Interactive docs (Swagger UI)

| Environment | URL |
|-------------|-----|
| Local | http://localhost:4000/api/docs |
| Staging | https://vis-auto-staging.up.railway.app/api/docs |
| Production | https://vis-auto-api-production-d71b4c628d38.herokuapp.com/api/docs |

Open any of those URLs in a browser to browse, read, and **execute every endpoint live**.
Click **Authorize** (top-right) and paste a JWT token to test protected routes.

---

## Authentication

Protected endpoints require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

Get a token by calling `POST /auth/login` or `POST /auth/verify-otp`.
Tokens expire after 15 minutes — use `POST /auth/refresh` (sends httpOnly cookie) to get a new one.

---

## Base URLs

| Environment | Base URL |
|-------------|----------|
| Local | http://localhost:4000 |
| Staging | https://vis-auto-staging.up.railway.app |
| Production | https://vis-auto-api-production-d71b4c628d38.herokuapp.com |

---

## Endpoints

### Health

#### `GET /health`
Check if the API is running. No auth required.

**Response**
```json
{ "status": "ok", "service": "vis-assist-api", "timestamp": "2026-05-09T12:00:00.000Z" }
```

---

### Auth

#### `POST /auth/register`
Create a new account. Sends an OTP to the email for verification.

**Body**
```json
{
  "name": "Samwel Macharia",
  "email": "sam@example.com",
  "phone": "+254712345678",
  "accountType": "car_owner",
  "password": "SecurePass1!",
  "businessName": "VIS Garage"  // providers only
}
```
`accountType` must be `"car_owner"` or `"provider"`.

---

#### `POST /auth/login`
Sign in with email and password. Returns access token + sets refresh cookie.

**Body**
```json
{ "email": "sam@example.com", "password": "SecurePass1!" }
```

**Response**
```json
{ "accessToken": "eyJ...", "user": { "id": "uuid", "name": "...", "accountType": "car_owner" } }
```

---

#### `POST /auth/verify-otp`
Verify the OTP sent to email after registration. Activates the account.

**Body**
```json
{ "email": "sam@example.com", "otp": "123456" }
```

---

#### `POST /auth/resend-otp`
Re-send the verification OTP if it expired.

**Body**
```json
{ "email": "sam@example.com" }
```

---

#### `POST /auth/forgot-password`
Send a password reset link to the user's email.

**Body**
```json
{ "email": "sam@example.com" }
```

---

#### `POST /auth/reset-password`
Set a new password using the token from the reset email.

**Body**
```json
{ "token": "reset-token-from-email", "newPassword": "NewPass1!" }
```

---

#### `POST /auth/refresh`
Use the httpOnly refresh cookie to get a new access token. No body needed.

**Response**
```json
{ "accessToken": "eyJ..." }
```

---

#### `POST /auth/logout`
Clears the refresh cookie on the server.

---

### Users 🔒

#### `GET /users/me/profile`
Get the current user's full profile including dispatch preferences and business info.

**Response**
```json
{
  "user": { "id": "...", "name": "...", "email": "...", "accountType": "car_owner" },
  "profile": { "account": {...}, "preferences": { "dispatch": {...} }, "business": {...} }
}
```

---

#### `PATCH /users/me/profile`
Update name, email, phone, and full profile settings.

**Body**
```json
{
  "name": "Samwel Macharia",
  "email": "sam@example.com",
  "phone": "+254712345678",
  "profile": { "preferences": { "theme": "dark", "dispatch": { "minProviderRating": 4.0 } } }
}
```

---

#### `POST /users/me/password`
Change password (requires current password).

**Body**
```json
{ "currentPassword": "OldPass1!", "newPassword": "NewPass1!" }
```

---

#### `PATCH /users/me/availability`
Providers only — toggle online/offline status. No body required.

**Response** — updated user object with `isOnline: true/false`.

---

#### `GET /users/me/provider-stats`
Providers only — earnings dashboard data.

**Response**
```json
{
  "totalEarnings": 45000,
  "thisMonthEarnings": 12000,
  "lastMonthEarnings": 9500,
  "completedJobs": 38,
  "cancelledJobs": 2,
  "completionRate": 95,
  "avgRating": 4.7,
  "ratingCount": 22,
  "topService": { "name": "Towing", "earnings": 18000, "count": 12 }
}
```

---

#### `DELETE /users/me`
Permanently delete account and all related data. Requires password confirmation.

**Body**
```json
{ "password": "MyPass1!" }
```

---

### Vehicles 🔒

#### `GET /vehicles`
List all vehicles registered to the current user.

**Response** — array of vehicle objects.

---

#### `POST /vehicles`
Add a new vehicle.

**Body**
```json
{
  "nickname": "My Prado",
  "make": "Toyota",
  "model": "Prado",
  "year": 2020,
  "registrationNumber": "KDG 123A",
  "color": "White",
  "notes": "Sunroof"
}
```

---

#### `PATCH /vehicles/:id/profile`
Update vehicle metadata (color, notes, service history, etc.).

**Body** — any key/value profile fields to update.

---

### Service Catalog (Public)

#### `GET /service-catalog`
Browse all available service categories and their services. Used by providers during registration and customers when browsing.

**Response** — array of groups:
```json
[
  {
    "category": "Roadside emergency",
    "services": [
      { "id": "uuid", "code": "towing", "name": "Towing", "description": "..." }
    ]
  }
]
```

---

#### `GET /service-catalog/:code`
Get a single catalog entry by its code (e.g., `towing`, `battery_jump_start`).

---

### Provider Services 🔒

#### `GET /provider-services/catalog`
List all online providers currently accepting jobs. Supports location filtering and returns personalised `matchReasons` badges when `vehicleId` is passed.

**Query params**
| Param | Description |
|-------|-------------|
| `lat` | Customer latitude (for proximity sorting) |
| `lng` | Customer longitude |
| `vehicleId` | Enables brand-match and history-based badges |

**Response** — array of provider services with `matchReasons: ["Top rated", "Toyota specialist"]`.

---

#### `GET /provider-services`
List the current provider's own services.

---

#### `POST /provider-services/bulk`
Providers — add multiple services from the catalog at once.

**Body**
```json
{ "serviceCatalogIds": ["uuid1", "uuid2"] }
```

---

#### `POST /provider-services`
Providers — create a custom service not in the catalog.

**Body**
```json
{
  "serviceName": "Custom Diagnostics",
  "serviceCode": "on_site_diagnosis",
  "basePriceKsh": 2500,
  "pricePerKmKsh": 100,
  "description": "On-site engine scan"
}
```

---

#### `PUT /provider-services/:serviceId`
Update a provider service's pricing and details.

---

#### `PATCH /provider-services/:serviceId/visibility`
Set whether the service is `public`, `private`, or `estimation_only`.

**Body**
```json
{ "visibility": "public" }
```

---

#### `PATCH /provider-services/:serviceId/availability`
Toggle whether the service is currently accepting jobs.

**Body**
```json
{ "isAcceptingJobs": false }
```

---

#### `DELETE /provider-services/:serviceId`
Remove a service from the provider's listing.

---

### Providers (Public)

#### `GET /providers/:id/profile`
Public profile for a provider — used by customers in the manual provider picker.

**Response**
```json
{
  "id": "uuid",
  "name": "VIS Garage",
  "memberSince": "2025-01-15T...",
  "services": [...],
  "avgRating": 4.7,
  "ratingCount": 22,
  "starBreakdown": [{ "star": 5, "count": 18 }, ...],
  "completedJobs": 38,
  "completionRate": 95,
  "recentReviews": [{ "score": 5, "comment": "...", "customerName": "..." }]
}
```

---

### Roadside Requests 🔒

#### `GET /roadside-requests`
List the current customer's roadside requests (most recent first).

**Query params**
| Param | Description |
|-------|-------------|
| `vehicleId` | Filter by a specific vehicle |

---

#### `GET /roadside-requests/provider`
Providers — list all jobs assigned to them (active + history).

---

#### `GET /roadside-requests/dispatch-preview`
Preview which provider would be dispatched for a given service + location — without creating a request. Used in Step 4 of the request flow to show the customer who they'll be matched with.

**Query params**
| Param | Required | Description |
|-------|----------|-------------|
| `catalogCode` | ✅ | e.g. `towing` |
| `lat` | ✅ | Customer latitude |
| `lng` | ✅ | Customer longitude |
| `vehicleId` | — | Enables brand-match scoring |

**Response**
```json
{
  "providerId": "uuid",
  "providerName": "VIS Garage",
  "avgRating": 4.7,
  "distanceKm": 2.3,
  "basePriceKsh": 2500,
  "matchBadges": ["Brand match", "Served you before"],
  "score": 87
}
```

---

#### `POST /roadside-requests`
Create a new job request. Supports two modes:

**Auto-dispatch mode** (recommended) — system picks the nearest best-scored provider:
```json
{
  "vehicleId": "uuid",
  "catalogCode": "towing",
  "latitude": -1.2921,
  "longitude": 36.8219,
  "address": "Westlands, Nairobi",
  "landmark": "Near Sarit Centre",
  "notes": "Car won't start"
}
```

**Manual mode** — customer picks a specific provider:
```json
{
  "vehicleId": "uuid",
  "providerServiceId": "uuid",
  "distanceKm": 3.5,
  "latitude": -1.2921,
  "longitude": 36.8219,
  "address": "Westlands, Nairobi"
}
```

---

#### `GET /roadside-requests/:id/status`
Live tracking status for a specific request. Used by both customer and provider.

**Response**
```json
{
  "id": "uuid",
  "status": "provider_assigned",
  "etaMinutes": 8,
  "providerName": "VIS Garage",
  "providerLocation": { "latitude": -1.285, "longitude": 36.815, "updatedAt": "..." }
}
```

---

#### `PATCH /roadside-requests/:id/status`
Providers — advance the job lifecycle.

**Allowed transitions**

| From | To |
|------|----|
| `searching` | `provider_assigned` |
| `provider_assigned` | `in_progress` |
| `in_progress` | `completed` |
| Any active | `cancelled` (with optional reason) |

**Body**
```json
{ "status": "in_progress", "cancellationReason": "Out of fuel" }
```

---

#### `POST /roadside-requests/:id/decline`
Providers — decline a dispatched job. Triggers immediate re-dispatch to the next nearest provider. Does **not** cancel the job for the customer.

---

#### `POST /roadside-requests/:id/cancel`
Customers — cancel their own request at any stage.

**Body**
```json
{ "reason": "Found help elsewhere" }
```

---

#### `PATCH /roadside-requests/:id/provider-location`
Providers — update their live GPS position during a job. Recalculates ETA automatically. Also sent via WebSocket for real-time customer map updates.

**Body**
```json
{ "latitude": -1.285, "longitude": 36.815 }
```

---

### Ratings 🔒

#### `POST /ratings/:requestId`
Submit a rating for a completed job.

**Body**
```json
{ "score": 5, "comment": "Arrived fast, very professional" }
```
Score must be 1–5.

---

#### `GET /providers/:providerId/ratings`
Get all ratings for a provider.

---

#### `GET /ratings/:requestId/check`
Check if the current user has already rated a specific request.

**Response**
```json
{ "hasRated": true }
```

---

### Notifications 🔒

#### `GET /notifications`
Get the current user's notifications (most recent 50).

**Response** — array of notification objects with `isRead`, `type`, `refId` (request ID for deep linking), `createdAt`.

---

#### `GET /notifications/unread-count`
Lightweight badge count endpoint — polled every 20 seconds by the frontend.

**Response**
```json
{ "count": 3 }
```

---

#### `PATCH /notifications/:id/read`
Mark a single notification as read.

---

#### `PATCH /notifications/read-all`
Mark all notifications as read.

---

### Locations (Public)

#### `POST /locations/suggest`
Autocomplete address search. Backed by Google Maps (if API key set) with Nominatim fallback.

**Body**
```json
{ "query": "Westlands", "nearLat": -1.2921, "nearLng": 36.8219, "countryCode": "KE" }
```

**Response** — array of `{ address, name, lat, lng, landmark }`.

---

#### `POST /locations/resolve`
Resolve a full address from coordinates (reverse geocode).

**Body**
```json
{ "latitude": -1.2921, "longitude": 36.8219 }
```

---

#### `POST /locations/reverse`
Alias for resolve — returns human-readable address for a lat/lng pair.

**Body**
```json
{ "lat": -1.2921, "lng": 36.8219 }
```

---

### Vendors 🔒

#### `GET /vendors`
Providers — list their vendor network (partner providers).

---

#### `POST /vendors/requests/:requestId/accept`
Accept a vendor partnership request from another provider.

---

#### `DELETE /vendors/requests/:requestId`
Reject or remove a vendor partnership request.

---

## WebSocket events

Connect to: `wss://<api-base>/roadside`

| Event (emit) | Direction | Payload | Description |
|-------------|-----------|---------|-------------|
| `join-request` | Client → Server | `requestId: string` | Join a request room to receive live updates |
| `join-provider` | Client → Server | `providerId: string` | Join provider channel to receive job offers |
| `provider-location` | Client → Server | `{ requestId, providerId, latitude, longitude }` | Provider sends live GPS to customer map |
| `job-offer` | Server → Client | full job object | Dispatched to provider when a job is assigned |
| `tracking-update` | Server → Client | `{ requestId, providerLatitude, providerLongitude, etaMinutes }` | Provider GPS update pushed to customer |
| `status-update` | Server → Client | tracking status object | Job status changed (accepted, started, completed) |
| `re-dispatch-update` | Server → Client | `{ attempt, message, exhausted }` | Provider declined — system finding next match |

---

## Status codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No content (e.g. mark-read) |
| 400 | Bad request — validation error, invalid transition |
| 401 | Unauthorized — missing or expired token |
| 403 | Forbidden — wrong account type |
| 404 | Not found |
| 409 | Conflict — e.g. email already registered |
| 429 | Too many requests — rate limit hit |

---

## Request statuses

| Status | Meaning |
|--------|---------|
| `searching` | Created, waiting for a provider to accept |
| `provider_assigned` | Provider accepted, en route |
| `in_progress` | Provider has arrived, service started |
| `completed` | Job done |
| `cancelled` | Cancelled by customer or provider |
| `dispatch_exhausted` | 3 providers declined — customer must choose manually |
