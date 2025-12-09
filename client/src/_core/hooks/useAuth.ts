import { trpc } from "@/lib/trpc";
import { supabase, signOut as supabaseSignOut } from "@/lib/supabase";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/auth/login" } =
    options ?? {};
  const utils = trpc.useUtils();

  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get user data from our backend (synced with Supabase)
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!session, // Only fetch when we have a session
  });

  // Listen to Supabase auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[Auth] State changed:", event);
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          utils.auth.me.setData(undefined, null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Refresh user data from backend
          utils.auth.me.invalidate();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [utils]);

  const logout = useCallback(async () => {
    try {
      await supabaseSignOut();
      utils.auth.me.setData(undefined, null);
    } catch (error: unknown) {
      console.error("[Auth] Logout error:", error);
      // Still clear local state even if Supabase call fails
      utils.auth.me.setData(undefined, null);
    }
  }, [utils]);

  const state = useMemo(() => {
    // Store user info in localStorage for other tools
    if (meQuery.data) {
      localStorage.setItem(
        "manus-runtime-user-info",
        JSON.stringify(meQuery.data)
      );
    }
    
    return {
      user: meQuery.data ?? null,
      supabaseUser,
      session,
      loading: isLoading || (session && meQuery.isLoading),
      error: meQuery.error ?? null,
      isAuthenticated: !!session && !!supabaseUser,
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    supabaseUser,
    session,
    isLoading,
  ]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (isLoading) return;
    if (session) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;
    if (window.location.pathname.startsWith("/auth/")) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    isLoading,
    session,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
    // Expose session for API calls
    getAccessToken: () => session?.access_token,
  };
}
