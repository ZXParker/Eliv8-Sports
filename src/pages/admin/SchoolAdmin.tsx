import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import {
  Menu,
  Settings as SettingsIcon,
  UserCog,
  Code,
  CreditCard,
  Building2,
  Trophy,
  LogOut,
  Home,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Import components
import AnalyticsOverview from './AnalyticsOverview';
import OrganizationManagement from './OrganizationManagement';
import CoachRegistration from './CoachRegistration';
import CodeGenerator from './CodeGenerator';
import MySports from './MySports';
import SubscriptionManagement from './SubscriptionManagement';
import Settings from './Settings';
import { LucideIcon } from 'lucide-react';

interface NavigationItem {
  name: string;
  path: string;
  icon: LucideIcon;
  description: string;
}

const navigation: NavigationItem[] = [
  { 
    name: 'Overview', 
    path: '/admin', 
    icon: Home,
    description: 'Dashboard analytics and metrics'
  },
  { 
    name: 'Organization', 
    path: '/admin/organization', 
    icon: Building2,
    description: 'Manage organization details'
  },
  { 
    name: 'Coaches', 
    path: '/admin/coaches', 
    icon: UserCog,
    description: 'Manage coaching staff'
  },
  { 
    name: 'Generate Codes', 
    path: '/admin/codes', 
    icon: Code,
    description: 'Create invitation codes'
  },
  { 
    name: 'My Sports', 
    path: '/admin/sports', 
    icon: Trophy,
    description: 'Manage sports programs'
  },
  { 
    name: 'Subscription', 
    path: '/admin/subscription', 
    icon: CreditCard,
    description: 'Manage billing and plans'
  },
  { 
    name: 'Settings', 
    path: '/admin/settings', 
    icon: SettingsIcon,
    description: 'Account preferences'
  }
];

export default function SchoolAdmin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuthStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const NavItem = ({ item, isMobile = false }: { item: NavigationItem; isMobile?: boolean }) => {
    const isActive = location.pathname === item.path;
    
    return (
      <Button
        variant="ghost"
        className={`
          w-full justify-start gap-3 
          ${isActive ? 'bg-blue-500/20 text-white hover:bg-blue-500/30' : 'text-gray-300 hover:bg-blue-500/10 hover:text-white'}
          ${isSidebarCollapsed && !isMobile ? 'px-3' : 'px-4'}
          transition-all duration-200
        `}
        onClick={() => handleNavigation(item.path)}
      >
        <item.icon className={`h-5 w-5 flex-shrink-0 ${isSidebarCollapsed && !isMobile ? 'mr-0' : 'mr-2'}`} />
        {(!isSidebarCollapsed || isMobile) && (
          <div className="flex flex-col items-start">
            <span>{item.name}</span>
            {isMobile && <span className="text-xs text-gray-400">{item.description}</span>}
          </div>
        )}
      </Button>
    );
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center ${isSidebarCollapsed && !isMobile ? 'justify-center' : 'px-4'} py-6`}>
        <div className="bg-blue-500/20 p-2 rounded-full">
          <User className="h-6 w-6 text-blue-400" />
        </div>
        {(!isSidebarCollapsed || isMobile) && (
          <div className="ml-3">
            <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
            <p className="text-xs text-gray-400">School Administrator</p>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-1 px-2">
        {navigation.map((item) => (
          <NavItem key={item.path} item={item} isMobile={isMobile} />
        ))}
      </div>

      {!isMobile && (
        <Button
          variant="ghost"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full w-8 h-8 p-0 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white z-50"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      )}

      <div className="p-2">
        <Button
          variant="ghost"
          className={`w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-300 ${
            isSidebarCollapsed && !isMobile ? 'px-3' : 'px-4'
          }`}
          onClick={handleSignOut}
        >
          <LogOut className={`h-5 w-5 flex-shrink-0 ${isSidebarCollapsed && !isMobile ? 'mr-0' : 'mr-2'}`} />
          {(!isSidebarCollapsed || isMobile) && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="w-10 h-10 p-0 bg-gray-900/50 backdrop-blur-sm border-white/10"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 bg-gray-900/95 border-white/10 p-0">
            <SidebarContent isMobile />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Navigation */}
      <div
        className={`hidden lg:block fixed top-0 left-0 h-full transition-all duration-300 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        } bg-gray-900/95 backdrop-blur-xl border-r border-white/10`}
      >
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}
      >
        <main className="container mx-auto p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-6"
            >
              <Routes>
                <Route index element={<AnalyticsOverview />} />
                <Route path="organization" element={<OrganizationManagement />} />
                <Route path="coaches" element={<CoachRegistration />} />
                <Route path="codes" element={<CodeGenerator />} />
                <Route path="sports/*" element={<MySports />} />
                <Route path="subscription" element={<SubscriptionManagement />} />
                <Route path="settings" element={<Settings />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}