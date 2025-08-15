# Organizer Role Implementation Plan

## Overview

Adding a new "Organizer" user role to allow community leaders and event creators to manage their own events with limited system access. Users can automatically upgrade to organizer role when they want to create their first event.

**Implementation Focus**: Cloudflare Worker only, 5-day timeline

## System Architecture Decisions

### Authentication Structure

- **Keep separate admin table**: `admin_users` remains separate
- **Add role to users table**: `users` table gets `role` field ('user', 'organizer')
- **New events only**: Only new events use `organizer_id`, existing events keep string `organizer`
- **Focus**: Worker implementation only (ignore `/server` folder)

### Current vs New Role Structure

#### Before (2 roles)

- **User**: Basic participant access (in `users` table)
- **Admin**: Full system control (in `admin_users` table)

#### After (3 roles)

- **User**: Basic participant access (in `users` table, role='user')
- **Organizer**: Event creation/management for own events (in `users` table, role='organizer')
- **Admin**: Full system control (in `admin_users` table)

## Organizer Role Permissions

### ✅ What Organizers CAN do:

- Create new events
- Edit/update their own events only
- Delete their own events only
- Manage registrations for their own events
- View analytics/reports for their own events
- Access basic user data (name, email) for their event participants
- View their own event participant lists

### ❌ What Organizers CANNOT do:

- Access other organizers' events
- Manage system users (create/delete/edit users)
- Access admin dashboard/settings
- View system-wide analytics
- Modify other users' roles
- Access full user profiles/sensitive data

## Organizer Upgrade Flow (Self-Service)

### User Journey:

```
1. User signs up → Gets "user" role (standard registration)
2. User browses events, participates normally
3. User decides to create event → Clicks "Create Your First Event"
4. System shows "Become an Organizer" form (one-time only)
5. User fills additional info → Automatically becomes "organizer"
6. User can now create events and access organizer dashboard
```

### Organizer Registration Form:

**Required Fields:**

- Organization/Community Name
- Organization Type (dropdown: Non-profit, Business, Community Group, Educational, Government, Other)
- Primary Event Types (checkboxes: Workshop, Conference, Meetup, Social, Sports, Arts, etc.)
- Brief Organization Description (2-3 sentences)
- Organization Website/Social Media (optional)

**Process:**

- Only shown when user first tries to create an event
- After completion, user permanently has organizer role
- Can update this info later in organizer profile settings
- No admin approval required

## Database Changes Required

### 1. User Table Updates (Cloudflare Worker DB)

```sql
-- Create role enum for users table
CREATE TYPE user_role AS ENUM('user', 'organizer');

-- Add role field to users table
ALTER TABLE users ADD COLUMN role user_role DEFAULT 'user';

-- Add organizer profile fields
ALTER TABLE users ADD COLUMN organization_name VARCHAR(255);
ALTER TABLE users ADD COLUMN organization_type VARCHAR(100);
ALTER TABLE users ADD COLUMN event_types TEXT[]; -- JSON array for Worker
ALTER TABLE users ADD COLUMN organization_description TEXT;
ALTER TABLE users ADD COLUMN organization_website VARCHAR(255);
ALTER TABLE users ADD COLUMN organizer_since TIMESTAMP;
```

### 2. Events Table Updates

```sql
-- Add organizer relationship for NEW events only
ALTER TABLE events ADD COLUMN organizer_id UUID REFERENCES users(id);

-- Keep existing organizer VARCHAR field for old events
-- No migration of existing data needed
```

### 3. Admin Authentication

- Keep `admin_users` table separate
- Admin auth flow remains unchanged
- Admins can access all organizer features

## Authentication & JWT Changes

### Current JWT Structure:

```typescript
// Current
{ id, email, name, isAdmin: boolean }
```

### New JWT Structure:

```typescript
// Users (including organizers)
{ id, email, name, role: 'user'|'organizer', isAdmin: false }

// Admins (unchanged)
{ id, email, name, isAdmin: true }
```

### Authentication Middleware Updates:

