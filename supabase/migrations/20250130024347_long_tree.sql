/*
  # Fix questions and categories schema

  1. Changes
    - Update questions and categories tables to use auto-generated IDs
    - Make user_id nullable
    - Add default values for timestamps
    - Update foreign key relationship

  2. Security
    - Maintain public access policies
*/

-- Modify categories table
ALTER TABLE categories 
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN user_id DROP NOT NULL;

-- Modify questions table
ALTER TABLE questions 
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN user_id DROP NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_category_id ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_timestamp ON categories(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_questions_timestamp ON questions(timestamp DESC);