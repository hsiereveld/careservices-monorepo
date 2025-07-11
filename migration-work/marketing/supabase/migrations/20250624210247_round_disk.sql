/*
  # Add contact messages table

  1. New Tables
    - `contact_messages`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `email` (text, required)
      - `phone` (text, optional)
      - `subject` (text, optional)
      - `message` (text, required)
      - `contact_preference` (text, required)
      - `user_id` (uuid, optional, references auth.users)
      - `status` (text, required)
      - `admin_notes` (text, optional)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)
  
  2. Security
    - Enable RLS on `contact_messages` table
    - Add policy for authenticated users to insert their own messages
    - Add policy for admin/backoffice to read all messages
*/

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  contact_preference text NOT NULL DEFAULT 'email',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints
ALTER TABLE public.contact_messages
  ADD CONSTRAINT contact_messages_status_check 
  CHECK (status IN ('new', 'in_progress', 'completed', 'spam'));

ALTER TABLE public.contact_messages
  ADD CONSTRAINT contact_messages_contact_preference_check 
  CHECK (contact_preference IN ('email', 'phone', 'any'));

-- Create index for faster queries
CREATE INDEX idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX idx_contact_messages_created_at ON public.contact_messages(created_at);
CREATE INDEX idx_contact_messages_user_id ON public.contact_messages(user_id);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to insert a contact message
CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to see their own messages
CREATE POLICY "Users can view their own contact messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow admins and backoffice to read all messages
CREATE POLICY "Admins can read all contact messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'backoffice')
  ));

-- Allow admins and backoffice to update messages
CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'backoffice')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'backoffice')
  ));

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_messages_updated_at
BEFORE UPDATE ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION update_contact_messages_updated_at();