-- Migration: Add intelligent status tracking fields to tasks table
-- This migration adds the new fields required for the intelligent task status system
-- SAFE: This migration only ADDS new columns and does not modify existing data destructively

-- Add new columns with safe defaults
ALTER TABLE "tasks" 
ADD COLUMN IF NOT EXISTS "dueDateModifiedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "statusModifiedByUser" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "wasEnProgreso" BOOLEAN NOT NULL DEFAULT false;

-- Add indexes for performance on new fields (only if they don't exist)
CREATE INDEX IF NOT EXISTS "tasks_dueDateModifiedAt_idx" ON "tasks"("dueDateModifiedAt");
CREATE INDEX IF NOT EXISTS "tasks_statusModifiedByUser_idx" ON "tasks"("statusModifiedByUser");
CREATE INDEX IF NOT EXISTS "tasks_wasEnProgreso_idx" ON "tasks"("wasEnProgreso");

-- SAFE DATA MIGRATION: Only update NULL values, preserve existing tasks
-- Set dueDateModifiedAt to createdAt for tasks that have a dueDate (only if currently NULL)
UPDATE "tasks" 
SET "dueDateModifiedAt" = "createdAt" 
WHERE "dueDate" IS NOT NULL AND "dueDateModifiedAt" IS NULL;

-- For existing tasks currently in progress, set the tracking flags (preserve all existing data)
UPDATE "tasks" 
SET "statusModifiedByUser" = true, "wasEnProgreso" = true 
WHERE "status" = 'IN_PROGRESS' AND "statusModifiedByUser" = false;

-- All existing tasks remain unchanged except for the new tracking fields
-- No tasks are deleted, modified, or removed
