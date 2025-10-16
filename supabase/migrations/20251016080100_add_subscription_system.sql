/*
  # Add Subscription System

  1. Changes to users table
    - Add `subscription_type` column (free, premium)
    - Add `subscription_expires_at` column for subscription expiry tracking
    - Add `subscription_started_at` column for subscription start tracking

  2. New Tables
    - `subscription_plans` - Available subscription plans with pricing
    - `subscription_transactions` - Track subscription purchases

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users to view their subscriptions
*/

-- Add subscription fields to users table (using auth.users metadata instead)
-- We'll store subscription info in a separate table for better management

CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_bn text NOT NULL,
  description text,
  description_bn text,
  price decimal(10,2) NOT NULL DEFAULT 0,
  duration_days integer NOT NULL DEFAULT 30,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  auto_renew boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Subscription transactions for payment tracking
CREATE TABLE IF NOT EXISTS subscription_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES user_subscriptions(id) NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'BDT',
  payment_method text,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON subscription_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, name_bn, description, description_bn, price, duration_days, features) VALUES
  ('Free', 'ফ্রি', 'Basic access with limited quiz attempts', 'সীমিত কুইজ প্রচেষ্টা সহ বেসিক অ্যাক্সেস', 0, 365, '["2 free quiz attempts per module", "24-72 hour wait time for retakes"]'::jsonb),
  ('Premium Monthly', 'প্রিমিয়াম মাসিক', 'Unlimited quiz attempts with no waiting time', 'কোন অপেক্ষার সময় ছাড়াই সীমাহীন কুইজ প্রচেষ্টা', 299, 30, '["Unlimited quiz attempts", "No waiting time", "Priority support", "All course access"]'::jsonb),
  ('Premium Yearly', 'প্রিমিয়াম বার্ষিক', 'Unlimited quiz attempts for a full year', 'পুরো এক বছরের জন্য সীমাহীন কুইজ প্রচেষ্টা', 2999, 365, '["Unlimited quiz attempts", "No waiting time", "Priority support", "All course access", "Certificate of completion"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Function to check if user has active premium subscription
CREATE OR REPLACE FUNCTION has_active_premium_subscription(user_id_input uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = user_id_input
    AND us.status = 'active'
    AND us.expires_at > now()
    AND sp.price > 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);
