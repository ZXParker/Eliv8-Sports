import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Trophy,
  UserPlus,
  X,
  Filter,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

// Type definitions
interface SportFilter {
  name: string;
  gender?: string;
}

interface AthleteDetails {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  sports: {
    name: string;
    gender?: string;
  }[];
}

interface UserSport {
  sports: {
    name: string;
  };
  gender?: string;
}

interface SupabaseAthlete {
  athlete: {
    id: string;
    full_name: string;
    email: string;
    created_at: string;
    user_sports: UserSport[];
  };
}

export default function Athletes() {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<AthleteDetails[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<AthleteDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSportFilter, setSelectedSportFilter] = useState<SportFilter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteDetails | null>(null);
  const [stats, setStats] = useState({
    totalAthletes: 0,
    activeThisWeek: 0,
    recentJoins: 0
  });

  // Fetch athletes data
  const fetchAthletes = useCallback(async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      const { data, error } = await supabase
        .from('coach_athletes')
        .select(`
          athlete:athlete_id(
            id,
            full_name,
            email,
            created_at,
            user_sports (
              sports (
                name
              ),
              gender
            )
          )
        `)
        .eq('coach_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('organization_id', profile.organization_id);

      if (error) throw error;
      
      const typedData = data as unknown as SupabaseAthlete[];
      
      const formattedAthletes: AthleteDetails[] = typedData.map(item => ({
        id: item.athlete.id,
        full_name: item.athlete.full_name,
        email: item.athlete.email,
        created_at: item.athlete.created_at,
        sports: item.athlete.user_sports.map(s => ({
          name: s.sports.name,
          gender: s.gender
        }))
      }));

      setAthletes(formattedAthletes);
      setFilteredAthletes(formattedAthletes);

      // Calculate stats
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      setStats({
        totalAthletes: formattedAthletes.length,
        activeThisWeek: formattedAthletes.filter(a => 
          new Date(a.created_at) > oneWeekAgo
        ).length,
        recentJoins: formattedAthletes.filter(a => 
          new Date(a.created_at) > thirtyDaysAgo
        ).length
      });

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAthletes();
  }, [fetchAthletes]);

  // Subscribe to real-time updates
  useRealtimeSubscription('coach_athletes', () => {
    fetchAthletes();
  });

  // Handle search and filtering
  useEffect(() => {
    let filtered = [...athletes];

    if (searchQuery.trim()) {
      filtered = filtered.filter(athlete =>
        athlete.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        athlete.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        athlete.sports.some(s => 
          s.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    if (selectedSportFilter) {
      filtered = filtered.filter(athlete =>
        athlete.sports.some(s => 
          s.name === selectedSportFilter.name &&
          (!selectedSportFilter.gender || s.gender === selectedSportFilter.gender)
        )
      );
    }

    setFilteredAthletes(filtered);
  }, [searchQuery, selectedSportFilter, athletes]);

  const handleAthleteClick = (athlete: AthleteDetails) => {
    setSelectedAthlete(athlete);
    setIsModalOpen(true);
  };

  const cards = [
    {
      title: 'Total Athletes',
      value: stats.totalAthletes,
      icon: Users,
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-500'
    },
    {
      title: 'Active This Week',
      value: stats.activeThisWeek,
      icon: Trophy,
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-500'
    },
    {
      title: 'Recent Joins',
      value: stats.recentJoins,
      icon: UserPlus,
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`${card.bgColor} border-transparent`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`h-5 w-5 ${card.textColor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search and Filter Bar */}
      <Card className="border-transparent bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search athletes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full md:w-[300px] bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate('/coach/codes')}
              >
                <UserPlus className="h-4 w-4" />
                Invite Athletes
              </Button>

              <Button
                variant="outline"
                className={`gap-2 ${selectedSportFilter ? 'bg-primary text-primary-foreground' : ''}`}
                onClick={() => setSelectedSportFilter(null)}
              >
                <Filter className="h-4 w-4" />
                {selectedSportFilter ? 'Clear Filter' : 'Filter'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Athletes List */}
      <div className="space-y-4">
        {filteredAthletes.map((athlete, index) => (
          <motion.div
            key={athlete.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className="hover:bg-accent cursor-pointer transition-colors"
              onClick={() => handleAthleteClick(athlete)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold flex items-center gap-2">
                      {athlete.full_name}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </h3>
                    <p className="text-sm text-muted-foreground">{athlete.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {athlete.sports.map((sport, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 rounded-full text-xs
                          ${sport.gender === 'male' 
                            ? 'bg-blue-500/20 text-blue-500' 
                            : sport.gender === 'female'
                            ? 'bg-pink-500/20 text-pink-500'
                            : 'bg-gray-500/20 text-gray-500'
                          }`}
                        onClick={(e) => {
                    
                          e.stopPropagation();
                          setSelectedSportFilter(sport);
                        }}
                      >
                        {sport.gender ? `${sport.gender}'s ` : ''}{sport.name}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {filteredAthletes.length === 0 && (
          <Card className="py-12">
            <CardContent className="text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                {searchQuery || selectedSportFilter 
                  ? 'No athletes found matching your search or filter'
                  : 'No athletes found'}
              </p>
              {(searchQuery || selectedSportFilter) && (
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSportFilter(null);
                  }}
                  className="mt-2"
                >
                  Clear all filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Athlete Details Modal */}
      <AnimatePresence>
        {isModalOpen && selectedAthlete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-card w-full max-w-2xl rounded-lg shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold">Athlete Details</h2>
                <button onClick={() => setIsModalOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm text-muted-foreground">Name</h3>
                  <p className="text-lg font-medium">{selectedAthlete.full_name}</p>
                </div>

                <div>
                  <h3 className="text-sm text-muted-foreground">Email</h3>
                  <p className="text-lg">{selectedAthlete.email}</p>
                </div>

                <div>
                  <h3 className="text-sm text-muted-foreground">Sports</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedAthlete.sports.map((sport, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-sm
                          ${sport.gender === 'male' 
                            ? 'bg-blue-500/20 text-blue-500' 
                            : sport.gender === 'female'
                            ? 'bg-pink-500/20 text-pink-500'
                            : 'bg-gray-500/20 text-gray-500'
                          }`}
                      >
                        {sport.gender ? `${sport.gender}'s ` : ''}{sport.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm text-muted-foreground">Member Since</h3>
                  <p className="text-lg">
                    {new Date(selectedAthlete.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      setIsModalOpen(false);
                      navigate(`/coach/athletes/${selectedAthlete.id}/dashboard`);
                    }}
                  >
                    View Dashboard
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions Floating Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <Button
          className="shadow-lg bg-primary hover:bg-primary/90"
          onClick={() => navigate('/coach/codes')}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Athletes
        </Button>
      </motion.div>
    </div>
  );
}