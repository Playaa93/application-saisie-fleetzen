# Field Agent Intervention Tracking API Documentation

## Overview

RESTful API for managing field agent interventions, built with Next.js 15 App Router.

**Base URL:** `http://localhost:3000/api` (development)

---

## Authentication

All endpoints (except `/api/auth/login`) require JWT authentication.

### Headers

```
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### 1. Authentication

#### POST `/api/auth/login`

Authenticate field agent and create session.

**Request Body:**
```json
{
  "email": "agent@example.com",
  "password": "password123",
  "deviceId": "device-uuid-optional",
  "deviceName": "iPhone 15 Pro",
  "deviceType": "mobile"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "email": "agent@example.com",
      "fullName": "John Doe",
      "role": "user",
      "organizationId": "org-uuid"
    },
    "session": {
      "id": "session-uuid",
      "expiresAt": "2025-11-02T00:00:00Z"
    }
  }
}
```

---

### 2. Interventions

#### GET `/api/interventions`

List interventions with filtering.

**Query Parameters:**
- `status` - Filter by status (pending, in_progress, completed, cancelled)
- `clientId` - Filter by client UUID
- `vehicleId` - Filter by vehicle UUID
- `agentId` - Filter by agent UUID
- `fromDate` - Filter from date (ISO 8601)
- `toDate` - Filter to date (ISO 8601)
- `search` - Search in multiple fields
- `limit` - Results per page (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "intervention": {
        "id": "intervention-uuid",
        "interventionNumber": "INT-12345678-ABCD",
        "title": "Oil change",
        "status": "completed",
        "priority": "normal",
        "scheduledDate": "2025-10-01T10:00:00Z",
        "completedAt": "2025-10-01T11:30:00Z"
      },
      "client": {
        "id": "client-uuid",
        "name": "ACME Corp",
        "code": "ACM001"
      },
      "vehicle": {
        "id": "vehicle-uuid",
        "registrationNumber": "AB-123-CD",
        "brand": "Renault",
        "model": "Master"
      },
      "type": {
        "id": "type-uuid",
        "name": "Maintenance",
        "code": "MAINT",
        "color": "#3B82F6"
      },
      "agent": {
        "id": "agent-uuid",
        "fullName": "John Doe",
        "email": "agent@example.com"
      }
    }
  ],
  "meta": {
    "limit": 50,
    "offset": 0,
    "count": 1
  }
}
```

#### POST `/api/interventions`

Create new intervention.

**Request Body:**
```json
{
  "clientId": "client-uuid",
  "vehicleId": "vehicle-uuid",
  "typeId": "type-uuid",
  "title": "Oil change and filter replacement",
  "description": "Scheduled maintenance",
  "status": "pending",
  "priority": "normal",
  "scheduledDate": "2025-10-05T09:00:00Z",
  "location": "Paris, France",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "customFields": {
    "urgency": "routine",
    "estimatedHours": 2
  },
  "mileageStart": 150000,
  "notes": "Customer requested specific oil brand"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "intervention": { /* full intervention object */ },
    "client": { /* client details */ },
    "vehicle": { /* vehicle details */ },
    "type": { /* intervention type */ },
    "agent": { /* agent details */ }
  }
}
```

---

### 3. Batch Sync (Offline Support)

#### POST `/api/interventions/sync`

Batch sync offline interventions.

**Request Body:**
```json
{
  "interventions": [
    {
      "localId": "local-uuid-1",
      "clientId": "client-uuid",
      "vehicleId": "vehicle-uuid",
      "typeId": "type-uuid",
      "title": "Emergency repair",
      "status": "completed",
      "completedAt": "2025-10-01T14:30:00Z",
      "workPerformed": "Replaced brake pads",
      "photos": [
        {
          "localPath": "/local/path/photo1.jpg",
          "url": "https://storage.com/photo1.jpg",
          "fileName": "brake_before.jpg",
          "fileSize": 524288,
          "mimeType": "image/jpeg",
          "photoType": "before"
        }
      ]
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": [
      {
        "localId": "local-uuid-1",
        "intervention": { /* synced intervention */ }
      }
    ],
    "failed": []
  },
  "meta": {
    "total": 1,
    "succeeded": 1,
    "failed": 0
  }
}
```

---

### 4. Photo Upload

#### POST `/api/photos/upload`

