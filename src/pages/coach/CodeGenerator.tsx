import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { 
  Ticket, 
  Copy, 
  Mail, 
  Share2, 
  AlertCircle, 
  RefreshCcw,
  CheckCircle2,
  UserCircle,
  Trophy
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

type GenderType = 'male' | 'female' | '';

interface Sport {
  id: string;
  name: string;
}

interface RecentCode {
  code: string;
  sport_name?: string;
  gender?: GenderType;
  created_at: string;
  used: boolean;
}

export default function CoachCodeGenerator() {
  const [sportId, setSportId] = useState('');
  const [gender, setGender] = useState<GenderType>('');
  const [sports, setSports] = useState<Sport[]>([]);
  const [recentCodes, setRecentCodes] = useState<RecentCode[]>([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      fetchCoachSports(),
      fetchRecentCodes()
    ]).finally(() => {
      setLoading(false);
    });
  }, []);

  const fetchCoachSports = async () => {
    try {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error('Not authenticated');

      const { data } = await supabase
        .from('user_sports')
        .select('sports (id, name)')
        .eq('user_id', profile.user.id)
        .order('sports.name');
      
      if (data) {
        const formattedSports = data.map(item => ({
          id: item.sports.id,
          name: item.sports.name
        }));
        setSports(formattedSports);
      }
    } catch (error) {
      console.error('Error fetching sports:', error);
    }
  };

  const fetchRecentCodes = async () => {
    try {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error('Not authenticated');

      const { data } = await supabase
        .from('access_codes')
        .select(`
          code,
          gender,
          created_at,
          used_at,
          sports (name)
        `)
        .eq('created_by', profile.user.id)
        .eq('role', 'athlete')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        const formattedCodes = data.map(code => ({
          code: code.code,
          sport_name: code.sports?.name,
          gender: code.gender as GenderType | undefined,
          created_at: code.created_at,
          used: !!code.used_at
        }));
        setRecentCodes(formattedCodes);
      }
    } catch (error) {
      console.error('Error fetching recent codes:', error);
    }
  };

  const generateCode = async () => {
    setGenerating(true);
    setError(null);

    try {
      if (!sportId) {
        throw new Error('Please select a sport');
      }
      if (!gender) {
        throw new Error('Please select a gender');
      }

      const code = generateReadableCode();
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error('Authentication required');

      const { error: insertError } = await supabase
        .from('access_codes')
        .insert({
          code,
          role: 'athlete',
          sport_id: sportId,
          gender: gender,
          created_by: userData.user.id
        });

      if (insertError) throw insertError;

      setGeneratedCode(code);
      await fetchRecentCodes();
      
      toast({
        title: "Success",
        description: `New athlete access code generated: ${code}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate code';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateReadableCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const parts = [
      Array(2).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join(''),
      Array(3).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join(''),
      Array(2).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('')
    ];
    return parts.join('-');
  };

  const handleShare = async (method: 'copy' | 'email' | 'share') => {
    if (!generatedCode) return;
  
    const selectedSport = sports.find(s => s.id === sportId);
    const sportText = selectedSport ? ` for ${selectedSport.name}` : '';
    const genderText = gender ? ` (${gender}'s)` : '';
    const message = `Athlete Access Code: ${generatedCode}${sportText}${genderText}`;
    const link = `${window.location.origin}/join?code=${generatedCode}`;
    const fullMessage = `${message}\n\nJoin using this link: ${link}`;
  
    try {
      switch (method) {
        case 'copy':
          await navigator.clipboard.writeText(fullMessage);
          toast({ 
            title: "Copied",
            description: "Access code and link copied to clipboard"
          });
          break;
          
        case 'email':
          const emailSubject = encodeURIComponent('Team Access Code Invitation');
          const emailBody = encodeURIComponent(fullMessage);
          window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
          break;
          
        case 'share':
          if (navigator.share) {
            await navigator.share({
              title: 'Team Access Code Invitation',
              text: message,
              url: link
            });
          } else {
            await navigator.clipboard.writeText(fullMessage);
            toast({
              title: "Copied",
              description: "Sharing not available. Code copied instead."
            });
          }
          break;
      }
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: "Error",
        description: "Failed to share code. Please try copying manually.",
        variant: "destructive"
      });
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    } as const;

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
      }
    }
    return 'just now';
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Ticket className="h-8 w-8 text-blue-400" />
              Athlete Invitations
            </h1>
            <p className="text-gray-400">
              Generate and share access codes for your athletes
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative grid gap-8 lg:grid-cols-2">
        {/* Generator Form */}
        <Card className="bg-black/40 backdrop-blur-xl border border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <UserCircle className="h-5 w-5 text-blue-400" />
              Generate Athlete Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Sport</Label>
                <Select value={sportId} onValueChange={setSportId}>
                  <SelectTrigger className="bg-blue-500/5 border-blue-500/20 text-white">
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {sports.map((sport) => (
                      <SelectItem key={sport.id} value={sport.id}>
                        {sport.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Gender</Label>
                <Select value={gender} onValueChange={(value: GenderType) => setGender(value)}>
                  <SelectTrigger className="bg-blue-500/5 border-blue-500/20 text-white">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Men's</SelectItem>
                    <SelectItem value="female">Women's</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={generateCode}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                disabled={generating}
              >
                {generating ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4" />
                    Generate Code
                  </div>
                )}
              </Button>
            </div>

            {generatedCode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="p-6 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-center font-mono text-3xl font-bold tracking-wider text-white">
                    {generatedCode}
                  </p>
                  <p className="text-center text-sm text-gray-400 mt-2">
                    Share this code with your athlete
                  </p>
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleShare('copy')}
                    className="flex items-center gap-2 border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleShare('email')}
                    className="flex items-center gap-2 border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleShare('share')}
                    className="flex items-center gap-2 border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Recent Codes */}
        <Card className="bg-black/40 backdrop-blur-xl border border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-blue-400" />
                Recent Codes
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchRecentCodes}
                className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCodes.length > 0 ? (
                recentCodes.map((code) => (
                  <motion.div
                    key={code.code}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 group hover:bg-blue-500/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <UserCircle className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-mono font-bold text-white group-hover:text-blue-400 transition-colors">
                            {code.code}
                          </p>
                          <p className="text-sm text-gray-400">
                            Athlete
                            {code.sport_name && ` • ${code.sport_name}`}
                            {code.gender && ` • ${code.gender}'s`}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-gray-400">
                          {formatTimeAgo(code.created_at)}
                        </span>
                        {code.used ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Used
                          </span>
                        ) : (
                          <span className="text-xs text-blue-400">Available</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300">No recent codes</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Generated codes will appear here
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}