# Form Management API Documentation

## Overview

The Form Management API provides a comprehensive RESTful interface for creating, managing, and analyzing dynamic forms. This API enables developers to build powerful form-based applications with features like real-time validation, analytics, file uploads, and user authentication.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Request & Response Format](#request--response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Code Examples](#code-examples)
- [Best Practices](#best-practices)

## Getting Started

### Base URLs

- **Production**: `https://api.formapi.example.com/v1`
- **Staging**: `https://staging-api.formapi.example.com/v1`
- **Development**: `http://localhost:3000/v1`

### Interactive Documentation

Access the interactive Swagger UI documentation at:
- **Local**: http://localhost:3000/api-docs
- **Production**: https://api.formapi.example.com/api-docs

### Quick Start

1. **Register a new user account**
```bash
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecureP@ssw0rd",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

2. **Authenticate and get a token**
```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecureP@ssw0rd"
  }'
```

3. **Use the token for authenticated requests**
```bash
curl -X GET http://localhost:3000/v1/forms \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header for all protected endpoints.

### Getting a Token

**Endpoint**: `POST /v1/auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### Using the Token

Include the token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Refresh

When your token expires, use the refresh endpoint:

**Endpoint**: `POST /v1/auth/refresh`

```json
{
  "refreshToken": "your-refresh-token"
}
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | User login | No |
| POST | `/auth/refresh` | Refresh access token | Yes |
| POST | `/auth/logout` | Logout user | Yes |

### Forms

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/forms` | List all forms | Yes |
| POST | `/forms` | Create new form | Yes |
| GET | `/forms/{formId}` | Get form details | Yes |
| PUT | `/forms/{formId}` | Update form | Yes |
| DELETE | `/forms/{formId}` | Delete form | Yes |
| POST | `/forms/{formId}/duplicate` | Duplicate form | Yes |

### Submissions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/forms/{formId}/submissions` | Get form submissions | Yes |
| POST | `/forms/{formId}/submissions` | Submit form | No |
| GET | `/submissions/{submissionId}` | Get submission details | Yes |
| DELETE | `/submissions/{submissionId}` | Delete submission | Yes |

### Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/me` | Get current user | Yes |
| PUT | `/users/me` | Update current user | Yes |

### Analytics

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/forms/{formId}/analytics` | Get form analytics | Yes |

### Files

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/files/upload` | Upload file | Yes |

## Request & Response Format

### Standard Response Structure

All API responses follow this structure:

**Success Response**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "field": "fieldName" // Optional
  }
}
```

### Pagination

Paginated endpoints return data with pagination metadata:

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Sort field and order (e.g., `createdAt:desc`)

## Error Handling

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 422 | Validation Error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Error Codes

Common error codes returned in the `error.code` field:

- `VALIDATION_ERROR`: Input validation failed
- `UNAUTHORIZED`: Authentication required or failed
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `USER_EXISTS`: User already registered
- `INVALID_CREDENTIALS`: Invalid email or password
- `TOKEN_EXPIRED`: JWT token has expired
- `RATE_LIMIT_EXCEEDED`: Too many requests

### Validation Errors

For validation errors, the response includes detailed field-level errors:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

## Rate Limiting

API requests are rate-limited to ensure fair usage:

- **Authenticated requests**: 1000 requests per hour
- **Unauthenticated requests**: 100 requests per hour

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 998
X-RateLimit-Reset: 1633046400
```

When rate limited, you'll receive a 429 status code:

```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "retryAfter": 3600
  }
}
```

## Code Examples

### JavaScript/Node.js

#### Creating a Form

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000/v1';
const TOKEN = 'your-jwt-token';

