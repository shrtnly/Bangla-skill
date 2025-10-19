/*
  # Add Learning Tracking Tables

  1. New Tables
    - `enrollments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `course_id` (uuid, foreign key to courses)
      - `enrolled_at` (timestamp)
      - `status` (text: active, completed, cancelled)
      - Unique constraint on user_id + course_id

    - `learning_points`
      - `id` (uuid, primary key)
      - `chapter_id` (uuid, foreign key to chapters)
      - `title` (text)
      - `content` (text)
      - `order_index` (integer)
      - `created_at` (timestamp)

    - `chapter_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `chapter_id` (uuid, foreign key to chapters)
      - `completed` (boolean, default false)
      - `completed_learning_points` (text array)
      - `completed_at` (timestamp)
      - `created_at` (timestamp)
      - Unique constraint on user_id + chapter_id

    - `module_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `module_id` (uuid, foreign key to modules)
      - `status` (text: not_started, in_progress, completed)
      - `learning_completed` (boolean, default false)
      - `practice_quiz_passed` (boolean, default false)
      - `quiz_passed` (boolean, default false)
      - `completed` (boolean, default false)
      - `score` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - Unique constraint on user_id + module_id

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Indexes
    - Add indexes for foreign keys and common queries
*/

-- Create enrollments table
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Create learning_points table
CREATE TABLE IF NOT EXISTS public.learning_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chapter_progress table
CREATE TABLE IF NOT EXISTS public.chapter_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_learning_points TEXT[] DEFAULT ARRAY[]::TEXT[],
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);

-- Create module_progress table
CREATE TABLE IF NOT EXISTS public.module_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'practice_ready')),
  learning_completed BOOLEAN NOT NULL DEFAULT false,
  practice_quiz_passed BOOLEAN NOT NULL DEFAULT false,
  quiz_passed BOOLEAN NOT NULL DEFAULT false,
  completed BOOLEAN NOT NULL DEFAULT false,
  score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Enable Row Level Security
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for enrollments
CREATE POLICY "Users can view their own enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enrollments"
  ON public.enrollments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments"
  ON public.enrollments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for learning_points (public read for enrolled users)
CREATE POLICY "Anyone can view learning points"
  ON public.learning_points FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for chapter_progress
CREATE POLICY "Users can view their own chapter progress"
  ON public.chapter_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chapter progress"
  ON public.chapter_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chapter progress"
  ON public.chapter_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for module_progress
CREATE POLICY "Users can view their own module progress"
  ON public.module_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own module progress"
  ON public.module_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own module progress"
  ON public.module_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_points_chapter_id ON public.learning_points(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_progress_user_id ON public.chapter_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_progress_chapter_id ON public.chapter_progress(chapter_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_user_id ON public.module_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_module_id ON public.module_progress(module_id);

-- Add triggers for updated_at
CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chapter_progress_updated_at
  BEFORE UPDATE ON public.chapter_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_module_progress_updated_at
  BEFORE UPDATE ON public.module_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add missing columns to modules table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'modules' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE public.modules ADD COLUMN duration_minutes INTEGER DEFAULT 120;
  END IF;
END $$;

-- Add missing columns to chapters table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chapters' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE public.chapters ADD COLUMN duration_minutes INTEGER DEFAULT 30;
  END IF;
END $$;