```typescript
// New organizer middleware
const requireOrganizer = (c: any, next: any) => {
  const user = c.get("user");
  if (user.isAdmin) return next(); // Admins have organizer access
  if (user.role !== "organizer") {
    return c.json({ error: "Organizer access required" }, 403);
  }
  return next();
};

// Event ownership validation
const requireEventOwnership = async (c: any, next: any) => {
  const user = c.get("user");
  if (user.isAdmin) return next(); // Admins can access all events

  const eventId = c.req.param("id");
  const event = await db
    .selectFrom("events")
    .select(["organizer_id"])
    .where("id", "=", eventId)
    .executeTakeFirst();

  if (!event?.organizer_id || event.organizer_id !== user.id) {
    return c.json({ error: "Not authorized for this event" }, 403);
  }
  return next();
};
```

## API Endpoint Changes (Worker Only)

### New Organizer Upgrade Endpoint:

```typescript
POST /api/users/upgrade-to-organizer
{
  organizationName: "Tech Community Manila",
  organizationType: "Community Group",
  eventTypes: ["Workshop", "Meetup"],
  description: "A community for tech enthusiasts...",
  website: "https://techcommunity.ph"
}
// Response: Updates user role to 'organizer' and returns updated user data
```

### New Organizer Routes:

#### Events Management

- `GET /api/organizer/events` - Get organizer's own events
- `POST /api/organizer/events` - Create new event (organizer only)
- `PUT /api/organizer/events/:id` - Update own event
- `DELETE /api/organizer/events/:id` - Delete own event

#### Registration Management

- `GET /api/organizer/events/:id/registrations` - View registrations for own event
- `PUT /api/organizer/registrations/:id` - Approve/reject registrations
- `GET /api/organizer/events/:id/participants` - Get participant list

#### Analytics

- `GET /api/organizer/events/:id/analytics` - Event-specific analytics
- `GET /api/organizer/dashboard/stats` - Personal organizer dashboard stats

#### Profile Management

- `GET /api/organizer/profile` - Get organizer profile info
- `PUT /api/organizer/profile` - Update organizer info

### Modified Existing Endpoints:

- Update event creation to use `organizer_id` for new events
- Update event queries to handle both `organizer` (string) and `organizer_id` (UUID)
- Add organizer access to existing admin event endpoints

## Frontend Changes Required

### 1. Organizer Upgrade Flow

- **Location**: `/become-organizer`
- **Features**:
  - Welcome message and organizer benefits
  - Organization information form
  - Automatic role upgrade on submission
  - Redirect to event creation after upgrade

### 2. Navigation Updates

```typescript
// Role-based event creation button
{
  user.role === "user" && (
    <Button onClick={() => navigate("/become-organizer")}>
      Create Your First Event
    </Button>
  );
}

{
  (user.role === "organizer" || user.isAdmin) && (
    <Button onClick={() => navigate("/create-event")}>Create New Event</Button>
  );
}
```

### 3. New Organizer Pages

- **Organizer Dashboard**: `/organizer/dashboard`
- **Event Management**: `/organizer/events`
- **Registration Management**: `/organizer/events/:id/registrations`
- **Analytics**: `/organizer/events/:id/analytics`
- **Profile Settings**: `/organizer/profile`

### 4. Auth Context Updates

```typescript
// Update useAuthContext to handle user roles
interface User {
  id: string;
  email: string;
  name: string;
  role?: "user" | "organizer"; // For regular users
  isAdmin: boolean; // For admin users
  // Organizer fields (only if role === 'organizer')
  organizationName?: string;
  organizationType?: string;
  eventTypes?: string[];
  organizationDescription?: string;
  organizationWebsite?: string;
  organizerSince?: string;
}
```

## 5-Day Implementation Timeline

### Day 1: Database & Authentication Setup

**Morning:**

- [ ] Create database migration script
- [ ] Add user_role enum and role field to users table
- [ ] Add organizer profile fields to users table
- [ ] Add organizer_id field to events table

**Afternoon:**

