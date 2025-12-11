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
    onError: (error) => {
      console.error("[Auth] Error fetching user data:", error);
      console.log("[Auth] Session exists:", !!session);
      console.log("[Auth] Session token:", session?.access_token ? "Present" : "Missing");
      console.log("[Auth] Supabase User:", supabaseUser);
    },
    onSuccess: (data) => {
      console.log("[Auth] User data fetched successfully:", data);
    },
  });

  // Debug: Log when query is enabled/disabled
  useEffect(() => {
    console.log("[Auth] meQuery state:", {
      enabled: !!session,
      hasSession: !!session,
      isLoading: meQuery.isLoading,
      isError: meQuery.isError,
      data: meQuery.data,
      error: meQuery.error,
    });
  }, [session, meQuery.isLoading, meQuery.isError, meQuery.data, meQuery.error]);

  // Force refetch when session becomes available
  useEffect(() => {
    if (session && !meQuery.data && !meQuery.isLoading && !meQuery.isError) {
      console.log("[Auth] Session available but no user data, forcing refetch");
      meQuery.refetch();
    }
  }, [session, meQuery.data, meQuery.isLoading, meQuery.isError]);

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
        console.log("[Auth] State changed:", event, {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
        });
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          console.log("[Auth] Signed out, clearing user data");
          utils.auth.me.setData(undefined, null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log("[Auth] Signed in or token refreshed, invalidating user query");
          // Refresh user data from backend
          utils.auth.me.invalidate();
          // Also refetch immediately
          setTimeout(() => {
            console.log("[Auth] Refetching user data after sign in");
            utils.auth.me.refetch();
          }, 100);
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
