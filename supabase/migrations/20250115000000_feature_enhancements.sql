-- Add to next migration file (20250115000000_feature_enhancements.sql):

-- Add notification preferences for users
ALTER TABLE profiles
ADD COLUMN notification_preferences jsonb DEFAULT '{}';

-- Add status field for sports in organizations
CREATE TABLE IF NOT EXISTS organization_sports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id),
    sport_id uuid REFERENCES sports(id),
    status text DEFAULT 'active',
    settings jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    UNIQUE(organization_id, sport_id)
);

-- Add analytics tracking table
CREATE TABLE IF NOT EXISTS analytics_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id),
    event_type text NOT NULL,
    event_data jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Add RLS for new tables
ALTER TABLE organization_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Add policies for new tables
CREATE POLICY "Users can view their organization's sports"
    ON organization_sports FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can view their organization's analytics"
    ON analytics_events FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Add function to track analytics events
CREATE OR REPLACE FUNCTION log_analytics_event(
    org_id uuid,
    event_type text,
    event_data jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO analytics_events (organization_id, event_type, event_data)
    VALUES (org_id, event_type, event_data);
END;
$$;

-- Add gender field to user_sports
ALTER TABLE user_sports
ADD COLUMN gender text CHECK (gender IN ('male', 'female'));
