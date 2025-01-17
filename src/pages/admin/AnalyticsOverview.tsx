import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserCog, User, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuthStore } from '@/store/auth';
import {
  fetchDashboardAnalytics,
  fetchUserDetails,
  setupRealtimeAnalytics,
  type UserDetails,
  type DashboardCounts
} from '@/lib/analytics';

export default function AnalyticsOverview() {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<DashboardCounts>({
    totalUsers: 0,
    totalAthletes: 0,
    totalCoaches: 0,
    organizationId: null
  });
  const [selectedUsers, setSelectedUsers] = useState<UserDetails[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      const data = await fetchDashboardAnalytics(user.id);
      setAnalytics(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load analytics');
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up realtime updates
  useEffect(() => {
    if (!analytics.organizationId) return;

    const unsubscribe = setupRealtimeAnalytics(analytics.organizationId, (newCounts) => {
      setAnalytics(newCounts);
    });

    return () => {
      unsubscribe();
    };
  }, [analytics.organizationId]);

  const handleCardClick = async (type: 'all' | 'athletes' | 'coaches') => {
    if (!user) return;

    setIsModalOpen(true);
    setModalTitle(type === 'all' ? 'All Users' : type === 'athletes' ? 'Athletes' : 'Coaches');
    setDetailsLoading(true);
    
    try {
      const users = await fetchUserDetails(type !== 'all' ? type : undefined);
      setSelectedUsers(users);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load user details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const cards = [
    {
      title: 'Total Users',
      value: analytics.totalUsers,
      icon: Users,
      bgColor: 'from-blue-500/20 to-blue-500/10',
      iconColor: 'text-blue-500',
      borderColor: 'group-hover:border-blue-500/50',
      onClick: () => handleCardClick('all')
    },
    {
      title: 'Total Athletes',
      value: analytics.totalAthletes,
      icon: User,
      bgColor: 'from-emerald-500/20 to-emerald-500/10',
      iconColor: 'text-emerald-500',
      borderColor: 'group-hover:border-emerald-500/50',
      onClick: () => handleCardClick('athletes')
    },
    {
      title: 'Total Coaches',
      value: analytics.totalCoaches,
      icon: UserCog,
      bgColor: 'from-purple-500/20 to-purple-500/10',
      iconColor: 'text-purple-500',
      borderColor: 'group-hover:border-purple-500/50',
      onClick: () => handleCardClick('coaches')
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <LoadingSpinner size="lg" className="text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="group"
          >
            <Card 
              onClick={card.onClick}
              className={`
                cursor-pointer relative overflow-hidden transition-all duration-300
                border border-white/10 ${card.borderColor}
                hover:shadow-lg hover:shadow-black/10
              `}
            >
              {/* Gradient Background */}
              <div 
                className={`absolute inset-0 opacity-50 bg-gradient-to-br ${card.bgColor}`} 
              />
              
              <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </CardHeader>
              
              <CardContent className="relative">
                <div className="text-3xl font-bold">{card.value.toLocaleString()}</div>
              </CardContent>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900/90 backdrop-blur-md border border-white/10 w-full max-w-4xl rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">{modalTitle}</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4">
                {detailsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <LoadingSpinner size="lg" className="text-primary" />
                    <p className="text-muted-foreground animate-pulse">Loading user details...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-3 text-gray-400">Name</th>
                          <th className="text-left p-3 text-gray-400">Email</th>
                          <th className="text-left p-3 text-gray-400">Role</th>
                          <th className="text-left p-3 text-gray-400">Sports</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUsers.map((user) => (
                          <motion.tr 
                            key={user.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border-b border-white/10 last:border-0"
                          >
                            <td className="p-3 text-white">{user.full_name}</td>
                            <td className="p-3 text-gray-300">{user.email}</td>
                            <td className="p-3">
                              <span className={`
                                px-2 py-1 rounded-full text-xs
                                ${user.role === 'admin' ? 'bg-blue-500/20 text-blue-400' :
                                  user.role === 'coach' ? 'bg-purple-500/20 text-purple-400' :
                                  'bg-emerald-500/20 text-emerald-400'}
                              `}>
                                {user.role}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-2">
                                {user.sports.map((sport, idx) => (
                                  <span
                                    key={idx}
                                    className={`px-2 py-1 rounded-full text-xs
                                      ${sport.gender === 'male' 
                                        ? 'bg-blue-500/20 text-blue-400' 
                                        : sport.gender === 'female'
                                        ? 'bg-pink-500/20 text-pink-400'
                                        : 'bg-gray-500/20 text-gray-400'
                                      }`}
                                  >
                                    {sport.gender ? `${sport.gender}'s ` : ''}{sport.name}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>

                    {selectedUsers.length === 0 && (
                      <div className="text-center py-12 text-gray-400">
                        No users found in this category
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}