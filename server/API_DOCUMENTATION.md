# Event Management System - API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL & Versioning](#base-url--versioning)
4. [Response Format](#response-format)
5. [Error Handling](#error-handling)
6. [Endpoints](#endpoints)
   - [Authentication](#authentication-endpoints)
   - [Admin](#admin-endpoints)
   - [Events](#events-endpoints)
   - [Registrations](#registrations-endpoints)
   - [Payments](#payments-endpoints)
   - [Database](#database-endpoints)
7. [Usage Examples](#usage-examples)
8. [Rate Limiting](#rate-limiting)
9. [Development](#development)

## Overview

The Event Management System API provides a comprehensive RESTful interface for managing events, user registrations, and payment processing. Built with Hono framework and PostgreSQL database, it supports both user and admin operations with proper authentication and authorization.

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

**Token Types:**

- **Access Token**: Valid for 15 minutes
- **Refresh Token**: Valid for 7 days

## Base URL & Versioning

- **Production**: `https://your-domain.com`
- **Development**: `http://localhost:8080`
- **API Version**: `/api/v1/`
- **Legacy Support**: `/api/` (redirects to v1)

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Data retrieved successfully"
}
```

## Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Rate Limited
- `500` - Internal Server Error

### Error Types

- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Invalid or expired token
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `DATABASE_ERROR` - Database operation failed

## Endpoints

### Authentication Endpoints

#### POST `/api/v1/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "isAdmin": false
    },
    "token": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  },
  "message": "User registered successfully"
}
```

#### POST `/api/v1/auth/login`

Authenticate user and receive tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "isAdmin": false
  },
  "message": "Login successful"
}
```

#### POST `/api/v1/auth/refresh`

Refresh access token using refresh token.

**Request Body:**

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

#### GET `/api/v1/auth/me`

Get current user profile (requires authentication).

#### PUT `/api/v1/auth/profile`

Update user profile (requires authentication).

#### POST `/api/v1/auth/logout`

Logout and revoke refresh token (requires authentication).

### Admin Endpoints

#### GET `/api/v1/admin/stats`

Get admin dashboard statistics (requires admin authentication).

#### GET `/api/v1/admin/users`

Get all users (requires admin authentication).

#### GET `/api/v1/admin/events`

Get all events with registration counts (requires admin authentication).

#### GET `/api/v1/admin/registrations`

Get all registrations (requires admin authentication).

#### GET `/api/v1/admin/payments`

Get all payments (requires admin authentication).

### Events Endpoints

#### GET `/api/v1/events`

Get all events with filtering and pagination.

**Query Parameters:**

- `search` - Search in name, description, venue
- `category` - Filter by event category
- `status` - Filter by event status
- `date` - Filter by event date
- `organizer` - Filter by organizer
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

#### GET `/api/v1/events/:id`

Get event by ID with registration details.

#### POST `/api/v1/events`

Create new event (requires admin authentication).

**Request Body:**

```json
{
  "name": "Tech Conference 2024",
  "description": "Annual technology conference",
  "date": "2024-06-15T09:00:00.000Z",
  "venue": "Convention Center",
  "price": 99.99,
  "capacity": 500,
  "category": "Technology",
  "status": "active",
  "registration_deadline": "2024-06-10T23:59:59.000Z",
  "organizer": "Tech Events Inc."
}
```

#### PUT `/api/v1/events/:id`

Update event (requires admin authentication).

#### DELETE `/api/v1/events/:id`

Delete event (requires admin authentication).

#### GET `/api/v1/events/stats/overview`

Get event statistics (requires admin authentication).

#### GET `/api/v1/events/search/advanced`

Advanced event search with multiple filters.

**Query Parameters:**

- `q` - Search query
- `category` - Event category
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `startDate` - Start date range
- `endDate` - End date range
- `status` - Event status
- `organizer` - Organizer name
- `hasCapacity` - Only events with available capacity

### Registrations Endpoints

#### GET `/api/v1/registrations`

Get all registrations (requires admin authentication).

**Query Parameters:**

- `eventId` - Filter by event ID
- `userId` - Filter by user ID
- `status` - Filter by registration status
- `paymentStatus` - Filter by payment status
- `page` - Page number
- `limit` - Items per page

#### GET `/api/v1/registrations/:id`

Get registration by ID (admin or owner).

#### GET `/api/v1/registrations/user/me`

Get current user's registrations (requires authentication).

#### POST `/api/v1/registrations`

Register for an event (requires authentication).

**Request Body:**

```json
{
  "eventId": "event-uuid",
  "additionalInfo": "Special dietary requirements"
}
```

#### PUT `/api/v1/registrations/:id`

Update registration (admin or owner).

#### DELETE `/api/v1/registrations/:id`

Cancel registration (admin or owner).

#### GET `/api/v1/registrations/stats/overview`

Get registration statistics (requires admin authentication).

### Payments Endpoints

#### GET `/api/v1/payments`

Get all payments (requires admin authentication).

**Query Parameters:**

- `registrationId` - Filter by registration ID
- `userId` - Filter by user ID
- `status` - Filter by payment status
- `paymentMethod` - Filter by payment method
- `startDate` - Start date range
- `endDate` - End date range
- `page` - Page number
- `limit` - Items per page

#### GET `/api/v1/payments/:id`

Get payment by ID (admin or owner).

#### GET `/api/v1/payments/user/me`

Get current user's payments (requires authentication).

#### POST `/api/v1/payments/process`

Process payment for registration (requires authentication).

**Request Body:**

```json
{
  "registrationId": "registration-uuid",
  "paymentMethod": "credit_card",
  "paymentAmount": 99.99,
  "paymentReference": "PAY-123456",
  "cardLast4": "1234",
  "cardBrand": "visa"
}
```

#### POST `/api/v1/payments/:id/refund`

Refund payment (requires admin authentication).

**Request Body:**

```json
{
  "refundAmount": 99.99,
  "refundReason": "Customer request"
}
```

#### GET `/api/v1/payments/stats/overview`

Get payment statistics (requires admin authentication).

### Database Endpoints

#### GET `/api/db/health`

Get database health status.

#### GET `/api/db/metrics`

Get database performance metrics.

#### POST `/api/db/maintenance`

Perform database maintenance (admin only).

**Request Body:**

```json
{
  "action": "createIndexes"
}
```

**Available Actions:**

- `createIndexes` - Create performance indexes
- `analyzeTables` - Analyze table statistics
- `vacuumTables` - Vacuum tables
- `optimizeStorage` - Optimize table storage

## Usage Examples

### Complete User Flow

1. **Register User**

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

2. **Login**

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

3. **Browse Events**

```bash
curl -X GET "http://localhost:8080/api/v1/events?category=Technology&page=1&limit=5"
```

4. **Register for Event**

```bash
curl -X POST http://localhost:8080/api/v1/registrations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "eventId": "event-uuid",
    "additionalInfo": "Vegetarian meal preference"
  }'
```

5. **Process Payment**

```bash
curl -X POST http://localhost:8080/api/v1/payments/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "registrationId": "registration-uuid",
    "paymentMethod": "credit_card",
    "paymentAmount": 99.99,
    "cardLast4": "1234",
    "cardBrand": "visa"
  }'
```

### Admin Operations

1. **Create Event**

```bash
curl -X POST http://localhost:8080/api/v1/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -d '{
    "name": "Workshop Series",
    "description": "Monthly workshops",
    "date": "2024-07-01T10:00:00.000Z",
    "venue": "Training Center",
    "price": 49.99,
    "capacity": 50,
    "category": "Education",
    "organizer": "Training Corp"
  }'
```

2. **Get Statistics**

```bash
curl -X GET http://localhost:8080/api/v1/admin/stats \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Window**: 15 minutes
- **Limit**: 100 requests per IP address
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Development

### Environment Variables

```bash
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
DEFAULT_ADMIN_PASSWORD=admin123
NODE_ENV=development
PORT=8080
```

### Running the Server

```bash
# Development
bun run dev

# Production
bun run start

# Build
bun run build
```

### Database Operations

```bash
# Initialize database
bun run db:init

# Generate migrations
bun run db:generate

# Run migrations
bun run db:migrate

# Open Drizzle Studio
bun run db:studio
```

### Testing Endpoints

```bash
# Health check
curl http://localhost:8080/health

# API status
curl http://localhost:8080/api/status

# Database health
curl http://localhost:8080/api/db/health
```

## Support

For API support and questions:

- Check the server logs for detailed error information
- Verify your authentication tokens are valid
- Ensure all required fields are provided in requests
- Check database connectivity if experiencing errors

---

**API Version**: 1.0.0  
**Last Updated**: January 2024  
**Framework**: Hono  
**Database**: PostgreSQL with Drizzle ORM
