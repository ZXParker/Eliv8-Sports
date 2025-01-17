-- PART 1: INITIAL TABLE SETUP

-- Create base tables
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text[] NOT NULL DEFAULT '{}',
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  organization_id uuid REFERENCES organizations(id),
  role text NOT NULL CHECK (role IN ('admin', 'coach', 'athlete')),
  sport_id uuid REFERENCES sports(id),
  gender text CHECK (gender IN ('male', 'female')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  used_at timestamptz,
  used_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  role text CHECK (role IS NULL OR role IN ('admin', 'coach', 'athlete')),
  organization_id uuid REFERENCES organizations(id),
  full_name text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_sports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  sport_id uuid REFERENCES sports(id),
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, sport_id, organization_id)
);

-- Subscription and billing tables
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  plan text NOT NULL,
  status text NOT NULL,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(id) NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Sport dashboard and coach-athlete relationship tables
CREATE TABLE IF NOT EXISTS sport_dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  sport_id uuid REFERENCES sports(id) NOT NULL,
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, sport_id, organization_id)
);

CREATE TABLE IF NOT EXISTS coach_athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES auth.users(id) NOT NULL,
  athlete_id uuid REFERENCES auth.users(id) NOT NULL,
  sport_id uuid REFERENCES sports(id) NOT NULL,
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(coach_id, athlete_id, sport_id, organization_id)
);

-- PART 2: ROW LEVEL SECURITY AND POLICIES

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_athletes ENABLE ROW LEVEL SECURITY;

-- Sports policies
CREATE POLICY "Public sports are viewable by all users"
  ON sports FOR SELECT
  TO authenticated
  USING (true);

-- Organization policies
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Profile policies
CREATE POLICY "Users can view their profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Coaches can view their athletes' data"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT athlete_id 
      FROM coach_athletes
      WHERE coach_id = auth.uid()
    )
  );

-- User Sports policies
CREATE POLICY "Users can view their sports"
  ON user_sports FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their sports"
  ON user_sports FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Coaches can view their athletes' sports"
  ON user_sports FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT athlete_id 
      FROM coach_athletes
      WHERE coach_id = auth.uid()
    )
  );

-- Access Codes policies
CREATE POLICY "Users can view relevant access codes"
  ON access_codes FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Subscription policies
CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Billing History policies
CREATE POLICY "Users can view their own billing history"
  ON billing_history FOR SELECT
  TO authenticated
  USING (subscription_id IN (
    SELECT id FROM subscriptions WHERE user_id = auth.uid()
  ));

-- Sport Dashboards policies
CREATE POLICY "Users can manage their own sport dashboards"
  ON sport_dashboards FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Coach Athletes policies
CREATE POLICY "Coaches can manage their athletes"
  ON coach_athletes FOR ALL
  TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Athletes can view their coaches"
  ON coach_athletes FOR SELECT
  TO authenticated
  USING (athlete_id = auth.uid());

  -- PART 3: FUNCTIONS AND TRIGGERS

-- Create function to handle new user creation with robust error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  _full_name text;
  _profile_id uuid;
  _retry_count int := 0;
  _max_retries int := 3;
  _success boolean := false;
BEGIN
  -- Validate inputs
  IF new.id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  -- Check if profile already exists to prevent duplicates
  SELECT id INTO _profile_id FROM profiles WHERE id = new.id;
  IF FOUND THEN
    RETURN new;
  END IF;

  -- Extract full name with validation
  _full_name := CASE 
    WHEN new.raw_user_meta_data IS NOT NULL AND 
         new.raw_user_meta_data->>'full_name' IS NOT NULL AND
         length(trim(new.raw_user_meta_data->>'full_name')) > 0
    THEN trim(new.raw_user_meta_data->>'full_name')
    ELSE COALESCE(new.email, 'New User')
  END;

  -- Retry loop for profile creation
  WHILE _retry_count < _max_retries AND NOT _success LOOP
    BEGIN
      INSERT INTO profiles (
        id,
        role,
        full_name,
        email,
        organization_id,
        created_at,
        updated_at
      )
      VALUES (
        new.id,
        'athlete',
        _full_name,
        new.email,
        NULL,
        now(),
        now()
      )
      RETURNING id INTO _profile_id;

      _success := true;
    EXCEPTION WHEN others THEN
      _retry_count := _retry_count + 1;
      IF _retry_count = _max_retries THEN
        RAISE WARNING 'Failed to create profile after % attempts: %', _max_retries, SQLERRM;
        
        -- Final attempt with minimal data
        BEGIN
          INSERT INTO profiles (
            id,
            role,
            full_name,
            email,
            organization_id,
            created_at,
            updated_at
          )
          VALUES (
            new.id,
            'athlete',
            'New User',
            new.email,
            NULL,
            now(),
            now()
          );
        EXCEPTION WHEN others THEN
          RAISE WARNING 'Final profile creation attempt failed: %', SQLERRM;
        END;
      END IF;
      -- Wait a moment before retrying (10ms)
      PERFORM pg_sleep(0.01);
    END;
  END LOOP;

  RETURN new;
