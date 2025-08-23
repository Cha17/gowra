-- Add organizer_id column to events table
-- This column will store the UUID reference to the users table for proper organizer linking

ALTER TABLE events 
ADD COLUMN organizer_id UUID REFERENCES users(id);

-- Add an index for better query performance
CREATE INDEX idx_events_organizer_id ON events(organizer_id);

-- Update existing events to set organizer_id based on the organizer string field
-- This is a safety measure for any existing events
-- Note: This will only work if the organizer string matches a user's name or email
UPDATE events 
SET organizer_id = u.id 
FROM users u 
WHERE events.organizer = u.name OR events.organizer = u.email;

-- Display the current events table structure
\d events;
