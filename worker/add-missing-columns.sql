-- Add missing organizer columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_type VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS event_types TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_description TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_website VARCHAR(255);
