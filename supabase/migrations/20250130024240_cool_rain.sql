/*
  # Update schema and policies for public access

  1. Changes
    - Rename column from categoryId to category_id in questions table
    - Remove user-specific policies
    - Add public access policies

  2. Security
    - Enable public access to both tables
    - Remove user-specific restrictions
*/

DO $$ 
BEGIN
  -- Rename column if it exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'questions'
    AND column_name = 'categoryId'
  ) THEN
    ALTER TABLE questions RENAME COLUMN "categoryId" TO category_id;
  END IF;
END $$;

-- Update RLS policies to allow anonymous access
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can create their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

DROP POLICY IF EXISTS "Users can view their own questions" ON questions;
DROP POLICY IF EXISTS "Users can create their own questions" ON questions;
DROP POLICY IF EXISTS "Users can update their own questions" ON questions;
DROP POLICY IF EXISTS "Users can delete their own questions" ON questions;

-- Create new policies for public access
CREATE POLICY "Public access to categories"
  ON categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public access to questions"
  ON questions
  FOR ALL
  USING (true)
  WITH CHECK (true);