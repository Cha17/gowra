-- Add organizer_id field to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES users(id);

-- Add new fields to users table if they don't exist
DO $$ 
BEGIN
    -- Create user_role enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'organizer');
    END IF;
    
    -- Add role field to users table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role user_role DEFAULT 'user' NOT NULL;
    END IF;
    
    -- Add organization fields to users table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_name') THEN
        ALTER TABLE users ADD COLUMN organization_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_type') THEN
        ALTER TABLE users ADD COLUMN organization_type VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'event_types') THEN
        ALTER TABLE users ADD COLUMN event_types TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_description') THEN
        ALTER TABLE users ADD COLUMN organization_description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_website') THEN
        ALTER TABLE users ADD COLUMN organization_website VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organizer_since') THEN
        ALTER TABLE users ADD COLUMN organizer_since TIMESTAMP;
    END IF;
END $$;
