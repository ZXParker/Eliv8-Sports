import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface SubscriptionCallback<T = any> {
  (payload: {
    new: T;
    old: T;
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  }): void;
}

export class RealtimeSubscription {
  private channel: RealtimeChannel;
  private table: string;

  constructor(table: string) {
    this.table = table;
    this.channel = supabase.channel(`public:${table}`);
  }

  subscribe(callback: SubscriptionCallback) {
    this.channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: this.table },
        (payload) => {
          callback({
            new: payload.new,
            old: payload.old,
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          });
        }
      )
      .subscribe();

    return () => {
      this.channel.unsubscribe();
    };
  }
}

export function createRealtimeSubscription(table: string) {
  return new RealtimeSubscription(table);
}
