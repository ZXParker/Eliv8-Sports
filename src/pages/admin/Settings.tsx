import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings as SettingsIcon, 
  Trophy,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';

interface Sport {
  id: string;
  name: string;
}

interface UserSport {
  sports: {
    id: string;
    name: string;
  };
}


export default function Settings() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [availableSports, setAvailableSports] = useState<Sport[]>([]);
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSportsData();
    }
  }, [user]);

  const fetchSportsData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchAvailableSports(),
        fetchUserSports()
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAvailableSports = async () => {
    try {
      const { data, error } = await supabase
        .from('sports')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setAvailableSports(data || []);
    } catch (error) {
      console.error('Error fetching sports:', error);
      toast({
        title: "Error",
        description: "Failed to load available sports",
        variant: "destructive"
      });
    }
  };

  const fetchUserSports = async () => {
    if (!user?.id) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (!profile?.organization_id) {
        throw new Error('Organization not found');
      }

      const { data, error } = await supabase
        .from('user_sports')
        .select(`
          sports (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('organization_id', profile.organization_id);

      if (error) throw error;

      if (data) {
        const formattedSports = (data as unknown as UserSport[]).map(item => ({
          id: item.sports.id,
          name: item.sports.name
        }));
        setSelectedSports(formattedSports);
      }
    } catch (error) {
      console.error('Error fetching user sports:', error);
      toast({
        title: "Error",
        description: "Failed to load your sports",
        variant: "destructive"
      });
    }
  };

  const handleSportToggle = async (sport: Sport) => {
    if (!user?.id || processing) return;

    const isSelected = selectedSports.some(s => s.id === sport.id);
    setProcessing(sport.id);
    setError(null);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (!profile?.organization_id) {
        throw new Error('Organization not found');
      }

      if (isSelected) {
        // Remove sport
        const { error: deleteError } = await supabase
          .from('user_sports')
          .delete()
          .match({
            user_id: user.id,
            sport_id: sport.id,
            organization_id: profile.organization_id
          });

        if (deleteError) throw deleteError;

        setSelectedSports(prev => prev.filter(s => s.id !== sport.id));
        toast({
          title: "Sport Removed",
          description: `${sport.name} has been removed from your sports`
        });
      } else {
        // Add sport
        const { error: insertError } = await supabase
          .from('user_sports')
          .insert({
            user_id: user.id,
            sport_id: sport.id,
            organization_id: profile.organization_id
          });

        if (insertError) throw insertError;

        setSelectedSports(prev => [...prev, sport]);
        toast({
          title: "Sport Added",
          description: `${sport.name} has been added to your sports`
        });
      }

      // Fetch updated sports list
      await fetchUserSports();
      
    } catch (error) {
      console.error('Error toggling sport:', error);
      const message = error instanceof Error ? error.message : 'Failed to update sport';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <LoadingSpinner size="lg" className="text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-8">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-black/40 backdrop-blur-xl p-6 rounded-lg border border-blue-500/20"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <SettingsIcon className="h-8 w-8 text-blue-400" />
              Sports Settings
            </h1>
            <p className="text-gray-400">
              Manage the sports that appear in your dashboard
            </p>
          </div>
          <Button
            variant="outline"
            className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
            onClick={fetchSportsData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sports Management */}
      <Card className="relative bg-black/40 backdrop-blur-xl border border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="h-5 w-5 text-blue-400" />
            Manage Sports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableSports.map((sport, index) => {
              const isSelected = selectedSports.some(s => s.id === sport.id);
              const isProcessing = processing === sport.id;

              return (
                <motion.div
                  key={sport.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div 
                    className={`
                      relative p-4 rounded-lg border transition-all duration-300
                      ${isSelected 
                        ? 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20' 
                        : 'bg-gray-900/50 border-gray-700/30 hover:bg-gray-900/70'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white">{sport.name}</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSportToggle(sport)}
                        disabled={isProcessing}
                        className={`
                          min-w-[100px] transition-all duration-300
                          ${isSelected 
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30' 
                            : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30'
                          }
                        `}
                      >
                        {isProcessing ? (
                          <LoadingSpinner size="sm" />
                        ) : isSelected ? (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {availableSports.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No sports available</h3>
              <p className="text-gray-400">
                Please contact your administrator to add sports to the platform.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}