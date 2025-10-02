# API Documentation Quick Start

## Overview

This directory contains comprehensive OpenAPI 3.0 documentation for the Form Management API.

## Files Structure

```
docs/api/
├── openapi.yaml              # Complete OpenAPI 3.0 specification
├── README.md                 # Comprehensive API usage guide
├── POSTMAN_COLLECTION.json   # Postman collection for testing
└── QUICK_START.md           # This file
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `express` - Web framework
- `swagger-ui-express` - Interactive API documentation
- `yamljs` - YAML parser for OpenAPI spec
- `cors`, `helmet`, `morgan` - Security and logging middleware
- `dotenv` - Environment configuration

### 2. Start the API Server

```bash
# Development mode with auto-reload
npm run api:dev

# Or production mode
npm start
```

The server will start on http://localhost:3000

### 3. Access Interactive Documentation

Open your browser and navigate to:

**http://localhost:3000/api-docs**

This provides:
- Interactive API testing interface
- Complete endpoint documentation
- Request/response examples
- Schema definitions
- Authentication testing

### 4. Alternative Documentation Formats

- **JSON Spec**: http://localhost:3000/api-docs.json
- **YAML Spec**: http://localhost:3000/api-docs.yaml
- **Health Check**: http://localhost:3000/api-docs/health

## Testing the API

### Option 1: Swagger UI (Recommended)

1. Navigate to http://localhost:3000/api-docs
2. Click "Authorize" button
3. Register a new user via `/auth/register`
4. Copy the JWT token from the response
5. Enter token in the authorization dialog
6. Test any endpoint directly in the browser

### Option 2: Postman

1. Import `POSTMAN_COLLECTION.json` into Postman
2. The collection includes:
   - Pre-configured requests for all endpoints
   - Environment variables
   - Automatic token management
   - Test scripts

Import steps:
```
1. Open Postman
2. File → Import
3. Select POSTMAN_COLLECTION.json
4. Collection will be imported with all requests
```

### Option 3: cURL

```bash
# Register a user
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login and get token
TOKEN=$(curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }' | jq -r '.data.token')

# Create a form
curl -X POST http://localhost:3000/v1/forms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Contact Form",
    "status": "published",
    "fields": [
      {
        "name": "name",
        "label": "Name",
        "type": "text",
        "required": true
      }
    ]
  }'
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp src/.env.example .env
```

Key variables:
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret key for JWT tokens
- `CORS_ORIGIN` - Allowed CORS origins
- `NODE_ENV` - Environment (development/production)

### Security

**IMPORTANT**: Before deploying to production:

1. Change `JWT_SECRET` to a strong random value
2. Set `CORS_ORIGIN` to your frontend domain
3. Enable HTTPS
4. Configure rate limiting
5. Set up database connection
6. Configure email service

## Validation

### Validate OpenAPI Specification

```bash
npm run validate:openapi
```

This checks the OpenAPI YAML file for:
- Syntax errors
- Schema compliance
- Reference integrity
- Best practices

## Code Generation

Generate client SDKs from the OpenAPI specification:

### JavaScript/TypeScript

```bash
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3000/api-docs.json \
  -g typescript-axios \
  -o ./generated/typescript-client
```

### Python

```bash
openapi-generator-cli generate \
  -i http://localhost:3000/api-docs.json \
  -g python \
  -o ./generated/python-client
```

### Other Languages

The OpenAPI Generator supports 50+ languages and frameworks:
- Java, C#, Go, Ruby, PHP, Swift, Kotlin
- And many more...

Visit: https://openapi-generator.tech/docs/generators

## API Features

### Authentication
- JWT-based authentication
- User registration and login
- Token refresh mechanism
- Secure password hashing

### Form Management
- Create, read, update, delete forms
- Dynamic field definitions
- Validation rules
- Form duplication
- Status management (draft/published/archived)

### Submissions
- Form submission with validation
- Submission retrieval and filtering
- Date range filtering
- Pagination support

### Analytics
- Submission statistics
- Completion rates
- Field-level analytics
- Time-based reporting

### File Upload
- Multipart file upload
- File size validation
- MIME type checking
- Secure file storage

## API Endpoints Summary

| Category | Endpoints | Auth Required |
|----------|-----------|---------------|
| Authentication | 4 | Mixed |
| Forms | 6 | Yes |
| Submissions | 4 | Mixed |
| Users | 2 | Yes |
| Analytics | 1 | Yes |
| Files | 1 | Yes |

**Total**: 18 endpoints

## Response Format

All responses follow this structure:

**Success**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

**Error**:
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "field": "fieldName"
  }
}
```

## Pagination

Paginated endpoints support:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sort` - Sort order (e.g., "createdAt:desc")

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Rate Limiting

- **Authenticated**: 1000 requests/hour
- **Unauthenticated**: 100 requests/hour

Rate limit headers in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 998
X-RateLimit-Reset: 1633046400
```

## Error Codes

Common error codes:
- `VALIDATION_ERROR` - Input validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `USER_EXISTS` - User already registered
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** (not in localStorage)
3. **Implement token refresh** before expiration
4. **Handle errors gracefully** with user-friendly messages
5. **Use pagination** for large datasets
6. **Validate inputs** on both client and server
7. **Implement retry logic** for transient errors
8. **Monitor rate limits** to avoid throttling

## Support & Documentation

- **Full API Guide**: See `README.md` in this directory
- **OpenAPI Spec**: `openapi.yaml`
- **Interactive Docs**: http://localhost:3000/api-docs
- **Postman Collection**: `POSTMAN_COLLECTION.json`

## Next Steps

1. Read the full `README.md` for detailed examples
2. Import Postman collection for easy testing
3. Explore the interactive Swagger UI
4. Generate client SDKs for your preferred language
5. Review the OpenAPI specification for complete details

## Troubleshooting

### Server won't start

- Check if port 3000 is available
- Verify all dependencies are installed
- Check for syntax errors in configuration files

### Swagger UI not loading

- Ensure server is running
- Check browser console for errors
- Verify OpenAPI YAML is valid (`npm run validate:openapi`)

### Authentication failing

- Verify JWT_SECRET is set
- Check token format in Authorization header
- Ensure token hasn't expired

### CORS errors

- Configure CORS_ORIGIN in .env
- Add your frontend URL to allowed origins
- Enable CORS in server configuration

## Contributing

When updating the API:

1. Update `openapi.yaml` with new endpoints
2. Add examples to the specification
3. Update README.md with usage instructions
4. Validate changes: `npm run validate:openapi`
5. Test in Swagger UI
6. Update Postman collection if needed

---

**Version**: 1.0.0
**Last Updated**: 2025-10-02
**Maintained by**: API Documentation Team
