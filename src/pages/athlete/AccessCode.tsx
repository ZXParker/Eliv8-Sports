import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';
import { useNavigate } from 'react-router-dom';

interface AccessCodeDetails {
  sport_id: string;
  coach_id: string;
  organization_id: string;
  sport_name: string;
  coach_name: string;
  gender?: 'male' | 'female';
  organization_name: string;
}

export default function AccessCode() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeDetails, setCodeDetails] = useState<AccessCodeDetails | null>(null);
  const [joining, setJoining] = useState(false);
  const { user } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateCode = async () => {
    setLoading(true);
    setError(null);
    setCodeDetails(null);

    try {
      if (!code.trim()) {
        throw new Error('Please enter an access code');
      }

      if (!user?.id) {
        throw new Error('Authentication required');
      }

      // Check if code exists and is valid
      const { data: accessCode, error: codeError } = await supabase
        .from('access_codes')
        .select(`
          id,
          role,
          used_at,
          sport_id,
          coach_id,
          organization_id,
          gender,
          sports (name),
          creator:created_by (first_name, last_name),
          organizations (name)
        `)
        .eq('code', code.trim())
        .single();

      if (codeError) throw new Error('Invalid access code');
      if (!accessCode) throw new Error('Code not found');
      if (accessCode.used_at) throw new Error('This code has already been used');
      if (accessCode.role !== 'athlete') throw new Error('Invalid code type');

      // Check if already connected to this coach/sport
      const { data: existingConnection } = await supabase
        .from('coach_athletes')
        .select('id')
        .match({
          athlete_id: user.id,
          coach_id: accessCode.coach_id,
          sport_id: accessCode.sport_id,
          organization_id: accessCode.organization_id
        })
        .single();

      if (existingConnection) {
        throw new Error('You are already connected to this team');
      }

      setCodeDetails({
        sport_id: accessCode.sport_id,
        coach_id: accessCode.coach_id,
        organization_id: accessCode.organization_id,
        sport_name: accessCode.sports.name,
        coach_name: `${accessCode.creator.first_name} ${accessCode.creator.last_name}`,
        gender: accessCode.gender,
        organization_name: accessCode.organizations.name
      });

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!codeDetails || !user?.id) return;
    setJoining(true);

    try {
      // First mark the code as used
      const { error: updateError } = await supabase
        .from('access_codes')
        .update({ 
          used_at: new Date().toISOString(),
          used_by: user.id
        })
        .eq('code', code.trim());

      if (updateError) throw updateError;

      // Connect athlete to coach
      const { error: connectionError } = await supabase
        .from('coach_athletes')
        .insert({
          athlete_id: user.id,
          coach_id: codeDetails.coach_id,
          sport_id: codeDetails.sport_id,
          organization_id: codeDetails.organization_id,
          gender: codeDetails.gender
        });

      if (connectionError) throw connectionError;

      // Add sport to user's sports
      const { error: sportError } = await supabase
        .from('user_sports')
        .insert({
          user_id: user.id,
          sport_id: codeDetails.sport_id,
          organization_id: codeDetails.organization_id,
          gender: codeDetails.gender
        })
        .single();

      if (sportError) throw sportError;

      toast({
        title: "Success",
        description: `Successfully joined ${codeDetails.sport_name}`,
      });

      // Navigate to MySports after successful join
      navigate('/athlete');

    } catch (error) {
      console.error('Join error:', error);
      setError(error instanceof Error ? error.message : 'Failed to join team');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 backdrop-blur-xl p-6 rounded-lg border border-blue-500/20"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <KeyRound className="h-8 w-8 text-blue-400" />
              Join Team
            </h1>
            <p className="text-gray-400">
              Enter your access code to connect with your coach
            </p>
          </div>
        </div>
      </motion.div>

      {error && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-black/40 backdrop-blur-xl border border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-blue-400" />
            Access Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Enter code..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="bg-blue-500/5 border-blue-500/20 text-white placeholder:text-gray-400"
            />
            <Button
              onClick={validateCode}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white min-w-[100px]"
            >
              {loading ? <LoadingSpinner size="sm" /> : "Verify"}
            </Button>
          </div>

          {codeDetails && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-blue-400" />
                  Team Details
                </h3>
                <div className="space-y-3 text-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Sport</span>
                    <span className="font-medium text-white">{codeDetails.sport_name}</span>
                  </div>
                  {codeDetails.gender && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Team</span>
                      <span className="font-medium text-white">
                        {codeDetails.gender === 'male' ? "Men's" : "Women's"}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Coach</span>
                    <span className="font-medium text-white">{codeDetails.coach_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Organization</span>
                    <span className="font-medium text-white">{codeDetails.organization_name}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Alert className="bg-blue-500/10 border-blue-500/20 flex-1 mr-4">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                  <AlertDescription>Code verified successfully</AlertDescription>
                </Alert>
                <Button
                  onClick={handleJoin}
                  disabled={joining}
                  className="bg-blue-500 hover:bg-blue-600 text-white min-w-[100px]"
                >
                  {joining ? <LoadingSpinner size="sm" /> : "Join Team"}
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}