import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { Shield, Users, UserCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

type RoleType = 'admin' | 'coach' | 'athlete';

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

export default function RoleSelection() {
  const navigate = useNavigate();
  const { user, setRole } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleRoleSelect = async (selectedRole: RoleType) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        throw new Error('User ID not found. Please try logging in again.');
      }

      // Initialize profile with minimal required fields
      const profileData = {
        id: user.id,
        role: selectedRole,
        full_name: user.email?.split('@')[0] || 'New User',
        updated_at: new Date().toISOString()
      };

      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      let upsertError;
      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id);
        upsertError = error;
      } else {
        // Insert new profile
        const { error } = await supabase
          .from('profiles')
          .insert(profileData);
        upsertError = error;
      }

      if (upsertError) {
        console.error('Error updating profile:', upsertError);
        throw new Error(
          upsertError.message || 'Failed to update profile. Please try again.'
        );
      }

      // Update role in auth store
      setRole(selectedRole);

      // Store display name in sessionStorage
      const displayName = profileData.full_name.split(' ')[0];
      sessionStorage.setItem('firstName', displayName);

      // Navigate based on role
      navigate(`/${selectedRole}`);

    } catch (error) {
      console.error('Error setting role:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to set role. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    {
      id: 'admin' as const,
      title: 'School Administrator',
      description: 'Manage your school or organization',
      icon: Shield,
      gradient: "from-blue-600/20 via-blue-600/10 to-blue-600/5"
    },
    {
      id: 'coach' as const,
      title: 'Coach',
      description: 'Manage your teams and athletes',
      icon: Users,
      gradient: "from-blue-600/20 via-blue-600/10 to-blue-600/5"
    },
    {
      id: 'athlete' as const,
      title: 'Athlete',
      description: 'Track your progress and connect with coaches',
      icon: UserCircle,
      gradient: "from-blue-600/20 via-blue-600/10 to-blue-600/5"
    }
  ];

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
        className="w-full max-w-2xl relative"
      >
        <Card className="bg-background/50 backdrop-blur-sm border border-white/10">
          <CardHeader className="text-center space-y-6">
            <motion.div className="relative inline-block">
              <ColorShiftingCircle className="absolute -left-6 -top-6" delay={1} />
              <h2 className="text-4xl font-bold text-white">Select Your Role</h2>
              <ColorShiftingCircle className="absolute -right-6 -bottom-6" delay={1.5} />
            </motion.div>
            <p className="text-xl text-gray-400">Choose how you'll use the platform</p>
          </CardHeader>
          <CardContent>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-3 text-sm text-red-400 bg-red-900/50 rounded-lg border border-red-500/50"
              >
                {error}
              </motion.div>
            )}
            <div className="grid gap-4 md:grid-cols-3">
              {roles.map(({ id, title, description, icon: Icon }, index) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  whileHover={{ scale: 1.02 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-500/10 rounded-xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                  <Button
                    onClick={() => handleRoleSelect(id)}
                    variant="outline"
                    disabled={isLoading}
                    className="relative h-auto w-full p-6 flex flex-col items-center text-center space-y-4 bg-blue-500/10 border border-white/10 hover:bg-blue-500/20 hover:border-blue-500/50 group transition-all duration-300 hover:translate-y-[-8px] hover:shadow-2xl hover:shadow-blue-500/20"
                  >
                    <motion.div 
                      className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/30 to-blue-500/20 flex items-center justify-center"
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Icon className="h-7 w-7 text-blue-400" />
                    </motion.div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-xl text-white group-hover:text-blue-300 transition-colors">
                        {title}
                      </h3>
                      <p className="text-sm text-gray-400">{description}</p>
                    </div>
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-5 h-5 text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-0 group-hover:translate-x-1" />
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}