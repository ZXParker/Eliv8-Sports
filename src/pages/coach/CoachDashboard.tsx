import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  Settings as SettingsIcon, 
  Users, 
  Code, 
  CreditCard, 
  Trophy,
  LogOut,
  User,
  ChevronRight
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { Card } from '@/components/ui/card';

// Import coach components
import Athletes from './Athletes';
import CodeGenerator from './CodeGenerator';
import SubscriptionManagement from './SubscriptionManagement';
import MySports from './MySports';
import Settings from './Settings';

interface NavigationItem {
  name: string;
  path: string;
  icon: any;
  description: string;
}

const navigation: NavigationItem[] = [
  { 
    name: 'Athletes', 
    path: '/coach', 
    icon: Users,
    description: 'Manage your team roster'
  },
  { 
    name: 'Generate Codes', 
    path: '/coach/codes', 
    icon: Code,
    description: 'Create invitation codes'
  },
  { 
    name: 'My Sports', 
    path: '/coach/sports', 
    icon: Trophy,
    description: 'View your sports'
  },
  { 
    name: 'Subscription', 
    path: '/coach/subscription', 
    icon: CreditCard,
    description: 'Manage your plan'
  },
  { 
    name: 'Settings', 
    path: '/coach/settings', 
    icon: SettingsIcon,
    description: 'Account settings'
  }
];

export default function CoachDashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuthStore();

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .single();
        
        if (profile?.first_name) {
          setWelcomeMessage(`Welcome back, Coach ${profile.first_name}!`);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadUserProfile();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const PageTransition = ({ children }: { children: React.ReactNode }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-6"
    >
      {children}
    </motion.div>
  );

  const NavLink = ({ item, isMobile = false }: { item: NavigationItem; isMobile?: boolean }) => (
    <Button
      variant="ghost"
      className={`w-full justify-start mb-2 ${
        location.pathname === item.path
          ? 'bg-blue-500/20 text-white hover:bg-blue-500/30'
          : 'text-gray-300 hover:bg-blue-500/10 hover:text-white'
      } transition-all duration-200`}
      onClick={() => {
        navigate(item.path);
        if (isMobile) setMobileMenuOpen(false);
      }}
    >
      <item.icon className="mr-2 h-5 w-5" />
      <div className="flex flex-col items-start">
        <span className="font-medium">{item.name}</span>
        {isMobile && (
          <span className="text-xs text-gray-400">{item.description}</span>
        )}
      </div>
      {location.pathname === item.path && (
        <ChevronRight className="ml-auto h-5 w-5" />
      )}
    </Button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Welcome Message */}
      {welcomeMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
          <Card className="bg-blue-500/20 backdrop-blur-sm border-white/10 px-4 py-2">
            <p className="text-white font-medium">{welcomeMessage}</p>
          </Card>
        </div>
      )}

      {/* Mobile Navigation */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            className="lg:hidden fixed top-4 right-4 z-50 bg-gray-900/50 backdrop-blur-sm border border-white/10 text-white hover:bg-blue-500/10 p-2 h-10 w-10"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className="w-80 bg-gray-900/95 border-white/10"
        >
          <SheetHeader>
            <div className="flex items-center space-x-3 p-4">
              <div className="bg-blue-500/20 p-2 rounded-full">
                <User className="h-6 w-6 text-blue-400" />
              </div>
              <SheetTitle className="text-white">Coach Portal</SheetTitle>
            </div>
          </SheetHeader>

          <nav className="mt-4 px-2 flex flex-col h-[calc(100vh-140px)]">
            <div className="flex-1">
              <AnimatePresence>
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <NavLink item={item} isMobile />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <Button
              variant="ghost"
              className="w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-300 mt-auto mb-4"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
            </Button>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
        <div className="flex flex-col flex-grow w-64 bg-gray-900/95 backdrop-blur-xl border-r border-white/10 pt-5">
          <div className="flex items-center space-x-3 px-6 mb-8">
            <div className="bg-blue-500/20 p-2 rounded-full">
              <User className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Coach Portal</h1>
            </div>
          </div>

          <div className="flex flex-col flex-1">
            <nav className="flex-1 px-4 space-y-1">
              <AnimatePresence>
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <NavLink item={item} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </nav>

            <Button
              variant="ghost"
              className="mx-4 mb-4 justify-start text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="relative z-10 container mx-auto p-4 lg:p-8 pt-20">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Routes>
                <Route index element={<Athletes />} />
                <Route path="athletes" element={<Athletes />} />
                <Route path="codes" element={<CodeGenerator />} />
                <Route path="subscription" element={<SubscriptionManagement />} />
                <Route path="sports/*" element={<MySports />} />
                <Route path="settings" element={<Settings />} />
              </Routes>
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}