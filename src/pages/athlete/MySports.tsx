import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, ChevronRight, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
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

interface SportResponse {
  id: string;
  name: string;
}

interface UserSportResponse {
  sport: SportResponse;
  gender: 'male' | 'female' | null;
}

export default function MySports() {
  const { role } = useAuthStore();
  const navigate = useNavigate();
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSports();
  }, []);

  useRealtimeSubscription('user_sports', () => {
    fetchSports();
  });

  const fetchSports = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) {
        throw new Error('User not found');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (!profile?.organization_id) {
        throw new Error('Organization not found');
      }

      const { data: userSports, error: sportsError } = await supabase
        .from('user_sports')
        .select(`
          sport:sports (
            id,
            name
          ),
          gender
        `)
        .eq('user_id', user.data.user.id)
        .eq('organization_id', profile.organization_id);

      if (sportsError) throw sportsError;

      // First cast to unknown, then to our type
      const typedUserSports = (userSports as unknown) as UserSportResponse[];
      
      if (typedUserSports) {
        const formattedSports = typedUserSports.map(item => ({
          id: item.sport.id,
          name: item.sport.name,
          gender: item.gender || undefined
        }));
        setSports(formattedSports);
      }
    } catch (error) {
      console.error('Error fetching sports:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle sport navigation
  const handleSportNavigation = (sportName: string) => {
    // Convert sport name to kebab-case for route
    const sportRoute = sportName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/sports/${sportRoute}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Determine the correct settings path based on user role
  const settingsPath = role ? `/${role}/settings` : '/settings';

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/50 p-6 rounded-lg border border-white/10 backdrop-blur-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Trophy className="h-8 w-8 text-blue-400" />
              My Sports
            </h1>
            <p className="text-gray-400">
              Manage and access your sports dashboards
            </p>
          </div>
          <Link to={settingsPath}>
            <Button
              variant="outline"
              className="border-white/10 hover:bg-blue-500/10"
            >
              <SettingsIcon className="w-4 h-4 mr-2" />
              Manage Sports
            </Button>
          </Link>
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

      <Card className="bg-gray-900/50 backdrop-blur-sm border border-white/10">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-blue-400" />
            <CardTitle className="text-white">Available Sports</CardTitle>
          </div>
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
                    className="block group cursor-pointer"
                  >
                    <Card className="bg-gray-800/50 border border-white/10 hover:bg-gray-800/70 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                              {sport.name}
                            </h3>
                            {sport.gender && (
                              <span 
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium inline-block
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
                  className="border-white/10 hover:bg-blue-500/10"
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