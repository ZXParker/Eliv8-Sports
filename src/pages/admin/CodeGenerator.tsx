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
  Users,
  Trophy,
  UserCircle,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';

type RoleType = 'admin' | 'coach' | 'athlete';
type GenderType = 'male' | 'female' | '';

interface Sport {
  id: string;
  name: string;
}

interface RecentCode {
  code: string;
  role: RoleType;
  sport_name?: string;
  gender?: GenderType;
  created_at: string;
  used: boolean;
}

const ROLE_ICONS = {
  admin: Users,
  coach: Trophy,
  athlete: UserCircle
} as const;

export default function CodeGenerator() {
  const { user } = useAuthStore();
  const [role, setRole] = useState<RoleType>('coach');
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
    if (!user?.id) return;
    
    Promise.all([
      fetchSports(),
      fetchRecentCodes()
    ]).finally(() => {
      setLoading(false);
    });
  }, [user]);

  const fetchSports = async () => {
    try {
      const { data, error } = await supabase
        .from('sports')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setSports(data || []);
    } catch (error) {
      console.error('Error fetching sports:', error);
      toast({
        title: "Error",
        description: "Failed to load sports list",
        variant: "destructive"
      });
    }
  };

  const fetchRecentCodes = async () => {
    if (!user?.id) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) {
        throw new Error('Organization not found');
      }

      const { data, error } = await supabase
        .from('access_codes')
        .select(`
          code,
          role,
          gender,
          created_at,
          used_at,
          sports (name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (data) {
       const formattedCodes = data.map(code => ({
  code: code.code,
  role: code.role as RoleType,
  sport_name: code.sports.length > 0 ? code.sports[0].name : undefined, // Accessing the first sport's name
  gender: code.gender as GenderType | undefined,
  created_at: code.created_at,
  used: !!code.used_at
}));

        setRecentCodes(formattedCodes);
      }
    } catch (error) {
      console.error('Error fetching recent codes:', error);
      toast({
        title: "Error",
        description: "Failed to load recent codes",
        variant: "destructive"
      });
    }
  };

  const generateCode = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to generate codes",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      if (role !== 'admin') {
        if (!sportId) throw new Error('Please select a sport');
        if (!gender) throw new Error('Please select a gender');
      }

      // Get organization ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) {
        throw new Error('Organization not found');
      }

      const code = generateReadableCode();
      
      const { error: insertError } = await supabase
        .from('access_codes')
        .insert({
          code,
          role,
          sport_id: role !== 'admin' ? sportId : null,
          gender: role !== 'admin' ? gender : null,
          organization_id: profile.organization_id,
          created_by: user.id
        });

      if (insertError) throw insertError;

      setGeneratedCode(code);
      await fetchRecentCodes();
      
      toast({
        title: "Success",
        description: "New access code generated successfully",
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
    const timestamp = Date.now().toString(36).slice(-3).toUpperCase();
    const random = Array(4).fill(0)
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join('');
    return `${random.slice(0, 2)}-${timestamp}-${random.slice(2)}`;
  };

  const handleShare = async (method: 'copy' | 'email' | 'sms' | 'share') => {
    if (!generatedCode) return;
  
    const selectedSport = sports.find(s => s.id === sportId);
    const sportText = selectedSport ? ` for ${selectedSport.name}` : '';
    const genderText = gender ? ` (${gender}'s)` : '';
    const message = `Here's your access code${sportText}${genderText}: ${generatedCode}`;
    const joinLink = `${window.location.origin}/join?code=${generatedCode}`;
    const fullMessage = `${message}\n\nClick here to join: ${joinLink}`;
  
    try {
      switch (method) {
        case 'copy':
          await navigator.clipboard.writeText(fullMessage);
          toast({ 
            title: "Copied",
            description: "Code and link copied to clipboard"
          });
          break;
          
        case 'email':
          window.location.href = `mailto:?subject=${encodeURIComponent('Your Access Code')}&body=${encodeURIComponent(fullMessage)}`;
          break;
          
        case 'sms':
          window.location.href = `sms:?&body=${encodeURIComponent(fullMessage)}`;
          break;
          
        case 'share':
          if (navigator.share) {
            await navigator.share({
              title: 'Access Code',
              text: message,
              url: joinLink
            });
          } else {
            await navigator.clipboard.writeText(fullMessage);
            toast({
              title: "Copied",
              description: "Sharing not available. Code copied to clipboard instead."
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
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <LoadingSpinner size="lg" className="text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading code generator...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 backdrop-blur-xl rounded-lg border border-blue-500/20 p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Ticket className="h-8 w-8 text-blue-400" />
              Access Code Generator
            </h1>
            <p className="text-gray-400">
              Generate and share access codes for new users
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Generator Form */}
        <Card className="bg-black/40 backdrop-blur-xl border border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Ticket className="h-5 w-5 text-blue-400" />
              Generate New Code
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
                <Label className="text-gray-400">Role</Label>
                <Select value={role} onValueChange={(value: RoleType) => setRole(value)}>
                  <SelectTrigger className="bg-blue-500/5 border-blue-500/20 text-white">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                    <SelectItem value="athlete">Athlete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role !== 'admin' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
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
                </motion.div>
              )}

              <Button
                onClick={generateCode}
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-white"
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
                    Share this code with the new user
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-4">
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
                    onClick={() => handleShare('sms')}
                    className="flex items-center gap-2 border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                  >
                    <MessageSquare className="h-4 w-4" />
                    SMS
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
              <AnimatePresence mode="wait">
                {recentCodes.length > 0 ? (
                  recentCodes.map((code, index) => {
                    const RoleIcon = ROLE_ICONS[code.role];
                    return (
                      <motion.div
                        key={code.code}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 group hover:bg-blue-500/10 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <RoleIcon className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                              <p className="font-mono font-bold text-white group-hover:text-blue-400 transition-colors">
                                {code.code}
                              </p>
                              <p className="text-sm text-gray-400">
                                {code.role.charAt(0).toUpperCase() + code.role.slice(1)}
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
                    );
                  })
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300">No recent codes</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Generated codes will appear here
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}