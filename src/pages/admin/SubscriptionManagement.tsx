import { useState, useEffect } from 'react';
import { motion, } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/use-toast';
import { 
  CreditCard, 
  Clock, 
  Receipt, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Calendar,
  DollarSign,
  ArrowUpCircle,
  X,
  Plus,
  CreditCardIcon,
  Wallet,
  RefreshCw
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

interface Subscription {
  id: string;
  plan: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  amount: number;
}

interface BillingHistory {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  isDefault: boolean;
}

export default function SubscriptionManagement() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshingHistory, setRefreshingHistory] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      brand: 'visa',
      last4: '4242',
      exp_month: 12,
      exp_year: 2024,
      isDefault: true
    }
  ]);

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
    }
  }, [user]);

  // Set up real-time updates
  useRealtimeSubscription('subscriptions', async (payload) => {
    if (payload.new?.id === subscription?.id) {
      await fetchSubscriptionData();
    }
  });

  const fetchSubscriptionData = async () => {
    if (!user?.id) return;
    
    try {
      setError(null);

      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subError) throw subError;
      setSubscription(subData);

      if (subData) {
        await fetchBillingHistory();
      }
    } catch (error) {
      console.error('Subscription Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load subscription');
      toast({
        title: "Error",
        description: "Failed to load subscription details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingHistory = async () => {
    if (!subscription?.id) return;

    try {
      setRefreshingHistory(true);
      
      const { data: historyData, error: historyError } = await supabase
        .from('billing_history')
        .select('*')
        .eq('subscription_id', subscription.id)
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;
      setBillingHistory(historyData || []);
    } catch (error) {
      console.error('Billing History Error:', error);
      toast({
        title: "Error",
        description: "Failed to load billing history",
        variant: "destructive"
      });
    } finally {
      setRefreshingHistory(false);
    }
  };

  const handleSubscriptionUpdate = async (action: 'cancel' | 'resume') => {
    setUpdating(true);
    setError(null);

    try {
      if (!subscription?.id) throw new Error('No active subscription');

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: action === 'cancel',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: action === 'cancel' 
          ? "Your subscription will cancel at the end of the billing period"
          : "Your subscription has been resumed",
      });

      await fetchSubscriptionData();
    } catch (error) {
      console.error('Update Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update subscription');
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSetDefaultPaymentMethod = async (methodId: string) => {
    setUpdating(true);
    try {
      const updatedMethods = paymentMethods.map(method => ({
        ...method,
        isDefault: method.id === methodId
      }));
      setPaymentMethods(updatedMethods);
      
      toast({
        title: "Success",
        description: "Default payment method updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment method",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <LoadingSpinner size="lg" className="text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading subscription details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 backdrop-blur-xl p-6 rounded-lg border border-blue-500/20"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-blue-400" />
              Subscription & Billing
            </h1>
            <p className="text-gray-400">
              Manage your subscription plan, payment methods, and billing history
            </p>
          </div>
          {subscription && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-400">
                Next billing date: {formatDate(subscription.current_period_end)}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8">
        {/* Current Plan Section */}
        <Card className="bg-black/40 backdrop-blur-xl border border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-blue-400" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Plan Details */}
                  <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-2">
                    <p className="text-sm text-gray-400">Plan Type</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold text-white">{subscription.plan}</p>
                      {subscription.status === 'active' && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold text-blue-400">
                      {formatAmount(subscription.amount)}<span className="text-sm font-normal text-gray-400">/month</span>
                    </p>
                  </div>

                  {/* Billing Period */}
                  <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-2">
                    <p className="text-sm text-gray-400">Current Period</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        Started: {formatDate(subscription.current_period_start)}
                      </div>
                      <div className="flex items-center gap-2 text-white">
                        <ArrowUpCircle className="h-4 w-4 text-blue-400" />
                        Renews: {formatDate(subscription.current_period_end)}
                      </div>
                    </div>
                  </div>

                  {/* Auto-Renewal Status */}
                  <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-2">
                    <p className="text-sm text-gray-400">Auto-Renewal</p>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {subscription.cancel_at_period_end ? (
                          <AlertCircle className="h-4 w-4 text-amber-400" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        )}
                        <span className="text-white">
                          {subscription.cancel_at_period_end
                            ? 'Cancels at period end'
                            : 'Active - Will renew'}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleSubscriptionUpdate(
                          subscription.cancel_at_period_end ? 'resume' : 'cancel'
                        )}
                        disabled={updating}
                        className="w-full border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
                      >
                        {updating ? (
                          <LoadingSpinner size="sm" />
                        ) : subscription.cancel_at_period_end ? (
                          'Resume Subscription'
                        ) : (
                          'Cancel Subscription'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Active Subscription</h3>
                <p className="text-gray-400 mb-6">
                  Choose a plan to get started with our services
                </p>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  View Plans
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods Section */}
        <Card className="bg-black/40 backdrop-blur-xl border border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-400" />
                Payment Methods
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
                onClick={() => {
                  toast({
                    title: "Coming Soon",
                    description: "Adding new payment methods will be available soon",
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <motion.div
                  key={method.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <CreditCardIcon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                      <p className="text-white font-medium flex items-center gap-2">
                          {method.brand} •••• {method.last4}
                          {method.isDefault && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20">
                              Default
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-400">
                          Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                        </p>
                      </div>
                    </div>
                    {!method.isDefault && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefaultPaymentMethod(method.id)}
                          disabled={updating}
                          className="text-gray-400 hover:text-white hover:bg-blue-500/10"
                        >
                          Set Default
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Coming Soon",
                              description: "Removing payment methods will be available soon",
                            });
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Billing History Section */}
        <Card className="bg-black/40 backdrop-blur-xl border border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-400" />
                Billing History
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchBillingHistory()}
                disabled={refreshingHistory}
                className="border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
              >
                <RefreshCw className={`h-4 w-4 ${refreshingHistory ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {billingHistory.length > 0 ? (
                billingHistory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-white">{formatAmount(item.amount)}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                            item.status === 'succeeded'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {item.status === 'succeeded' ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          <span className="capitalize">{item.status}</span>
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Coming Soon",
                              description: "Detailed transaction view will be available soon",
                            });
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No billing history</h3>
                  <p className="text-gray-400">
                    Your billing history will appear here once you have active transactions
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}