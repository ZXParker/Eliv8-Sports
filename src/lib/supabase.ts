import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase-types';
import { useAuthStore } from '@/store/auth';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'elev8-sports'
    }
  },
  db: {
    schema: 'public'
  }
});

let authListenerInitialized = false;

// Debounced auth state handler to prevent multiple rapid updates
const handleAuthStateChange = async (event: string, session: any) => {
  try {
    const store = useAuthStore.getState();
    const currentUser = store.user;

    if (event === 'SIGNED_IN' && session?.user) {
      const user = session.user;
      
      // Prevent duplicate user updates
      if (currentUser?.id === user.id) return;

      console.log('Setting new user in store:', user.email);
      store.setUser(user);

      // Fetch user's role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profileError && profile?.role) {
        store.setRole(profile.role);
      }
    } else if (event === 'SIGNED_OUT') {
      store.signOut();
    }
  } catch (error) {
    console.error('Auth state change error:', error);
    // Reset state on error
    useAuthStore.getState().signOut();
  }
};

// Initialize auth listener only once
export const initializeAuthListener = () => {
  if (authListenerInitialized) return;
  
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(handleAuthStateChange);

  authListenerInitialized = true;

  // Return cleanup function
  return () => {
    subscription.unsubscribe();
    authListenerInitialized = false;
  };
};

// Initialize auth state
export const initializeAuth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) throw error;

    if (session?.user) {
      await handleAuthStateChange('SIGNED_IN', session);
    }

    // Initialize auth listener
    initializeAuthListener();
  } catch (error) {
    console.error('Error initializing auth:', error);
    useAuthStore.getState().signOut();
  }
};

// Clean method to reset auth state
export const resetAuth = async () => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error resetting auth:', error);
  } finally {
    useAuthStore.getState().signOut();
  }
};
