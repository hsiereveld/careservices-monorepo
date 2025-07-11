/*
  # Add display_category_id and review status to provider_services

  1. New Fields
    - `display_category_id` (uuid, optional) - The category to display this service under in the marketplace
    - `review_status` (text, not null) - The review status of the service (pending_review, approved, rejected)
    - `review_notes` (text) - Notes from the admin review
    - `reviewed_by` (uuid) - The admin who reviewed the service
    - `reviewed_at` (timestamp) - When the service was reviewed

  2. Security
    - Add foreign key constraint for display_category_id
    - Add check constraint for valid review_status values
    - Add foreign key constraint for reviewed_by
*/

-- Add display_category_id column to provider_services
ALTER TABLE public.provider_services 
ADD COLUMN IF NOT EXISTS display_category_id UUID REFERENCES public.service_categories(id);

-- Add review status columns
ALTER TABLE public.provider_services 
ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'pending_review';

ALTER TABLE public.provider_services 
ADD COLUMN IF NOT EXISTS review_notes TEXT;

ALTER TABLE public.provider_services 
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

ALTER TABLE public.provider_services 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Add check constraint for review_status
ALTER TABLE public.provider_services 
ADD CONSTRAINT provider_services_review_status_check 
CHECK (review_status IN ('pending_review', 'approved', 'rejected'));

-- Create index for faster filtering by review_status
CREATE INDEX IF NOT EXISTS idx_provider_services_review_status 
ON public.provider_services(review_status);

-- Create index for display_category_id for faster category-based queries
CREATE INDEX IF NOT EXISTS idx_provider_services_display_category_id 
ON public.provider_services(display_category_id);

-- Update RLS policies to allow admins and backoffice to review services
CREATE POLICY "Admins can review provider services" 
ON public.provider_services
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'admin'
));

CREATE POLICY "BackOffice can review provider services" 
ON public.provider_services
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'backoffice'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'backoffice'
));

-- Add comment to explain the purpose of the display_category_id
COMMENT ON COLUMN public.provider_services.display_category_id IS 
'The category under which this service should be displayed in the marketplace. If null, falls back to the category of the base service.';

-- Add comment to explain the review process
COMMENT ON COLUMN public.provider_services.review_status IS 
'The review status of the service: pending_review (awaiting admin review), approved (visible on marketplace), rejected (not visible)';