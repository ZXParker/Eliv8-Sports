import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Mail, 
  Calendar,
  BookOpen,
  Building2,
  Search,
  Tag,
  X,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';

interface Sport {
  id: string;
  name: string;
}

interface UserSport {
  sports: Sport;
  gender: 'male' | 'female' | null;
}

interface Coach {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  user_sports: UserSport[];
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-black/90 border border-blue-500/20 rounded-lg w-full max-w-3xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-blue-500/20">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function CoachRegistration() {
  const { user } = useAuthStore();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllCoaches, setShowAllCoaches] = useState(false);
  const [showMensCoaches, setShowMensCoaches] = useState(false);
  const [showWomensCoaches, setShowWomensCoaches] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchCoaches = async (showToast = false) => {
    if (!user?.id) return;

    try {
      setError(null);
      if (showToast) setRefreshing(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) {
        throw new Error('Organization not found');
      }

      // Fetch organization details
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', profile.organization_id)
        .single();

      if (org) {
        setOrganizationName(org.name);
      }

      // Fetch coaches with their sports
      const { data: coachData, error: coachError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          created_at,
          user_sports (
            sports:sports (
              id,
              name
            ),
            gender
          )
        `)
        .eq('role', 'coach')
        .eq('organization_id', profile.organization_id);

      if (coachError) throw coachError;

      if (coachData) {
        const transformedCoaches: Coach[] = coachData.map((coach: any) => ({
          id: coach.id,
          full_name: coach.full_name,
          email: coach.email,
          created_at: coach.created_at,
          user_sports: coach.user_sports.map((userSport: any) => ({
            sports: {
              id: userSport.sports.id,
              name: userSport.sports.name
            },
            gender: userSport.gender
          }))
        }));
        setCoaches(transformedCoaches);
      }

      if (showToast) {
        toast({
          title: "Updated",
          description: "Coach list has been refreshed",
        });
      }
    } catch (error) {
      console.error('Error fetching coaches:', error);
      setError(error instanceof Error ? error.message : 'Failed to load coaches');
      
      if (showToast) {
        toast({
          title: "Error",
          description: "Failed to refresh coach list",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCoaches();
    }
  }, [user]);

  // Set up real-time subscription
  useRealtimeSubscription('profiles', async (payload) => {
    if (payload.new?.role === 'coach') {
      await fetchCoaches();
    }
  });

  const handleRefresh = () => {
    fetchCoaches(true);
  };

  const filteredCoaches = coaches.filter(coach => 
    coach.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.user_sports.some(sport => 
      sport.sports.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  
  const totalMensCoaches = coaches.filter(coach => 
    coach.user_sports.some(sport => sport.gender === 'male')
  ).length;
  
  const totalWomensCoaches = coaches.filter(coach => 
    coach.user_sports.some(sport => sport.gender === 'female')
  ).length;

  const CoachList = ({ coaches, filterGender = null }: { coaches: Coach[], filterGender?: 'male' | 'female' | null }) => {
    const filteredCoachesList = filterGender 
      ? coaches.filter(coach => coach.user_sports.some(sport => sport.gender === filterGender))
      : coaches;

    if (filteredCoachesList.length === 0) {
      return (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">No coaches found</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredCoachesList.map((coach) => (
          <motion.div
            key={coach.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-all duration-200"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{coach.full_name}</h3>
                  <a 
                    href={`mailto:${coach.email}`}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <Mail className="h-3 w-3" />
                    {coach.email}
                  </a>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                    <Calendar className="h-3 w-3" />
                    Joined {new Date(coach.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {coach.user_sports.map((sport, idx) => (
                  <span
                    key={idx}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
                      ${sport.gender === 'male'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                        : 'bg-pink-500/20 text-pink-400 border border-pink-500/20'
                      }`}
                  >
                    <Tag className="h-3 w-3" />
                    {sport.gender === 'male' ? "Men's" : "Women's"} {sport.sports.name}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <LoadingSpinner size="lg" className="text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading coaches...</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-8">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {error && (
        <Alert variant="destructive" className="relative">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-black/40 backdrop-blur-xl p-6 rounded-lg border border-blue-500/20"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-400" />
              Coach Registration
            </h1>
            {organizationName && (
              <div className="flex items-center gap-2 text-gray-400">
                <Building2 className="h-4 w-4" />
                <p>{organizationName}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search coaches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-blue-500/10 border-blue-500/20 text-white placeholder-gray-500"
              />
            </div>
            <Button
              variant="outline"
              className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          className="bg-black/40 backdrop-blur-xl border border-blue-500/20 cursor-pointer hover:bg-blue-500/5 transition-colors group"
          onClick={() => setShowAllCoaches(true)}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-blue-500/10 group-hover:scale-105 transition-transform">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Total Coaches</p>
                <p className="text-2xl font-bold text-white">{coaches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-black/40 backdrop-blur-xl border border-blue-500/20 cursor-pointer hover:bg-blue-500/5 transition-colors group"
          onClick={() => setShowMensCoaches(true)}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-blue-500/10 group-hover:scale-105 transition-transform">
            <BookOpen className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Men's Teams Coaches</p>
                <p className="text-2xl font-bold text-white">{totalMensCoaches}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-black/40 backdrop-blur-xl border border-blue-500/20 cursor-pointer hover:bg-blue-500/5 transition-colors group"
          onClick={() => setShowWomensCoaches(true)}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-blue-500/10 group-hover:scale-105 transition-transform">
              <BookOpen className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Women's Teams Coaches</p>
                <p className="text-2xl font-bold text-white">{totalWomensCoaches}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {coaches.length === 0 && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative text-center p-12"
        >
          <Card className="bg-black/40 backdrop-blur-xl border border-blue-500/20">
            <CardContent className="py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No Coaches Registered</h3>
              <p className="text-gray-400">
                Coaches will appear here after they register using their invitation codes.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAllCoaches && (
          <Modal
            isOpen={showAllCoaches}
            onClose={() => setShowAllCoaches(false)}
            title={`All Coaches (${filteredCoaches.length})`}
          >
            <CoachList coaches={filteredCoaches} />
          </Modal>
        )}

        {showMensCoaches && (
          <Modal
            isOpen={showMensCoaches}
            onClose={() => setShowMensCoaches(false)}
            title={`Men's Teams Coaches (${totalMensCoaches})`}
          >
            <CoachList coaches={filteredCoaches} filterGender="male" />
          </Modal>
        )}

        {showWomensCoaches && (
          <Modal
            isOpen={showWomensCoaches}
            onClose={() => setShowWomensCoaches(false)}
            title={`Women's Teams Coaches (${totalWomensCoaches})`}
          >
            <CoachList coaches={filteredCoaches} filterGender="female" />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}