Upload and compress intervention photos (max 1MB per photo).

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `interventionId` (required) - Intervention UUID
- `photos` (required) - File(s) to upload
- `caption` (optional) - Photo caption
- `photoType` (optional) - Type: before, after, damage, general, part
- `latitude` (optional) - GPS latitude
- `longitude` (optional) - GPS longitude

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "photo-uuid",
      "interventionId": "intervention-uuid",
      "url": "/uploads/interventions/photo.jpg",
      "fileName": "original-name.jpg",
      "fileSize": 987654,
      "mimeType": "image/jpeg",
      "photoType": "before",
      "createdAt": "2025-10-02T12:00:00Z"
    }
  ],
  "meta": {
    "count": 1
  }
}
```

---

### 5. Intervention Types

#### GET `/api/intervention-types`

Get available intervention types.

**Query Parameters:**
- `includeInactive` - Include inactive types (default: false)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "type-uuid",
      "name": "Maintenance",
      "code": "MAINT",
      "description": "Regular maintenance work",
      "color": "#3B82F6",
      "icon": "wrench",
      "defaultFields": [],
      "requiredFields": ["workPerformed"],
      "estimatedDuration": 120,
      "isActive": true
    }
  ],
  "meta": {
    "count": 1
  }
}
```

---

### 6. Vehicles

#### GET `/api/vehicles`

List vehicles with optional filtering.

**Query Parameters:**
- `clientId` - Filter by client UUID
- `search` - Search in registration, brand, model, VIN
- `vehicleType` - Filter by type
- `includeInactive` - Include inactive vehicles (default: false)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "vehicle": {
        "id": "vehicle-uuid",
        "registrationNumber": "AB-123-CD",
        "brand": "Renault",
        "model": "Master",
        "year": 2020,
        "vehicleType": "van",
        "fuelType": "diesel",
        "mileage": 150000,
        "isActive": true
      },
      "client": {
        "id": "client-uuid",
        "name": "ACME Corp",
        "code": "ACM001"
      }
    }
  ],
  "meta": {
    "count": 1
  }
}
```

---

### 7. Clients

#### GET `/api/clients`

List clients for organization.

**Query Parameters:**
- `search` - Search in name, code, contact info, city
- `includeInactive` - Include inactive clients (default: false)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "client-uuid",
      "name": "ACME Corporation",
      "code": "ACM001",
      "contactName": "Jane Smith",
      "contactEmail": "contact@acme.com",
      "contactPhone": "+33123456789",
      "address": "123 Main St",
      "city": "Paris",
      "postalCode": "75001",
      "country": "France",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "count": 1
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": { /* optional error details */ }
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## Rate Limiting

Currently not implemented. Consider adding rate limiting for production.

---

## Offline Sync Flow

1. **Offline Mode**: App creates interventions with `localId`
2. **Online Mode**: Use `/api/interventions/sync` to batch upload
3. **Deduplication**: Server uses `localId` to prevent duplicates
4. **Photo Upload**: Upload photos separately via `/api/photos/upload`

---

## File Upload Constraints

- **Max file size**: 1MB (after compression)
- **Allowed formats**: JPEG, PNG, WebP
- **Auto-compression**: Images resized to max 2048px
- **Storage**: Local filesystem (`/public/uploads/interventions`)

---

## Security Considerations

1. **JWT Secret**: Change `JWT_SECRET` in production
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS for mobile apps
4. **File Upload**: Validate file types and sizes
5. **SQL Injection**: Drizzle ORM provides protection
6. **XSS**: Sanitize user inputs
7. **Rate Limiting**: Implement for production

---

## Development Setup

1. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Configure environment variables:
   ```env
   DATABASE_URL=postgresql://user:pass@localhost:5432/db
   JWT_SECRET=your-secret-key-min-32-chars
   ```

3. Run migrations:
   ```bash
   npm run db:migrate
   ```

4. Start dev server:
   ```bash
   npm run dev
   ```

---

## Testing

Use tools like Postman, Insomnia, or curl:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@example.com","password":"password"}'

# Get interventions
curl http://localhost:3000/api/interventions \
  -H "Authorization: Bearer <token>"

# Upload photo
curl -X POST http://localhost:3000/api/photos/upload \
  -H "Authorization: Bearer <token>" \
  -F "interventionId=uuid" \
  -F "photos=@photo.jpg" \
  -F "photoType=before"
```