END;
$$;

-- Create function to handle athlete access code usage
CREATE OR REPLACE FUNCTION handle_athlete_access_code()
RETURNS trigger AS $$
BEGIN
  -- Link athlete to coach who created the access code
  IF NEW.role = 'athlete' AND NEW.used_by IS NOT NULL THEN
    INSERT INTO coach_athletes (
      coach_id,
      athlete_id,
      sport_id,
      organization_id
    )
    VALUES (
      NEW.created_by,
      NEW.used_by,
      NEW.sport_id,
      NEW.organization_id
    )
    ON CONFLICT (coach_id, athlete_id, sport_id, organization_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS on_access_code_used ON access_codes;
CREATE TRIGGER on_access_code_used
  AFTER UPDATE ON access_codes
  FOR EACH ROW
  WHEN (OLD.used_by IS NULL AND NEW.used_by IS NOT NULL)
  EXECUTE FUNCTION handle_athlete_access_code();

-- PART 4: INITIAL DATA INSERTION

-- Insert predefined sports
INSERT INTO sports (name) VALUES
  ('Baseball'),
  ('Basketball'),
  ('Biking'),
  ('Bowling'),
  ('Cheer'),
  ('Dance'),
  ('Fitness'),
  ('Football'),
  ('Golf'),
  ('Gymnastics'),
  ('Hockey'),
  ('Lacrosse'),
  ('Pickleball'),
  ('Rugby'),
  ('Soccer'),
  ('Softball'),
  ('Swimming'),
  ('Tennis'),
  ('Track & Field'),
  ('Volleyball')
ON CONFLICT (name) DO NOTHING;

-- PART 5: INDEXES

-- Add indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_sports_user ON user_sports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sports_sport ON user_sports(sport_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_coach_athletes_coach ON coach_athletes(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_athletes_athlete ON coach_athletes(athlete_id);

-- PART 6: ADDITIONAL CONSTRAINTS AND CLEANUP

-- Add check constraints for valid email formats
ALTER TABLE organizations 
  ADD CONSTRAINT valid_email_array 
  CHECK (array_length(email, 1) IS NULL OR 
        (SELECT bool_and(value ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') 
         FROM unnest(email) AS value));

ALTER TABLE profiles
  ADD CONSTRAINT valid_email 
  CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_user_sports_composite 
  ON user_sports(user_id, sport_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_coach_athletes_composite 
  ON coach_athletes(coach_id, sport_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_access_codes_unused 
  ON access_codes(code) 
  WHERE used_at IS NULL;

-- Add constraints for subscription status
ALTER TABLE subscriptions
  ADD CONSTRAINT valid_subscription_status
  CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete'));

-- Add constraints for billing status
ALTER TABLE billing_history
  ADD CONSTRAINT valid_billing_status
  CHECK (status IN ('succeeded', 'pending', 'failed'));

-- Additional timestamp constraints
ALTER TABLE subscriptions
  ADD CONSTRAINT valid_subscription_period
  CHECK (current_period_start < current_period_end);

-- Add cascade deletion for certain relationships
ALTER TABLE user_sports
  DROP CONSTRAINT IF EXISTS user_sports_user_id_fkey,
  ADD CONSTRAINT user_sports_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

ALTER TABLE sport_dashboards
  DROP CONSTRAINT IF EXISTS sport_dashboards_user_id_fkey,
  ADD CONSTRAINT sport_dashboards_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Add function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sport_dashboards_updated_at
    BEFORE UPDATE ON sport_dashboards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments to tables for documentation
COMMENT ON TABLE profiles IS 'User profiles with role and organization information';
COMMENT ON TABLE organizations IS 'Organizations/schools that users belong to';
COMMENT ON TABLE sports IS 'Available sports in the system';
COMMENT ON TABLE access_codes IS 'Invitation codes for new users';
COMMENT ON TABLE user_sports IS 'Relationship between users and their sports';
COMMENT ON TABLE coach_athletes IS 'Relationship between coaches and their athletes';
COMMENT ON TABLE sport_dashboards IS 'User-specific sport dashboard settings';
COMMENT ON TABLE subscriptions IS 'User subscription information';
COMMENT ON TABLE billing_history IS 'History of billing transactions';


-- Profile policies
CREATE POLICY "Users can view their profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Coaches can view their athletes' data"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT athlete_id 
      FROM coach_athletes
      WHERE coach_id = auth.uid()
    )
  );

-- Add the new policy here
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());