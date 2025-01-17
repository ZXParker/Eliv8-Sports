import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { UserPlus, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuthStore } from '@/store/auth';

export default function SignUp() {
  const navigate = useNavigate();
  const { setUser, setRole } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to handle auth state
  useEffect(() => {
    const authListener = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          // Wait for profile creation
          await new Promise(resolve => setTimeout(resolve, 1000));

          if (accessCode.trim()) {
            // Check if we have a valid access code
            const { data: codeData } = await supabase
              .from('access_codes')
              .select('*')
              .eq('code', accessCode.trim())
              .single();

            if (codeData) {
              navigate(`/dashboard/${codeData.role}`, { replace: true });
            } else {
              navigate('/RoleSelection', { replace: true });
            }
          } else {
            navigate('/RoleSelection', { replace: true });
          }
          setLoading(false);
        } catch (error) {
          console.error('Navigation error:', error);
          setLoading(false);
        }
      }
    });

    return () => {
      authListener.data.subscription.unsubscribe();
    };
  }, [navigate, accessCode]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!email.trim()) throw new Error('Email is required');
      if (!fullName.trim()) throw new Error('Full name is required');
      if (password !== confirmPassword) throw new Error('Passwords do not match');
      if (password.length < 8) throw new Error('Password must be at least 8 characters long');

      // Sign up
      const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!newUser) throw new Error('Failed to create account');

      setUser(newUser);

      if (accessCode.trim()) {
        const { data: codeData, error: codeError } = await supabase
          .from('access_codes')
          .select('*')
          .eq('code', accessCode.trim())
          .is('used_at', null)
          .single();

        if (codeError || !codeData) {
          throw new Error('Invalid or expired access code');
        }

        await supabase
          .from('access_codes')
          .update({
            used_at: new Date().toISOString(),
            used_by: newUser.id,
          })
          .eq('code', accessCode.trim());

        await supabase
          .from('profiles')
          .update({
            role: codeData.role,
            organization_id: codeData.organization_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', newUser.id);

        if (codeData.sport_id) {
          await supabase
            .from('user_sports')
            .insert({
              user_id: newUser.id,
              sport_id: codeData.sport_id,
              organization_id: codeData.organization_id,
              created_at: new Date().toISOString()
            });
        }

        setRole(codeData.role);
        // Navigation will be handled by the auth state change listener
      }

    } catch (error) {
      console.error('Signup error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setUser(null);
      setRole(null);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4 relative">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <Card className="bg-background/50 backdrop-blur-sm border border-white/10">
          <CardHeader className="space-y-1 text-center">
            <UserPlus className="w-12 h-12 mx-auto text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Create an account</h2>
            <p className="text-gray-400">Enter your details to get started</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium text-gray-300">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-300">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500">
                  Must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="accessCode" className="text-sm font-medium flex justify-between text-gray-300">
                  <span>Access Code</span>
                  <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  id="accessCode"
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
                <p className="text-xs text-gray-500">
                  Required only if joining a team or organization
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-sm text-red-400 bg-red-900/50 p-3 rounded-lg border border-red-500/50"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-white group"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Creating account...</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign Up
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter>
            <p className="text-sm text-gray-400 text-center w-full">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
