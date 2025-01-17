import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { 
  CreditCard, 
  Clock, 
  Receipt, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Settings,
  Calendar,
  DollarSign,
  ArrowUpCircle,
  X
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    fetchSubscriptionData();
  }, []);

  useRealtimeSubscription('subscriptions', (payload) => {
    if (payload.eventType === 'UPDATE' && payload.new.id === subscription?.id) {
      setSubscription(payload.new);
    }
  });

  useRealtimeSubscription('billing_history', () => {
    fetchBillingHistory();
  });

  const fetchSubscriptionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

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
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingHistory = async () => {
    if (!subscription?.id) return;

    try {
      const { data: historyData, error: historyError } = await supabase
        .from('billing_history')
        .select('*')
        .eq('subscription_id', subscription.id)
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;
      setBillingHistory(historyData || []);
    } catch (error) {
      console.error('Billing History Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleSubscriptionUpdate = async (action: 'cancel' | 'resume') => {
    setUpdating(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: action === 'cancel',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription?.id);

      if (error) throw error;
    } catch (error) {
      console.error('Update Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
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
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update payment method');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddPaymentMethod = () => {
    // This would integrate with your payment processor
    console.log('Adding new payment method');
  };

  const handleRemovePaymentMethod = async (methodId: string) => {
    setUpdating(true);
    try {
      const updatedMethods = paymentMethods.filter(method => method.id !== methodId);
      setPaymentMethods(updatedMethods);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to remove payment method');
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
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 backdrop-blur-xl p-6 rounded-lg border border-blue-500/20"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Settings className="h-8 w-8 text-blue-400" />
              Subscription & Billing
            </h1>
            <p className="text-gray-400">
              Manage your subscription, payment methods, and billing history
            </p>
          </div>
        </div>
      </motion.div>

      {error && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Current Subscription */}
        <div className="lg:col-span-8">
          <Card className="bg-black/40 backdrop-blur-xl border border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-400" />
                  Current Subscription
                </h2>
                {subscription?.status === 'active' && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4" />
                    Active
                  </span>
                )}
              </div>

              {subscription ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <p className="text-sm text-gray-400 mb-1">Current Plan</p>
                      <p className="text-xl font-semibold text-white">{subscription.plan}</p>
                      <p className="text-sm text-blue-400 mt-2">
                        {formatAmount(subscription.amount)} / month
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <p className="text-sm text-gray-400 mb-1">Billing Period</p>
                      <div className="flex items-center gap-2 text-white">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        {formatDate(subscription.current_period_start)}
                      </div>
                      <div className="flex items-center gap-2 text-white mt-2">
                        <ArrowUpCircle className="h-4 w-4 text-blue-400" />
                        Renews {formatDate(subscription.current_period_end)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-blue-400" />
                      <span className="text-gray-300">
                        {subscription.cancel_at_period_end
                          ? 'Your subscription will end at the current period end'
                          : 'Your subscription will automatically renew'}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleSubscriptionUpdate(
                        subscription.cancel_at_period_end ? 'resume' : 'cancel'
                      )}
                      disabled={updating}
                      className="border-blue-500/20 text-blue-400 hover:text-white hover:bg-blue-500/20"
                    >
                      {updating ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          <span>Updating...</span>
                        </div>
                      ) : (
                        subscription.cancel_at_period_end ? 'Resume Subscription' : 'Cancel Subscription'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-4">No active subscription</p>
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                    Subscribe Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods */}
        <div className="lg:col-span-4">
          <Card className="bg-black/40 backdrop-blur-xl border border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                  Payment Methods
                </h2>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleAddPaymentMethod}
                  className="border-blue-500/20 text-blue-400 hover:text-white hover:bg-blue-500/20"
                >
                  Add New
                </Button>
              </div>

              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 group hover:bg-blue-500/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-white/10 flex items-center justify-center">
                          <img 
                            src={`/${method.brand.toLowerCase()}.svg`}
                            alt={method.brand}
                            className="h-4 w-4"
                          />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {method.brand} •••• {method.last4}
                          </p>
                          <p className="text-sm text-gray-400">
                            Expires {method.exp_month}/{method.exp_year}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.isDefault ? (
                          <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
                            Default
                          </span>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefaultPaymentMethod(method.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                              disabled={updating}
                            >
                              Set Default
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemovePaymentMethod(method.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                              disabled={updating}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Billing History */}
        <div className="lg:col-span-12">
          <Card className="bg-black/40 backdrop-blur-xl border border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-blue-400" />
                  Billing History
                </h2>
              </div>

              {billingHistory.length > 0 ? (
                <div className="space-y-4">
                  {billingHistory.map((item, index) => (
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
                            <p className="text-white font-medium">{formatAmount(item.amount)}</p>
                            <p className="text-sm text-gray-400">{formatDate(item.created_at)}</p>
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
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No billing history</h3>
                  <p className="text-gray-400">
                    Your billing history will appear here once you have active transactions
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}