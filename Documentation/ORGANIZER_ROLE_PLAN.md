# Organizer Role Implementation Plan

## Overview

Adding a new "Organizer" user role to allow community leaders and event creators to manage their own events with limited system access. Users can automatically upgrade to organizer role when they want to create their first event.

## Current vs New Role Structure

### Before (2 roles)

- **User**: Basic participant access
- **Admin**: Full system control + event management

### After (3 roles)

- **User**: Basic participant access
- **Organizer**: Event creation/management for own events
- **Admin**: Full system control

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
1. User signs up → Gets "User" role (standard registration)
2. User browses events, participates normally
3. User decides to create event → Clicks "Create Your First Event"
4. System shows "Become an Organizer" form (one-time only)
5. User fills additional info → Automatically becomes "Organizer"
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

### 1. User Table Updates

```sql
-- Update existing role enum to include 'organizer'
ALTER TYPE user_role ADD VALUE 'organizer';
-- or if using string: role can be 'user', 'organizer', or 'admin'

-- Add organizer profile fields
ALTER TABLE users ADD COLUMN organization_name VARCHAR(255);
ALTER TABLE users ADD COLUMN organization_type VARCHAR(100);
ALTER TABLE users ADD COLUMN event_types TEXT[]; -- or JSON array
ALTER TABLE users ADD COLUMN organization_description TEXT;
ALTER TABLE users ADD COLUMN organization_website VARCHAR(255);
ALTER TABLE users ADD COLUMN organizer_since TIMESTAMP;
```

### 2. Events Table Updates

```sql
-- Add organizer relationship
ALTER TABLE events ADD COLUMN organizer_id INTEGER REFERENCES users(id);
-- Update existing events to have admin as organizer (migration)
```

### 3. New Permission Checks

- Event ownership validation
- Role-based route protection
- Data access restrictions

## API Endpoint Changes

### New Organizer Upgrade Endpoint:

```javascript
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

### New/Modified Endpoints:

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

- All admin event endpoints need organizer access checks
- User registration endpoints need organizer notification logic

## Frontend Changes Required

### 1. Organizer Upgrade Flow

- **Location**: `/become-organizer`
- **Features**:
  - Welcome message and organizer benefits
  - Organization information form
  - Automatic role upgrade on submission
  - Redirect to event creation after upgrade

### 2. Navigation Updates

```javascript
// Role-based event creation button
{
  user.role === "user" && (
    <Button onClick={() => navigate("/become-organizer")}>
      Create Your First Event
    </Button>
  );
}

{
  user.role === "organizer" && (
    <Button onClick={() => navigate("/create-event")}>Create New Event</Button>
  );
}
```

### 3. New Organizer Dashboard

- **Location**: `/organizer/dashboard`
- **Features**:
  - My Events overview
  - Quick stats (total events, registrations, etc.)
  - Recent activity feed
  - Create new event button
  - Organization info display

### 4. Organizer Event Management

- **Location**: `/organizer/events`
- **Features**:
  - List of organizer's events
  - Create/Edit/Delete event forms
  - Event status management
  - Quick actions (duplicate event, toggle active)

### 5. Organizer Registration Management

- **Location**: `/organizer/events/:id/registrations`
- **Features**:
  - Registration list with filters
  - Approve/reject actions
  - Export participant data
  - Send messages to participants

### 6. Organizer Analytics

- **Location**: `/organizer/events/:id/analytics`
- **Features**:
  - Registration trends
  - Demographic insights (basic)
  - Export reports

### 7. Organizer Profile Settings

- **Location**: `/organizer/profile`
- **Features**:
  - Update organization information
  - Change event types
  - Add/update organization website
  - View organizer since date

## Authentication & Authorization Changes

### 1. Route Protection

```javascript
// New middleware for organizer routes
const requireOrganizer = (req, res, next) => {
  if (req.user.role !== "organizer" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Organizer access required" });
  }
  next();
};

// Event ownership validation
const requireEventOwnership = async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (event.organizer_id !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Not authorized for this event" });
  }
  next();
};

// Organizer upgrade validation
const validateOrganizerUpgrade = (req, res, next) => {
  const { organizationName, organizationType, eventTypes, description } =
    req.body;

  if (!organizationName || !organizationType || !eventTypes || !description) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (req.user.role !== "user") {
    return res.status(400).json({ error: "Already an organizer or admin" });
  }

  next();
};
```

### 2. Frontend Route Guards

- Organizer-only routes
- Event ownership checks
- Role-based component rendering
- Redirect logic for organizer upgrade

## Implementation Phase Breakdown

### Phase 1: Database & Backend API

1. Update user role enum/type
2. Add organizer profile fields to users table
3. Add organizer_id to events table
4. Create data migration for existing events
5. Implement organizer upgrade endpoint
6. Add authentication middleware
7. Create new organizer API endpoints

### Phase 2: Organizer Upgrade Flow

1. Create organizer upgrade form/page
2. Implement role upgrade logic
3. Add navigation updates for role-based buttons
4. Update authentication flow
5. Add redirect logic after upgrade

### Phase 3: Organizer Core Features

1. Create organizer dashboard layout
2. Implement event management pages
3. Add organizer profile management
4. Update existing event creation flow

### Phase 4: Registration Management

1. Build registration management interface
2. Add participant communication features
3. Implement approval/rejection workflow
4. Add participant data export

### Phase 5: Analytics & Reports

1. Create organizer analytics dashboard
2. Add event-specific reporting
3. Implement data export features
4. Add organizer dashboard statistics

### Phase 6: Testing & Polish

1. Unit tests for new endpoints
2. Integration tests for role permissions
3. UI/UX testing for upgrade flow
4. Security audit of permissions
5. Performance testing

## Data Migration Strategy

### For Existing Events:

```sql
-- Assign all existing events to first admin user
UPDATE events
SET organizer_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
WHERE organizer_id IS NULL;
```

### For Existing Users:

- No migration needed - all current users remain as 'user' role
- They can upgrade to organizer when they want to create events

## Security Considerations

1. **Data Isolation**: Strict checks ensuring organizers only access their own data
2. **Input Validation**: All organizer inputs properly sanitized
3. **Rate Limiting**: Prevent abuse of event creation
4. **Audit Logging**: Track organizer actions for security
5. **File Uploads**: Secure handling of event images/documents
6. **Upgrade Validation**: Ensure only users can upgrade to organizer
7. **Role Consistency**: Prevent role downgrades without admin approval

## Success Metrics

- Users can smoothly upgrade to organizer role
- Organizers can create events independently
- No unauthorized access to other organizers' data
- Clean separation between organizer and admin functions
- High conversion rate from user to organizer
- Positive user feedback on upgrade process

## User Experience Enhancements

### Optional Features:

1. **Email confirmation**: Send welcome email after organizer upgrade
2. **Onboarding tutorial**: Guide new organizers through features
3. **Organization verification**: Optional badge for verified organizations
4. **Organizer community**: Allow organizers to connect with each other

### Analytics to Track:

- User to organizer conversion rate
- Time from signup to first event creation
- Organizer engagement metrics
- Most popular organization types

## Timeline Estimate

- **Phase 1**: 3-4 days
- **Phase 2**: 2-3 days
- **Phase 3**: 3-4 days
- **Phase 4**: 2-3 days
- **Phase 5**: 2-3 days
- **Phase 6**: 2-3 days

**Total**: ~14-20 days

---

_This plan ensures a seamless organizer upgrade experience while maintaining proper access controls and empowering community leaders to create events independently._
