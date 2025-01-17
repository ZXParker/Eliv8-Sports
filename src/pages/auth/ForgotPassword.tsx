import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { KeyRound, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackButton } from '@/components/BackButton';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setSuccess(true);
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
      </div>

      <div className="absolute top-4 left-4">
        <BackButton />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <Card className="bg-background/50 backdrop-blur-sm border border-white/10">
          <CardHeader className="space-y-1 text-center">
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <KeyRound className="w-12 h-12 mx-auto text-blue-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white">Reset your password</h2>
            <p className="text-gray-400">
              Enter your email address and we'll send you a reset link
            </p>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-4"
                >
                  <div className="p-3 rounded-lg bg-blue-500/20 text-blue-300">
                    Check your email for the password reset link
                  </div>
                  <Link
                    to="/login"
                    className="text-blue-400 hover:text-blue-300 transition-colors block"
                  >
                    Back to Sign In
                  </Link>
                </motion.div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
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

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-red-400 bg-red-900/50 p-3 rounded-lg border border-red-500/50"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-white group"
                    disabled={loading}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {loading ? 'Sending reset link...' : 'Send Reset Link'}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Button>
                </form>
              )}
            </AnimatePresence>
          </CardContent>
          <CardFooter className="justify-center">
            <Link
              to="/login"
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
