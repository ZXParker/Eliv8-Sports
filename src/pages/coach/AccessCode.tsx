import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AccessCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Verify the access code
      const { data: codeData, error: codeError } = await supabase
        .from('access_codes')
        .select('*')
        .eq('code', code)
        .is('used_at', null)
        .single();

      if (codeError || !codeData) {
        throw new Error('Invalid or expired access code');
      }

      if (codeData.role !== 'coach') {
        throw new Error('This code is not valid for coaches');
      }

      // Update profile with organization
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          organization_id: codeData.organization_id,
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (updateError) throw updateError;

      // Mark code as used
      await supabase
        .from('access_codes')
        .update({
          used_at: new Date().toISOString(),
          used_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('code', code);

      // Add sport association if specified
      if (codeData.sport_id) {
        await supabase
          .from('user_sports')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            sport_id: codeData.sport_id,
            organization_id: codeData.organization_id,
          });
      }

      navigate('/coach');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center space-y-2">
            <Building2 className="w-12 h-12 mx-auto text-indigo-600" />
            <h2 className="text-2xl font-bold">Join Organization</h2>
            <p className="text-gray-500">Enter your access code to join an organization</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                  Access Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-red-600 bg-red-50 p-3 rounded-md"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !code.trim()}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Joining...</span>
                  </div>
                ) : (
                  'Join Organization'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
