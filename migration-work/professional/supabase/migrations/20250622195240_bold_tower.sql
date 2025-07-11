/*
  # Create user_subscriptions table

  1. New Tables
    - `user_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `subscription_plan_id` (uuid, foreign key to subscription_plans)
      - `start_date` (timestamp)
      - `end_date` (timestamp)
      - `is_active` (boolean)
      - `is_auto_renew` (boolean)
      - `hours_used` (numeric)
      - `hours_remaining` (numeric)
      - `payment_status` (text)
      - `last_payment_date` (timestamp)
      - `next_payment_date` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `user_subscriptions` table
    - Add policies for admins and backoffice to manage user subscriptions
    - Add policy for users to read their own subscriptions
*/

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_plan_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  is_active boolean DEFAULT true,
  is_auto_renew boolean DEFAULT true,
  hours_used numeric(10,2) DEFAULT 0,
  hours_remaining numeric(10,2),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  last_payment_date timestamptz,
  next_payment_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_subscription_plan_id ON user_subscriptions(subscription_plan_id);
CREATE INDEX idx_user_subscriptions_is_active ON user_subscriptions(is_active);
CREATE INDEX idx_user_subscriptions_payment_status ON user_subscriptions(payment_status);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_user_subscriptions_updated_at();

-- Create trigger to set hours_remaining based on subscription plan
CREATE OR REPLACE FUNCTION set_subscription_hours_remaining()
RETURNS TRIGGER AS $$
DECLARE
  plan_hours integer;
BEGIN
  -- Get the included hours from the subscription plan
  SELECT included_hours INTO plan_hours
  FROM subscription_plans
  WHERE id = NEW.subscription_plan_id;
  
  -- Set the hours_remaining field
  NEW.hours_remaining = plan_hours;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_subscription_hours_remaining_trigger
BEFORE INSERT ON user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION set_subscription_hours_remaining();

-- Enable Row Level Security
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admins can manage user subscriptions
CREATE POLICY "Admins can manage user subscriptions"
  ON user_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- BackOffice can manage user subscriptions
CREATE POLICY "BackOffice can manage user subscriptions"
  ON user_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

-- Users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to check if a user has an active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = check_user_id
    AND is_active = true
    AND (end_date IS NULL OR end_date > now())
  );
$$;

-- Create function to get a user's active subscription details
CREATE OR REPLACE FUNCTION get_user_subscription_details(check_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_name TEXT,
  hours_remaining NUMERIC,
  hours_used NUMERIC,
  end_date TIMESTAMPTZ,
  is_auto_renew BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    us.id as subscription_id,
    sp.name as plan_name,
    us.hours_remaining,
    us.hours_used,
    us.end_date,
    us.is_auto_renew
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
  WHERE us.user_id = check_user_id
  AND us.is_active = true
  AND (us.end_date IS NULL OR us.end_date > now())
  ORDER BY us.created_at DESC
  LIMIT 1;
$$;