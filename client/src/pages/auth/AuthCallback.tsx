import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { APP_TITLE } from "@/const";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the auth code from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorCode = queryParams.get('error') || hashParams.get('error');
        const errorDescription = queryParams.get('error_description') || hashParams.get('error_description');

        if (errorCode) {
          setError(errorDescription || errorCode);
          return;
        }

        // If we have tokens in the URL, set the session
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            setError(error.message);
            return;
          }
        }

        // Exchange code for session (for PKCE flow)
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (error && !accessToken) {
          // Only show error if we don't have tokens already
          console.error("[Auth Callback] Error:", error);
          // Don't show error, just redirect - session might already be set
        }

        // Redirect to dashboard
        setLocation("/dashboard");
      } catch (err: any) {
        console.error("[Auth Callback] Error:", err);
        setError(err.message || "An error occurred during authentication");
      }
    };

    handleAuthCallback();
  }, [setLocation]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Authentication Error
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {error}
          </p>
          <a 
            href="/auth/login"
            className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-slate-600 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          Completing sign in...
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Please wait while we authenticate you
        </p>
      </div>
    </div>
  );
}





