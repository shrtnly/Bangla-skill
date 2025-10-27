/*
  # Add Certificates Table

  1. New Table
    - `certificates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `course_id` (uuid, foreign key to courses)
      - `module_id` (uuid, foreign key to modules, nullable)
      - `certificate_number` (text, unique)
      - `certificate_type` (text: course, module)
      - `issue_date` (timestamp)
      - `expiry_date` (timestamp, nullable)
      - `verification_code` (text, unique)
      - `certificate_data` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on certificates table
    - Policies for users to view own certificates and public verification
  
  3. Functions
    - Certificate number generation
    - Verification code generation
    - Auto certificate generation on course completion
*/

-- Create certificates table
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  certificate_number TEXT NOT NULL UNIQUE,
  certificate_type TEXT NOT NULL DEFAULT 'course' CHECK (certificate_type IN ('course', 'module')),
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  verification_code TEXT NOT NULL UNIQUE,
  certificate_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable Row Level Security
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own certificates"
  ON public.certificates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can verify certificates by code"
  ON public.certificates FOR SELECT
  TO public
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON public.certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON public.certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_number ON public.certificates(certificate_number);

-- Trigger for updated_at
CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Generate certificate number
CREATE OR REPLACE FUNCTION public.generate_certificate_number(
  p_course_id UUID,
  p_user_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_random TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW())::TEXT;
  v_random := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
  RETURN 'CERT-' || v_year || '-' || SUBSTRING(p_course_id::TEXT FROM 1 FOR 8) || '-' || SUBSTRING(p_user_id::TEXT FROM 1 FOR 8) || '-' || v_random;
END;
$$;

-- Generate verification code
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM public.certificates WHERE verification_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

-- Check and generate certificate
CREATE OR REPLACE FUNCTION public.check_and_generate_certificate(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_modules INTEGER;
  v_completed_modules INTEGER;
  v_certificate_exists BOOLEAN;
  v_certificate_number TEXT;
  v_verification_code TEXT;
  v_certificate_id UUID;
  v_course_title TEXT;
  v_user_name TEXT;
  v_certificate_data JSONB;
BEGIN
  -- Check if certificate already exists
  SELECT EXISTS(
    SELECT 1 FROM public.certificates 
    WHERE user_id = p_user_id AND course_id = p_course_id
  ) INTO v_certificate_exists;
  
  IF v_certificate_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Certificate already exists'
    );
  END IF;
  
  -- Get total and completed modules
  SELECT COUNT(*) INTO v_total_modules
  FROM public.modules
  WHERE course_id = p_course_id;
  
  SELECT COUNT(*) INTO v_completed_modules
  FROM public.module_progress mp
  INNER JOIN public.modules m ON mp.module_id = m.id
  WHERE mp.user_id = p_user_id 
    AND m.course_id = p_course_id
    AND mp.quiz_passed = true;
  
  IF v_completed_modules < v_total_modules THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Not all modules completed',
      'completed', v_completed_modules,
      'total', v_total_modules
    );
  END IF;
  
  -- Get details
  SELECT title INTO v_course_title FROM public.courses WHERE id = p_course_id;
  SELECT full_name INTO v_user_name FROM public.profiles WHERE id = p_user_id;
  
  -- Generate codes
  v_certificate_number := public.generate_certificate_number(p_course_id, p_user_id);
  v_verification_code := public.generate_verification_code();
  
  -- Build data
  v_certificate_data := jsonb_build_object(
    'course_title', v_course_title,
    'student_name', v_user_name,
    'completion_date', NOW(),
    'total_modules', v_total_modules,
    'certificate_number', v_certificate_number,
    'verification_code', v_verification_code
  );
  
  -- Insert certificate
  INSERT INTO public.certificates (
    user_id,
    course_id,
    certificate_number,
    certificate_type,
    verification_code,
    certificate_data,
    issue_date
  ) VALUES (
    p_user_id,
    p_course_id,
    v_certificate_number,
    'course',
    v_verification_code,
    v_certificate_data,
    NOW()
  ) RETURNING id INTO v_certificate_id;
  
  -- Update profile
  UPDATE public.profiles
  SET total_certificates = total_certificates + 1
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Certificate generated successfully',
    'certificate_id', v_certificate_id,
    'certificate_number', v_certificate_number,
    'verification_code', v_verification_code
  );
END;
$$;