- [ ] Update JWT token structure in worker/src/lib/auth.ts
- [ ] Update authentication middleware
- [ ] Create organizer-specific middleware (requireOrganizer, requireEventOwnership)
- [ ] Test authentication flow

### Day 2: Backend API Development

**Morning:**

- [ ] Implement organizer upgrade endpoint
- [ ] Create organizer routes file (worker/src/routes/organizer.ts)
- [ ] Implement organizer event management endpoints

**Afternoon:**

- [ ] Implement organizer registration management endpoints
- [ ] Update existing event creation to use organizer_id
- [ ] Add organizer analytics endpoints
- [ ] Test all organizer API endpoints

### Day 3: Frontend Auth & Upgrade Flow

**Morning:**

- [ ] Update frontend auth context (client/src/hooks/useAuth.ts)
- [ ] Update auth provider to handle user roles
- [ ] Create organizer upgrade page (/become-organizer)

**Afternoon:**

- [ ] Implement organizer upgrade form
- [ ] Update navigation for role-based access
- [ ] Test organizer upgrade flow
- [ ] Update existing pages for role-based rendering

### Day 4: Organizer Dashboard & Features

**Morning:**

- [ ] Create organizer dashboard layout
- [ ] Implement organizer event management page
- [ ] Create event creation/edit forms for organizers

**Afternoon:**

- [ ] Implement organizer registration management interface
- [ ] Add organizer analytics/reporting page
- [ ] Create organizer profile settings page
- [ ] Add organizer-specific navigation menu

### Day 5: Testing & Polish

**Morning:**

- [ ] Integration testing of complete organizer flow
- [ ] Test permission boundaries (ensure organizers can't access others' data)
- [ ] Test edge cases and error handling

**Afternoon:**

- [ ] UI/UX polish and bug fixes
- [ ] Security audit of organizer permissions
- [ ] Performance testing
- [ ] Documentation updates

## Security Considerations

1. **Data Isolation**: Strict checks ensuring organizers only access their own data
2. **Input Validation**: All organizer inputs properly sanitized
3. **Rate Limiting**: Prevent abuse of event creation (5 events per organizer per day)
4. **Audit Logging**: Track organizer actions for security
5. **File Uploads**: Secure handling of event images/documents
6. **Upgrade Validation**: Ensure only users can upgrade to organizer
7. **Role Consistency**: Prevent role downgrades without admin approval

## Event Creation Logic

### For New Events (by Organizers):

```typescript
// New events created by organizers
const newEvent = {
  name,
  details,
  date,
  venue,
  price,
  capacity,
  organizer: user.organizationName, // String for display
  organizer_id: user.id, // UUID reference for ownership
  status: "published",
};
```

### For Existing Events (Legacy):

```typescript
// Existing events keep string organizer, no organizer_id
// No migration needed - they remain as-is
```

### Query Logic:

```typescript
// Get organizer's events (only new events with organizer_id)
const organizerEvents = await db
  .selectFrom("events")
  .selectAll()
  .where("organizer_id", "=", user.id)
  .execute();

// Admin can see all events (both old and new)
const allEvents = await db.selectFrom("events").selectAll().execute();
```

## Success Metrics

- [ ] Users can smoothly upgrade to organizer role
- [ ] Organizers can create events independently
- [ ] No unauthorized access to other organizers' data
- [ ] Clean separation between organizer and admin functions
- [ ] High conversion rate from user to organizer
- [ ] Positive user feedback on upgrade process
- [ ] Zero data loss or corruption during implementation

## Risk Mitigation

### No Staging Environment:

- **Careful Testing**: Extensive local testing before deployment
- **Rollback Plan**: Keep database schema backwards compatible
- **Gradual Rollout**: Deploy backend first, then frontend
- **Monitoring**: Close monitoring of production after deployment

### Production Safety:

- **Database Backups**: Ensure recent backup before schema changes
- **Feature Flags**: Use environment variables to control new features
- **Progressive Enhancement**: New organizer features don't break existing user flows

---

_This plan ensures a focused, time-bound implementation of the organizer role while maintaining system stability and data integrity._
