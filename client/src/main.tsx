import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on authentication errors
        if (error instanceof TRPCClientError && error.message === UNAUTHED_ERR_MSG) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5000, // Consider data fresh for 5 seconds
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Don't redirect if already on auth pages
  if (window.location.pathname.startsWith('/auth/')) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

/**
 * Get the current Supabase access token
 */
async function getAccessToken(): Promise<string | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error("[tRPC] Error getting session:", error);
    return null;
  }
  const token = session?.access_token ?? null;
  if (!token) {
    console.warn("[tRPC] No access token available in session");
  }
  return token;
}

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      async headers() {
        const token = await getAccessToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
          console.log("[tRPC] Sending request with Authorization header");
        } else {
          console.warn("[tRPC] No token available, request will be unauthenticated");
        }
        return headers;
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        }).then(async (response) => {
          // Check if response is HTML instead of JSON (indicates server error)
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            const text = await response.text();
            console.error('[tRPC] Received HTML instead of JSON. Server may have returned an error page.');
            console.error('[tRPC] Response:', text.substring(0, 200));
            throw new Error('Server returned HTML instead of JSON. Check server logs for errors.');
          }
          return response;
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
