/*
  # Fix Chapter Progress Table Schema
  
  1. Changes
    - Add `completed_learning_points` column (text array) to store IDs of completed learning points
    - Add `created_at` column with default timestamp
    - Add `updated_at` column with default timestamp
    - Add trigger to auto-update `updated_at` column
    - Add unique constraint on user_id + chapter_id if not exists
  
  2. Security
    - No changes to existing RLS policies
  
  3. Notes
    - This fixes the missing columns that are required by the application
    - Existing data will be preserved
*/

-- Add completed_learning_points column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chapter_progress' AND column_name = 'completed_learning_points'
  ) THEN
    ALTER TABLE public.chapter_progress 
    ADD COLUMN completed_learning_points TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;
END $$;

-- Add created_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chapter_progress' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.chapter_progress 
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chapter_progress' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.chapter_progress 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
  END IF;
END $$;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chapter_progress_user_id_chapter_id_key'
  ) THEN
    ALTER TABLE public.chapter_progress
    ADD CONSTRAINT chapter_progress_user_id_chapter_id_key UNIQUE(user_id, chapter_id);
  END IF;
END $$;

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_chapter_progress_updated_at'
  ) THEN
    CREATE TRIGGER update_chapter_progress_updated_at
      BEFORE UPDATE ON public.chapter_progress
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;