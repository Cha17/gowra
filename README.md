# Event Management System

A modern event management system built with Next.js, Hono, Drizzle ORM, and Neon PostgreSQL.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Neon database with Neon Auth enabled
- Git

### Setup

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd event-management-system
   ```

2. **Set up the server:**

   ```bash
   cd server
   npm install
   cp env.example .env
   # Edit .env with your actual values
   npm run dev
   ```

3. **Set up the client:**

   ```bash
   cd ../client
   npm install
   cp env.example .env.local
   # Edit .env.local with your actual values
   npm run dev
   ```

4. **Open your browser:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

## 📁 Project Structure

```
event-management-system/
├── client/                 # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── lib/              # Utilities and helpers
│   └── public/           # Static assets
├── server/                # Hono backend
│   ├── src/
│   │   ├── db/           # Database schema and connection
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Custom middleware
│   │   └── utils/        # Utility functions
│   └── drizzle/          # Database migrations
└── README.md             # This file
```

## 🛠 Technology Stack

### Frontend (Client)

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Authentication**: Neon Auth
- **Type Safety**: TypeScript
- **Notifications**: Sonner

### Backend (Server)

- **Framework**: Hono
- **Database**: Neon PostgreSQL
- **ORM**: Drizzle ORM
- **Type Generation**: Kysely Codegen
- **Authentication**: Neon Auth (JWT)
- **Runtime**: Bun/Node.js

### Database

- **Provider**: Neon
- **Type**: PostgreSQL
- **Auth**: Neon Auth (built-in)

### Payment

- **Provider**: NextPay
- **Integration**: REST API

## 🎯 Features

### User Features

- ✅ User registration and authentication
- ✅ Browse events with search and filters
- ✅ Event registration with payment
- ✅ User dashboard and profile management
- ✅ Registration history and status tracking

### Admin Features

- ✅ Admin authentication and role management
- ✅ Event creation, editing, and deletion
- ✅ Registration management and approval
- ✅ Payment tracking and management
- ✅ Reports and analytics

### Technical Features

- ✅ Type-safe database operations
- ✅ Real-time payment status updates
- ✅ Responsive design
- ✅ SEO optimization
- ✅ Performance optimization

## 🔧 Development

### Available Scripts

#### Server

```bash
cd server
npm run dev          # Start development server
npm run build        # Build for production
npm run db:generate  # Generate database migrations
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Drizzle Studio
npm run codegen      # Generate Kysely types
npm run test:db      # Test database connection
```

#### Client

```bash
cd client
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Environment Variables

#### Server (.env)

```bash
DATABASE_URL=your_neon_db_url
NEON_AUTH_SECRET_KEY=your_neon_auth_secret
ADMIN_EMAILS=admin@example.com
PORT=3001
NODE_ENV=development
```

#### Client (.env.local)

```bash
NEXT_PUBLIC_NEON_AUTH_PROJECT_ID=your_project_id
NEXT_PUBLIC_NEON_AUTH_PUBLISHABLE_KEY=your_publishable_key
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 📊 Database Schema

### Core Tables

- **events**: Event information and details
- **registrations**: User event registrations
- **payment_history**: Payment tracking and audit

### Relationships

- Users can register for multiple events
- Each registration has payment history
- Events can have multiple registrations

## 🔐 Authentication

- **Provider**: Neon Auth
- **Method**: JWT tokens
- **Roles**: User and Admin
- **Session**: HTTP-only cookies

## 💳 Payment Integration

- **Provider**: NextPay
- **Flow**: Registration → Payment → Confirmation
- **Webhooks**: Real-time status updates
- **Methods**: Multiple payment options

## 🚀 Deployment

### Vercel Deployment

1. Connect repository to Vercel
2. Configure environment variables
3. Deploy both client and server
4. Set up custom domains

### Environment Setup

- Configure production environment variables
- Set up database connections
- Configure payment webhooks
- Set up monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Check the documentation in each directory
- Review the README files
- Open an issue on GitHub

## 🗺 Roadmap

### Phase 1: Core Setup ✅

- [x] Project structure and configuration
- [x] Database schema and migrations
- [x] Development environment setup

### Phase 2: Authentication (Next)

- [ ] Neon Auth integration
- [ ] User registration and login
- [ ] Admin role management

### Phase 3: Backend API (Next)

- [ ] Event CRUD operations
- [ ] Registration management
- [ ] API documentation

### Phase 4: Frontend Pages (Next)

- [ ] Home and events pages
- [ ] User dashboard
- [ ] Admin interface

### Phase 5: Payment Integration (Next)

- [ ] NextPay integration
- [ ] Payment flow
- [ ] Webhook handling

### Phase 6: Polish & Deploy (Next)

- [ ] Testing and optimization
- [ ] Production deployment
- [ ] Monitoring and analytics
