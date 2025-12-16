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

  // Log query errors
  useEffect(() => {
    if (meQuery.error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/760bc25d-e8ba-4165-b3f9-c668c21d5be2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:25',message:'auth.me query error',data:{errorMessage:meQuery.error?.message,hasSession:!!session,hasAccessToken:!!session?.access_token,errorData:meQuery.error?.data,errorCode:meQuery.error?.data?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error("[Auth] Error fetching user data:", meQuery.error);
      console.log("[Auth] Session exists:", !!session);
      console.log("[Auth] Session token:", session?.access_token ? "Present" : "Missing");
      console.log("[Auth] Supabase User:", supabaseUser);
    }
  }, [meQuery.error, session, supabaseUser]);

  // Log query success and null responses
  useEffect(() => {
    if (meQuery.data !== undefined) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/760bc25d-e8ba-4165-b3f9-c668c21d5be2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:31',message:'auth.me query response',data:{hasUser:!!meQuery.data,isNull:meQuery.data===null,userId:meQuery.data?.id,userEmail:meQuery.data?.email,isLoading:meQuery.isLoading,isError:meQuery.isError},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      if (meQuery.data) {
        console.log("[Auth] User data fetched successfully:", meQuery.data);
      } else {
        console.warn("[Auth] User data is null - backend returned null user");
      }
    }
  }, [meQuery.data, meQuery.isLoading, meQuery.isError]);

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
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/760bc25d-e8ba-4165-b3f9-c668c21d5be2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:59',message:'Initial session check',data:{hasSession:!!session,hasAccessToken:!!session?.access_token,userId:session?.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/760bc25d-e8ba-4165-b3f9-c668c21d5be2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:67',message:'Auth state change',data:{event,hasSession:!!session,hasUser:!!session?.user,userId:session?.user?.id,hasAccessToken:!!session?.access_token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
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
    
    // If we have a session but no user from backend, create a minimal user from Supabase
    // This allows the app to work even if database is unavailable
    let user = meQuery.data ?? null;
    if (!user && session && supabaseUser) {
      // Create a minimal user object from Supabase user for graceful degradation
      user = {
        id: 0,
        supabaseUserId: supabaseUser.id,
        email: supabaseUser.email ?? null,
        name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || null,
        role: 'user' as const,
        preferredLanguage: 'en' as const,
        loginMethod: supabaseUser.app_metadata?.provider || 'email',
        lastSignedIn: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
    
    return {
      user,
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