async function createForm() {
  try {
    const response = await axios.post(
      `${API_URL}/forms`,
      {
        title: 'Customer Feedback Form',
        description: 'Collect customer feedback',
        status: 'published',
        fields: [
          {
            name: 'name',
            label: 'Your Name',
            type: 'text',
            required: true,
            validation: {
              minLength: 2,
              maxLength: 100
            }
          },
          {
            name: 'email',
            label: 'Email Address',
            type: 'email',
            required: true
          },
          {
            name: 'rating',
            label: 'Overall Rating',
            type: 'rating',
            required: true,
            options: {
              max: 5
            }
          },
          {
            name: 'feedback',
            label: 'Your Feedback',
            type: 'textarea',
            required: true,
            validation: {
              minLength: 10,
              maxLength: 1000
            }
          }
        ],
        settings: {
          allowMultipleSubmissions: false,
          showProgressBar: true,
          successMessage: 'Thank you for your feedback!'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Form created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating form:', error.response?.data || error.message);
    throw error;
  }
}

createForm();
```

#### Submitting a Form

```javascript
async function submitForm(formId) {
  try {
    const response = await axios.post(
      `${API_URL}/forms/${formId}/submissions`,
      {
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          rating: 5,
          feedback: 'Great service! Very satisfied with the product.'
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Form submitted:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      console.error('Validation errors:', error.response.data.errors);
    } else {
      console.error('Error submitting form:', error.response?.data || error.message);
    }
    throw error;
  }
}
```

#### Getting Form Analytics

```javascript
async function getFormAnalytics(formId, period = 'month') {
  try {
    const response = await axios.get(
      `${API_URL}/forms/${formId}/analytics`,
      {
        params: { period },
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        }
      }
    );

    console.log('Analytics:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics:', error.response?.data || error.message);
    throw error;
  }
}
```

### Python

#### Creating a Form

```python
import requests
import json

API_URL = 'http://localhost:3000/v1'
TOKEN = 'your-jwt-token'

def create_form():
    headers = {
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': 'application/json'
    }

    form_data = {
        'title': 'Event Registration',
        'description': 'Register for our annual conference',
        'status': 'published',
        'fields': [
            {
                'name': 'fullName',
                'label': 'Full Name',
                'type': 'text',
                'required': True
            },
            {
                'name': 'email',
                'label': 'Email',
                'type': 'email',
                'required': True
            },
            {
                'name': 'attendeeType',
                'label': 'Attendee Type',
                'type': 'select',
                'required': True,
                'options': [
                    {'value': 'speaker', 'label': 'Speaker'},
                    {'value': 'attendee', 'label': 'Attendee'},
                    {'value': 'sponsor', 'label': 'Sponsor'}
                ]
            }
        ]
    }

    response = requests.post(
        f'{API_URL}/forms',
        headers=headers,
        json=form_data
    )

    if response.status_code == 201:
        print('Form created successfully!')
        print(json.dumps(response.json(), indent=2))
        return response.json()
    else:
        print(f'Error: {response.status_code}')
        print(response.json())
        return None

form = create_form()
```

#### Submitting a Form

```python
def submit_form(form_id):
    submission_data = {
        'data': {
            'fullName': 'Jane Smith',
            'email': 'jane@example.com',
            'attendeeType': 'speaker'
        }
    }

    response = requests.post(
        f'{API_URL}/forms/{form_id}/submissions',
        json=submission_data
    )

    if response.status_code == 201:
        print('Form submitted successfully!')
        return response.json()
    else:
        print(f'Submission failed: {response.status_code}')
        print(response.json())
        return None
```

### cURL Examples

#### Register and Login

```bash
# Register
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecureP@ssw0rd",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecureP@ssw0rd"
  }'
```

#### Working with Forms

```bash
# List forms
curl -X GET "http://localhost:3000/v1/forms?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create form
curl -X POST http://localhost:3000/v1/forms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Contact Form",
    "description": "Simple contact form",
    "status": "published",
    "fields": [
      {
        "name": "name",
        "label": "Name",
        "type": "text",
        "required": true
      },
      {
        "name": "email",
        "label": "Email",
        "type": "email",
        "required": true
      }
    ]
  }'

# Get form
curl -X GET http://localhost:3000/v1/forms/FORM_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update form
curl -X PUT http://localhost:3000/v1/forms/FORM_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "archived"
  }'

# Delete form
curl -X DELETE http://localhost:3000/v1/forms/FORM_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### File Upload

```bash
curl -X POST http://localhost:3000/v1/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "fieldName=attachment"
```

## Best Practices

### 1. Security

- **Always use HTTPS** in production
- **Store tokens securely** (not in localStorage for web apps)
- **Implement token refresh** before expiration
- **Validate all inputs** on client and server
- **Use strong passwords** with minimum requirements

### 2. Error Handling

- **Check response status codes** before processing data
- **Handle validation errors** gracefully with user-friendly messages
- **Implement retry logic** for transient errors
- **Log errors** for debugging and monitoring

### 3. Performance

- **Use pagination** for large datasets
- **Cache responses** when appropriate
- **Compress request/response** data
- **Batch operations** when possible
- **Implement debouncing** for search/filter operations

### 4. Form Design

- **Keep forms simple** and focused
- **Use appropriate field types** for better UX
- **Provide clear validation messages**
- **Implement progressive disclosure** for complex forms
- **Test on multiple devices** and browsers

### 5. Data Management

- **Validate data** before submission
- **Sanitize user inputs** to prevent XSS
- **Implement proper CORS** configuration
- **Regular backups** of form data
- **GDPR compliance** for user data

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:

- **YAML**: `/api-docs.yaml`
- **JSON**: `/api-docs.json`
- **Interactive UI**: `/api-docs`

You can use these files to:
- Generate client SDKs in multiple languages
- Import into API testing tools (Postman, Insomnia)
- Validate requests and responses
- Auto-generate documentation

## Code Generation

Generate client libraries using the OpenAPI specification:

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

### Java

```bash
openapi-generator-cli generate \
  -i http://localhost:3000/api-docs.json \
  -g java \
  -o ./generated/java-client
```

## Support

For issues, questions, or feature requests:

- **Email**: support@formapi.example.com
- **Documentation**: https://formapi.example.com/docs
- **GitHub**: https://github.com/yourorg/form-api

## Changelog

### Version 1.0.0 (2025-10-02)

- Initial API release
- Authentication with JWT
- Form CRUD operations
- Form submission handling
- User management
- Analytics endpoints
- File upload support
- OpenAPI 3.0 documentation
