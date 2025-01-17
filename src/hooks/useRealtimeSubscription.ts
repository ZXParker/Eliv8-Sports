import { useEffect } from 'react';
import { createRealtimeSubscription } from '@/lib/supabase-realtime';

export function useRealtimeSubscription(
  table: string,
  callback: (payload: any) => void
) {
  useEffect(() => {
    const subscription = createRealtimeSubscription(table);
    const unsubscribe = subscription.subscribe(callback);
    return () => {
      unsubscribe();
    };
  }, [table, callback]);
}
