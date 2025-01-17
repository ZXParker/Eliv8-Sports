import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  role: 'admin' | 'coach' | 'athlete' | null;
  organizationId: string | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setRole: (role: 'admin' | 'coach' | 'athlete' | null) => void;
  setOrganizationId: (orgId: string | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      organizationId: null,
      loading: true,
      initialized: false,

      checkSession: async () => {
        try {
          // Get current session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            // Get user profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, organization_id')
              .eq('id', session.user.id)
              .single();

            set({
              user: session.user,
              role: profile?.role || null,
              organizationId: profile?.organization_id || null,
              loading: false,
              initialized: true
            });
          } else {
            set({
              user: null,
              role: null,
              organizationId: null,
              loading: false,
              initialized: true
            });
          }
        } catch (error) {
          console.error('Session check error:', error);
          set({
            loading: false,
            initialized: true
          });
        }
      },

      setUser: (user) => {
        if (!user) {
          set({ 
            user: null, 
            role: null, 
            organizationId: null, 
            loading: false 
          });
          return;
        }

        set((state) => {
          if (user.id === state.user?.id) return {};
          return { user, loading: false };
        });
      },

      setRole: async (role) => {
        const state = get();
        if (role === state.role) return;

        set({ loading: true });

        try {
          if (state.user?.id) {
            const { error } = await supabase
              .from('profiles')
              .update({
                role,
                updated_at: new Date().toISOString()
              })
              .eq('id', state.user.id);

            if (error) throw error;
          }

          set({ role, loading: false });
        } catch (error) {
          console.error('Error updating role:', error);
          set({ loading: false });
        }
      },

      setOrganizationId: (orgId) => set({ organizationId: orgId }),
      
      setLoading: (loading) => set({ loading }),

      signOut: async () => {
        set({ loading: true });

        try {
          await supabase.auth.signOut();
          set({
            user: null,
            role: null,
            organizationId: null,
            loading: false
          });
        } catch (error) {
          console.error('Sign out error:', error);
          set({ loading: false });
        }
      },

      initializeAuth: async () => {
        const state = get();
        if (!state.user?.id) return;

        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role, organization_id')
            .eq('id', state.user.id)
            .single();

          if (error) throw error;

          set({
            role: profile.role,
            organizationId: profile.organization_id,
            loading: false
          });
        } catch (error) {
          console.error('Error initializing auth:', error);
          set({ loading: false });
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        role: state.role,
        organizationId: state.organizationId
      })
    }
  )
);

// Selector hooks
export const useUser = () => useAuthStore((state) => state.user);
export const useRole = () => useAuthStore((state) => state.role);
export const useOrganizationId = () => useAuthStore((state) => state.organizationId);
export const useAuthLoading = () => useAuthStore((state) => state.loading);
export const useAuthInitialized = () => useAuthStore((state) => state.initialized);