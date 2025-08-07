# Event Management System - Client

## Development Setup

This is the frontend application built with Next.js 15, React 19, and Tailwind CSS.

### Prerequisites

1. Node.js 18+ or Bun
2. Backend server running (see server README)
3. Environment variables configured (see `env.example` file)

### Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   # or
   bun install
   ```

2. **Set up environment variables:**

   ```bash
   cp env.example .env.local
   # Edit .env.local with your actual values
   ```

3. **Start development server:**

   ```bash
   npm run dev
   # or
   bun run dev
   ```

4. **Open your browser:**
   ```
   http://localhost:3000
   ```

### Available Scripts

#### Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

#### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Project Structure

```
app/
├── (auth)/          # Authentication pages
├── (dashboard)/     # User dashboard pages
├── (admin)/         # Admin pages
├── events/          # Event pages
├── about/           # About page
├── globals.css      # Global styles
├── layout.tsx       # Root layout
└── page.tsx         # Home page

components/
├── ui/              # Reusable UI components
├── auth/            # Authentication components
├── events/          # Event-related components
├── admin/           # Admin components
└── layout/          # Layout components

lib/
├── auth.ts          # Authentication utilities
├── api.ts           # API client utilities
└── utils.ts         # General utilities
```

### Environment Variables

Required environment variables (see `env.example`):

- `NEXT_PUBLIC_NEON_AUTH_PROJECT_ID` - Neon Auth project ID
- `NEXT_PUBLIC_NEON_AUTH_PUBLISHABLE_KEY` - Neon Auth publishable key
- `NEXT_PUBLIC_ADMIN_EMAILS` - Comma-separated list of admin emails
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8080)

### Features

#### User Features

- **Home Page**: Landing page with featured events
- **Events**: Browse and search events
- **Event Details**: View event information and register
- **User Dashboard**: Manage registrations and profile
- **Authentication**: Login/register with Neon Auth

#### Admin Features

- **Admin Dashboard**: Overview and management tools
- **Event Management**: Create, edit, delete events
- **Registration Management**: View and manage registrations
- **Reports**: Generate event and payment reports

### Development Workflow

1. **Component Development**: Create components in `components/` directory
2. **Page Development**: Add pages in `app/` directory
3. **API Integration**: Use utilities in `lib/` for API calls
4. **Styling**: Use Tailwind CSS for styling
5. **Testing**: Test components and pages
6. **Code Quality**: Lint → Format → Type check → Commit

### Technology Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Authentication**: Neon Auth
- **Type Safety**: TypeScript
- **State Management**: React Context + Hooks
- **HTTP Client**: Fetch API
- **Form Handling**: React Hook Form (to be added)
- **Notifications**: Sonner (to be added)

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Performance

- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic with Next.js
- **Caching**: Built-in caching strategies
- **SEO**: Server-side rendering and metadata
