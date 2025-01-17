// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'coach' | 'athlete';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, role, setRole } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role) {
          setRole(profile.role);
        }
      } catch (error) {
        console.error('Error checking role:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkRole();
  }, [user, setRole]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!role) {
    return <Navigate to="/roleselection" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    switch (role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'coach':
        return <Navigate to="/coach" replace />;
      case 'athlete':
        return <Navigate to="/athlete" replace />;
      default:
        return <Navigate to="/roleselection" replace />;
    }
  }

  return <>{children}</>;
}