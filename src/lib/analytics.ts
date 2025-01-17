import { supabase } from '@/lib/supabase';

export interface DashboardCounts {
  totalUsers: number;
  totalAthletes: number;
  totalCoaches: number;
  organizationId: string | null;
}

export interface UserDetails {
  id: string;
  full_name: string;
  email: string;
  role: string;
  sports: Array<{
    name: string;
    gender: string | null;
  }>;
}

export async function fetchDashboardAnalytics(organizationId: string): Promise<DashboardCounts> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(`
      id,
      role,
      organization_id
    `)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }

  return {
    totalUsers: profiles.length,
    totalAthletes: profiles.filter(p => p.role === 'athlete').length,
    totalCoaches: profiles.filter(p => p.role === 'coach').length,
    organizationId
  };
}

export async function fetchUserDetails(roleFilter?: string): Promise<UserDetails[]> {
  const query = supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      role,
      user_sports (
        sport:sports (
          name
        ),
        gender
      )
    `);

  if (roleFilter) {
    query.eq('role', roleFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }

  return data.map(user => ({
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    sports: user.user_sports.map((us: any) => ({
      name: us.sport.name,
      gender: us.gender
    }))
  }));
}

export function setupRealtimeAnalytics(
  organizationId: string,
  onUpdate: (counts: DashboardCounts) => void
) {
  const subscription = supabase
    .channel('analytics_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `organization_id=eq.${organizationId}`
      },
      async () => {
        // Fetch updated counts
        const newCounts = await fetchDashboardAnalytics(organizationId);
        onUpdate(newCounts);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

export async function logAnalyticsEvent(
  organizationId: string,
  eventType: string,
  eventData: Record<string, any> = {}
) {
  const { error } = await supabase.rpc('log_analytics_event', {
    org_id: organizationId,
    event_type: eventType,
    event_data: eventData
  });

  if (error) {
    console.error('Error logging analytics event:', error);
    throw error;
  }
}