-- Add the missing attachment_url column to the evaluations table
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS attachment_url text;
