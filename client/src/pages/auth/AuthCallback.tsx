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
        
        const code = queryParams.get('code');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorCode = queryParams.get('error') || hashParams.get('error');
        const errorDescription = queryParams.get('error_description') || hashParams.get('error_description');

        // Check for errors first
        if (errorCode) {
          let errorMessage = errorDescription || errorCode;
          
          // Provide more helpful error messages
          if (errorCode === 'access_denied') {
            errorMessage = 'Authentication was cancelled. Please try again.';
          } else if (errorDescription?.includes('provider is not enabled')) {
            errorMessage = 'Google sign-in is not enabled. Please contact the administrator to enable Google OAuth in Supabase.';
          }
          
          setError(errorMessage);
          return;
        }

        // If we have tokens in the URL hash (implicit flow), set the session
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("[Auth Callback] Session error:", error);
            setError(error.message || "Failed to set session");
            return;
          }
          
          // Successfully set session, wait a bit then redirect to dashboard
          // Use window.location for a full page reload to ensure session is picked up
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 500);
          return;
        }

        // Exchange code for session (for PKCE flow)
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("[Auth Callback] Exchange error:", error);
            setError(error.message || "Failed to exchange code for session");
            return;
          }

          if (data?.session) {
            // Successfully exchanged code, wait a bit then redirect to dashboard
            // Use window.location for a full page reload to ensure session is picked up
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 500);
            return;
          }
        }

        // If we get here, something went wrong
        setError("No authentication code or tokens found in the URL");
      } catch (err: any) {
        console.error("[Auth Callback] Unexpected error:", err);
        setError(err.message || "An unexpected error occurred during authentication");
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






