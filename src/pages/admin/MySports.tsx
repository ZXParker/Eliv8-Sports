import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Trophy, 
  ChevronRight, 
  Settings as SettingsIcon, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';

interface Sport {
  id: string;
  name: string;
  gender?: 'male' | 'female';
}

interface UserSport {
  sports: {
    id: string;
    name: string;
  };
  gender: 'male' | 'female' | null;
}

export default function MySports() {
  const { user, role } = useAuthStore();
  const navigate = useNavigate();
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSports();
    }
  }, [user]);

  // Set up real-time subscription
  useRealtimeSubscription('user_sports', () => {
    fetchSports();
  });

  const fetchSports = async () => {
    if (!user?.id) return;
    
    try {
      setRefreshing(true);
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (!profile?.organization_id) {
        throw new Error('Organization not found');
      }

      const { data, error: sportsError } = await supabase
        .from('user_sports')
        .select(`
          sports (
            id,
            name
          ),
          gender
        `)
        .eq('user_id', user.id)
        .eq('organization_id', profile.organization_id);

      if (sportsError) throw sportsError;

      if (data) {
        const formattedSports = (data as unknown as UserSport[]).map(item => ({
          id: item.sports.id,
          name: item.sports.name,
          gender: item.gender || undefined
        }));
        setSports(formattedSports);
      }
    } catch (error) {
      console.error('Error fetching sports:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSportNavigation = (sportName: string) => {
    const sportRoute = sportName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/sports/${sportRoute}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <LoadingSpinner size="lg" className="text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading your sports...</p>
      </div>
    );
  }

  const settingsPath = role ? `/${role}/settings` : '/settings';

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-black/40 backdrop-blur-xl p-6 rounded-lg border border-blue-500/20"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Trophy className="h-8 w-8 text-blue-400" />
              My Sports
            </h1>
            <p className="text-gray-400">
              Access and manage your sports dashboards
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
              onClick={fetchSports}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to={settingsPath}>
              <Button
                variant="outline"
                className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
              >
                <SettingsIcon className="w-4 h-4 mr-2" />
                Manage Sports
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="bg-black/40 backdrop-blur-xl border border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="h-5 w-5 text-blue-400" />
            My Sports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sports.map((sport, index) => (
                <motion.div
                  key={sport.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div
                    onClick={() => handleSportNavigation(sport.name)}
                    className="group cursor-pointer"
                  >
                    <Card className="bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                              {sport.name}
                            </h3>
                            {sport.gender && (
                              <span 
                                className={`px-2.5 py-1 rounded-full text-xs font-medium inline-block
                                  ${sport.gender === 'male' 
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' 
                                    : 'bg-pink-500/20 text-pink-400 border border-pink-500/20'
                                  }`}
                              >
                                {sport.gender === 'male' ? "Men's" : "Women's"}
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 text-lg font-medium">
                No sports added yet
              </p>
              <p className="text-gray-400 mt-2 mb-6">
                Add sports in your settings to see them here
              </p>
              <Link to={settingsPath}>
                <Button
                  variant="outline"
                  className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                >
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Go to Settings
                </Button>
              </Link>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}