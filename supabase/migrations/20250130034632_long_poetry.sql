/*
  # Add subcategories support

  1. New Tables
    - `subcategories`
      - `id` (text, primary key)
      - `name` (text)
      - `category_id` (text, references categories)
      - `timestamp` (timestamptz)

  2. Changes
    - Add `parent_id` and `parent_type` to questions table
    - Update existing questions to use their category_id as parent_id

  3. Security
    - Enable RLS on subcategories table
    - Add public access policy
*/

-- Create subcategories table
CREATE TABLE subcategories (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  category_id text NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Add parent_id and parent_type to questions
ALTER TABLE questions
  ADD COLUMN parent_type text CHECK (parent_type IN ('category', 'subcategory')),
  ADD COLUMN parent_id text;

-- Update existing questions to use category as parent
UPDATE questions
SET parent_type = 'category',
    parent_id = category_id;

-- Enable RLS
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Public access to subcategories"
  ON subcategories
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX idx_questions_parent ON questions(parent_type, parent_id);