
-- Add ticket_quantity column to registrations table
ALTER TABLE registrations ADD COLUMN ticket_quantity INTEGER NOT NULL DEFAULT 1;
