import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/context/ThemeProvider';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Auth pages
import Login from '@/pages/auth/Login';
import SignUp from '@/pages/auth/SignUp';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import RoleSelection from '@/pages/auth/RoleSelection';

// Main pages
import Home from '@/pages/home';
import About from '@/pages/about';

// Dashboard pages
import SchoolAdmin from '@/pages/admin/SchoolAdmin';
import CoachDashboard from '@/pages/coach/CoachDashboard';
import AthleteDashboard from '@/pages/athlete/AthleteDashboard';

// Settings pages
import AdminSettings from '@/pages/admin/Settings';
import CoachSettings from '@/pages/coach/Settings';
import AthleteSettings from '@/pages/athlete/Settings';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'coach' | 'athlete';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuthStore();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" className="text-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to role selection if no role
  if (!role) {
    return <Navigate to="/roleselection" replace />;
  }

  // Check for required role
  if (requiredRole && role !== requiredRole) {
    // Redirect to appropriate dashboard based on role
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
};

const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Navbar />
    <main className="flex-grow">
      {children}
    </main>
    <Footer />
  </>
);

export default function App() {
  const { user, role, loading, checkSession } = useAuthStore();

  // Initialize auth session on app load
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Show loading spinner while initializing
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" className="text-primary" />
      </div>
    );
  }

  // Function to redirect to appropriate dashboard
  const getDashboardRedirect = () => {
    if (!user) return '/login';
    if (!role) return '/roleselection';
    
    switch (role) {
      case 'admin':
        return '/admin';
      case 'coach':
        return '/coach';
      case 'athlete':
        return '/athlete';
      default:
        return '/roleselection';
    }
  };

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-background antialiased">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/" 
              element={
                user ? (
                  <Navigate to={getDashboardRedirect()} replace />
                ) : (
                  <MainLayout>
                    <Home />
                  </MainLayout>
                )
              } 
            />
            
            {/* Public Routes - No auth required */}
            <Route path="/about" element={
              <MainLayout>
                <About />
              </MainLayout>
            } />

            {/* Auth Routes - Redirect if already authenticated */}
            <Route 
              path="/login" 
              element={
                user ? <Navigate to={getDashboardRedirect()} replace /> : <Login />
              }
            />
            <Route 
              path="/signup" 
              element={
                user ? <Navigate to={getDashboardRedirect()} replace /> : <SignUp />
              }
            />
            <Route 
              path="/forgot-password" 
              element={
                user ? <Navigate to={getDashboardRedirect()} replace /> : <ForgotPassword />
              }
            />
            
            {/* Auth Routes - Protected */}
            <Route 
              path="/roleselection" 
              element={
                <ProtectedRoute>
                  <RoleSelection />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requiredRole="admin">
                  <SchoolAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminSettings />
                </ProtectedRoute>
              }
            />

            {/* Coach Routes */}
            <Route
              path="/coach/*"
              element={
                <ProtectedRoute requiredRole="coach">
                  <CoachDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coach/settings"
              element={
                <ProtectedRoute requiredRole="coach">
                  <CoachSettings />
                </ProtectedRoute>
              }
            />

            {/* Athlete Routes */}
            <Route
              path="/athlete/*"
              element={
                <ProtectedRoute requiredRole="athlete">
                  <AthleteDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/athlete/settings"
              element={
                <ProtectedRoute requiredRole="athlete">
                  <AthleteSettings />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <Toaster />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}