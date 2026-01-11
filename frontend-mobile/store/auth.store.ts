import { create } from "zustand";
import { User, UserProfile, getSession, getUserProfile, onAuthStateChange, signOut as authSignOut } from "@/services/auth";
import { useEffect } from "react";

type AuthState = {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  loadUserProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  loading: false,
  initialized: false,
  setUser: (user) => set({ user }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setLoading: (loading) => set({ loading }),
  initialize: async () => {
    try {
      set({ loading: true });
      const session = await getSession();
      if (session?.user) {
        set({ user: session.user, initialized: true });
        const profile = await getUserProfile(session.user.id);
        set({ userProfile: profile });
      } else {
        set({ user: null, userProfile: null, initialized: true });
      }
    } catch (error) {
      console.error("[AuthStore] 초기화 에러:", error);
      set({ user: null, userProfile: null, initialized: true });
    } finally {
      set({ loading: false });
    }
  },
  loadUserProfile: async () => {
    const { user } = get();
    if (user) {
      try {
        const profile = await getUserProfile(user.id);
        set({ userProfile: profile });
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    }
  },
  signOut: async () => {
    try {
      await authSignOut();
      set({ user: null, userProfile: null });
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  },
}));

// 최적화된 Auth 상태 구독 훅
export function useAuthState() {
  const setUser = useAuth((s) => s.setUser);
  const loadUserProfile = useAuth((s) => s.loadUserProfile);
  const initialize = useAuth((s) => s.initialize);

  useEffect(() => {
    initialize();
    const { data: { subscription } } = onAuthStateChange(async (user) => {
      setUser(user);
      if (user) {
        await loadUserProfile();
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, loadUserProfile, initialize]);
}