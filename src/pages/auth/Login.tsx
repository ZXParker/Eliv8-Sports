import { useState, } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { LogIn, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth';

interface ColorShiftingCircleProps {
  className?: string;
  delay?: number;
}

const ColorShiftingCircle = ({ className = "", delay = 0 }: ColorShiftingCircleProps) => {
  return (
    <div className={`relative w-6 h-6 ${className}`}>
      <style>
        {`
          @keyframes colorShift {
            0% { background: rgba(59, 130, 246, 0.8); }
            20% { background: rgba(236, 72, 153, 0.8); }
            40% { background: rgba(139, 92, 246, 0.8); }
            60% { background: rgba(52, 211, 153, 0.8); }
            80% { background: rgba(245, 158, 11, 0.8); }
            100% { background: rgba(59, 130, 246, 0.8); }
          }
        `}
      </style>
      <div 
        className="absolute inset-0 rounded-full blur-sm"
        style={{
          animation: `colorShift 10s infinite ${delay}s`,
          animationTimingFunction: "linear"
        }}
      />
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          animation: `colorShift 10s infinite ${delay}s`,
          animationTimingFunction: "linear"
        }}
      />
    </div>
  );
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setUser, setRole, setOrganizationId, initializeAuth } = useAuthStore();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          throw new Error('Invalid email or password. Please try again.');
        } else if (signInError.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email address before signing in.');
        } else {
          throw signInError;
        }
      }

      if (!signInData.user) {
        throw new Error('Sign in failed. Please try again.');
      }

      // Set the user in the auth store
      setUser(signInData.user);

      // Fetch profile to get role, organization, and first name
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, organization_id, full_name')
        .eq('id', signInData.user.id)
        .single();

      if (profileError) {
        throw new Error('Error fetching user profile');
      }

      // If profile exists, set all relevant data
      if (profile) {
        // Set role and organization in auth store
        setRole(profile.role);
        setOrganizationId(profile.organization_id);

        // Store first name in sessionStorage for welcome message
        if (profile.full_name) {
          sessionStorage.setItem('firstName', profile.full_name.split(' ')[0]);
        }

        // Initialize auth state
        await initializeAuth();

        // Navigate based on role
        if (profile.role) {
          switch (profile.role) {
            case 'admin':
              navigate('/admin');
              break;
            case 'coach':
              navigate('/coach');
              break;
            case 'athlete':
              navigate('/athlete');
              break;
            default:
              navigate('/roleselection');
          }
        } else {
          // No role set, go to role selection
          navigate('/roleselection');
        }
      } else {
        // No profile exists, go to role selection
        navigate('/roleselection');
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4 relative">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-ping" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <Card className="bg-background/50 backdrop-blur-sm border border-white/10">
          <CardHeader className="space-y-1 text-center relative">
            <motion.div className="relative inline-block">
              <ColorShiftingCircle className="absolute -left-6 -top-6" delay={1} />
              <LogIn className="w-12 h-12 mx-auto text-blue-400" />
              <h2 className="text-2xl font-bold text-white mt-4">Welcome back</h2>
              <ColorShiftingCircle className="absolute -right-6 -bottom-6" delay={1.5} />
            </motion.div>
            <p className="text-gray-400">Sign in to your account to continue</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
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
                />
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
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-white group relative overflow-hidden"
                disabled={loading || !email.trim() || !password}
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? 'Signing in...' : 'Sign In'}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Forgot your password?
            </Link>
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-400 hover:text-blue-300 transition-colors">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}