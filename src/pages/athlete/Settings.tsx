import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';

interface Sport {
  id: string;
  name: string;
}

export default function Settings() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [availableSports, setAvailableSports] = useState<Sport[]>([]);
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSportLoading, setIsSportLoading] = useState<string | null>(null);
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    sport: Sport | null;
  }>({
    isOpen: false,
    sport: null
  });

  useEffect(() => {
    Promise.all([fetchAvailableSports(), fetchUserSports()]).finally(() => {
      setLoading(false);
    });
  }, [user?.id]);

  const fetchAvailableSports = async () => {
    try {
      const { data, error } = await supabase
        .from('sports')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setAvailableSports(data || []);
    } catch (error) {
      console.error('Error fetching available sports:', error);
      setError('Failed to load sports');
    }
  };

  const fetchUserSports = async () => {
    if (!user?.id) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (!profile?.organization_id) return;

      const { data: userSports, error } = await supabase
        .from('user_sports')
        .select(`
          sport_id,
          sports (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('organization_id', profile.organization_id);

      if (error) throw error;

      if (userSports) {
        const formattedSports = userSports.map(item => ({
          id: item.sports.id,
          name: item.sports.name
        }));
        setSelectedSports(formattedSports);
      }
    } catch (error) {
      console.error('Error fetching user sports:', error);
      setError('Failed to load your sports');
    }
  };

  const handleSportToggle = async (sport: Sport) => {
    const isSelected = selectedSports.some(s => s.id === sport.id);
    
    if (isSelected) {
      setConfirmationState({
        isOpen: true,
        sport
      });
    } else {
      await toggleSport(sport);
    }
  };

  const toggleSport = async (sport: Sport) => {
    if (!user?.id) return;
    setIsSportLoading(sport.id);
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (!profile?.organization_id) {
        throw new Error('Organization not found');
      }

      const isSelected = selectedSports.some(s => s.id === sport.id);

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
          title: "Success",
          description: `${sport.name} removed successfully`
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
          title: "Success",
          description: `${sport.name} added successfully`
        });
      }
    } catch (error) {
      console.error('Error toggling sport:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update sport',
        variant: "destructive"
      });
    } finally {
      setIsSportLoading(null);
      setConfirmationState({ isOpen: false, sport: null });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
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

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-black/40 backdrop-blur-xl p-6 rounded-lg border border-blue-500/20"
      >
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Trophy className="h-8 w-8 text-blue-400" />
          Sports Management
        </h1>
        <p className="text-gray-400 mt-2">
          Add or remove sports from your profile
        </p>
      </motion.div>

      {error && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="relative bg-black/40 backdrop-blur-xl border border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-400" />
            Available Sports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableSports.map((sport, index) => (
              <motion.div
                key={sport.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-colors">
                  <span className="font-medium text-white">{sport.name}</span>
                  <Button
                    variant="default"
                    className={`w-24 transition-all duration-300 ${
                      selectedSports.some(s => s.id === sport.id)
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                    onClick={() => handleSportToggle(sport)}
                    disabled={isSportLoading === sport.id}
                  >
                    {isSportLoading === sport.id ? (
                      <LoadingSpinner size="sm" />
                    ) : selectedSports.some(s => s.id === sport.id) ? (
                      'Remove'
                    ) : (
                      'Add'
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {confirmationState.isOpen && confirmationState.sport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-black/90 border border-blue-500/20 text-white">
            <CardHeader>
              <CardTitle>Confirm Removal</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Are you sure you want to remove {confirmationState.sport.name}?</p>
              <div className="flex justify-end gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setConfirmationState({ isOpen: false, sport: null })}
                  className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => confirmationState.sport && toggleSport(confirmationState.sport)}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}