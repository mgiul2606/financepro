-- Migration: Update users table schema to match application models
-- This migration adds missing columns and changes id from INTEGER to UUID
--
-- IMPORTANT: This migration will modify the users table structure.
-- Backup your data before running this migration!
--
-- Run this migration manually in your database:
-- psql -h <host> -U <user> -d <database> -f migrations/001_update_users_schema.sql

BEGIN;

-- Step 1: Add new columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- Step 2: Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 3: Add a temporary UUID column
ALTER TABLE users ADD COLUMN id_new UUID;

-- Step 4: Generate UUIDs for existing rows
UPDATE users SET id_new = uuid_generate_v4();

-- Step 5: Update foreign keys in related tables (if they exist)
-- Note: Adjust these based on your actual schema

-- Financial Profiles (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'financial_profiles') THEN
        -- Add temporary UUID column
        ALTER TABLE financial_profiles ADD COLUMN user_id_new UUID;

        -- Map old integer IDs to new UUIDs
        UPDATE financial_profiles fp
        SET user_id_new = u.id_new
        FROM users u
        WHERE fp.user_id = u.id;

        -- Drop old foreign key constraint (if exists)
        ALTER TABLE financial_profiles DROP CONSTRAINT IF EXISTS financial_profiles_user_id_fkey;

        -- Drop old column and rename new one
        ALTER TABLE financial_profiles DROP COLUMN user_id;
        ALTER TABLE financial_profiles RENAME COLUMN user_id_new TO user_id;

        -- Make it NOT NULL
        ALTER TABLE financial_profiles ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- Chat Conversations (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_conversations') THEN
        ALTER TABLE chat_conversations ADD COLUMN user_id_new UUID;

        UPDATE chat_conversations cc
        SET user_id_new = u.id_new
        FROM users u
        WHERE cc.user_id = u.id;

        ALTER TABLE chat_conversations DROP CONSTRAINT IF EXISTS chat_conversations_user_id_fkey;
        ALTER TABLE chat_conversations DROP COLUMN user_id;
        ALTER TABLE chat_conversations RENAME COLUMN user_id_new TO user_id;
        ALTER TABLE chat_conversations ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- Audit Logs (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        ALTER TABLE audit_logs ADD COLUMN user_id_new UUID;

        UPDATE audit_logs al
        SET user_id_new = u.id_new
        FROM users u
        WHERE al.user_id = u.id;

        ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
        ALTER TABLE audit_logs DROP COLUMN user_id;
        ALTER TABLE audit_logs RENAME COLUMN user_id_new TO user_id;
        -- user_id is nullable in audit_logs
    END IF;
END $$;

-- Step 6: Drop the old id column and rename the new one in users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE users DROP COLUMN id;
ALTER TABLE users RENAME COLUMN id_new TO id;

-- Step 7: Set the new id column as primary key
ALTER TABLE users ADD PRIMARY KEY (id);

-- Step 8: Create index on id (if not automatically created with PRIMARY KEY)
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);

-- Step 9: Re-create foreign key constraints
-- Financial Profiles
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'financial_profiles') THEN
        ALTER TABLE financial_profiles
        ADD CONSTRAINT financial_profiles_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

        CREATE INDEX IF NOT EXISTS idx_financial_profiles_user_id ON financial_profiles(user_id);
    END IF;
END $$;

-- Chat Conversations
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_conversations') THEN
        ALTER TABLE chat_conversations
        ADD CONSTRAINT chat_conversations_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

        CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
    END IF;
END $$;

-- Audit Logs
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        ALTER TABLE audit_logs
        ADD CONSTRAINT audit_logs_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    END IF;
END $$;

COMMIT;

-- Verify the migration
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
