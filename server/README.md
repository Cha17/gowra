# Event Management System - Server

## Development Setup

This is the backend API server built with Hono, Drizzle ORM, and Neon PostgreSQL.

### Prerequisites

1. Node.js 18+ or Bun
2. Neon database with Neon Auth enabled
3. Environment variables configured (see `env.example` file)

### Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

4. **Test the API:**
   ```bash
   curl http://localhost:8080
   ```

### Available Scripts

#### Development

- `npm run dev` - Start development server with hot reload
- `npm run start` - Start production server
- `npm run build` - Build for production

#### Database

- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio for database management
- `npm run codegen` - Generate Kysely types from database schema
- `npm run test:db` - Test database connection and operations

#### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

### Project Structure

```
src/
├── db/           # Database schema and connection
├── routes/       # API route handlers (to be created)
├── middleware/   # Custom middleware (to be created)
├── utils/        # Utility functions (to be created)
├── index.ts      # Main Hono app configuration
└── server.ts     # Server startup file
```

### Database Schema

The database includes the following tables:

- **events**: Stores event information (name, organizer, details, date, venue, etc.)
- **registrations**: Links users to events and tracks payment status
- **payment_history**: Detailed payment tracking and audit trails

### Environment Variables

Required environment variables (see `env.example`):

- `DATABASE_URL` - Neon database connection string
- `NEON_AUTH_SECRET_KEY` - Neon Auth secret key
- `ADMIN_EMAILS` - Comma-separated list of admin email addresses
- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment (development/production)

### API Endpoints

- `GET /` - Health check
- `GET /api/events` - List events (to be implemented)
- `POST /api/events` - Create event (to be implemented)
- `GET /api/events/:id` - Get event details (to be implemented)
- `PUT /api/events/:id` - Update event (to be implemented)
- `DELETE /api/events/:id` - Delete event (to be implemented)

### Development Workflow

1. **Database Changes**: Update schema → Generate migration → Run migration → Update types
2. **API Development**: Create routes → Add middleware → Test endpoints
3. **Code Quality**: Lint → Format → Type check → Commit
