/**
 * tRPC Context
 * 
 * Creates the context for each tRPC request, including user authentication via Supabase
 */

import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { User } from "../../drizzle/schema.js";
import * as db from "../db.js";
import { verifySupabaseToken } from "../supabase.js";
import { debugLog } from "./debugLog.js";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Create tRPC context for each request
 * 
 * Simplified version that:
 * 1. Verifies Supabase token
 * 2. Tries to get/create user in database (non-blocking)
 * 3. Returns user even if database operations fail (graceful degradation)
 */
export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const { req, res } = opts;
  
  // Try to get the access token from Authorization header
  const accessToken = extractBearerToken(req.headers.authorization);
  
  if (!accessToken) {
    return { req, res, user: null };
  }
  
  try {
    // Step 1: Verify the Supabase token (this is the critical step)
    const supabaseUser = await verifySupabaseToken(accessToken);
    
    if (!supabaseUser) {
      console.log("[Context] Token verification failed");
      return { req, res, user: null };
    }
    
    console.log("[Context] Token verified, Supabase user:", {
      id: supabaseUser.id,
      email: supabaseUser.email,
    });
    
    // Step 2: Try to get/create user in database (non-blocking)
    // If this fails, we'll still return a basic user object
    let user: User | null = null;
    
    try {
      const database = await db.getDb();
      
      if (database) {
        // Try to get existing user
        try {
          user = await db.getUserBySupabaseId(supabaseUser.id) || null;
        } catch (error) {
          console.warn("[Context] Error looking up user (non-critical):", error instanceof Error ? error.message : String(error));
        }
        
        // If user doesn't exist, try to create it
        if (!user) {
          try {
            await db.upsertUser({
              supabaseUserId: supabaseUser.id,
              email: supabaseUser.email ?? null,
              name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || null,
              loginMethod: supabaseUser.app_metadata?.provider || 'email',
              lastSignedIn: new Date(),
            });
            
            // Try to get the newly created user
            try {
              user = await db.getUserBySupabaseId(supabaseUser.id) || null;
            } catch (error) {
              console.warn("[Context] Error getting user after creation (non-critical):", error instanceof Error ? error.message : String(error));
            }
          } catch (error) {
            console.warn("[Context] Error creating user (non-critical):", error instanceof Error ? error.message : String(error));
            // Continue without user in database
          }
        } else {
          // Update last signed in (non-blocking)
          try {
            await db.upsertUser({
              supabaseUserId: supabaseUser.id,
              lastSignedIn: new Date(),
            });
          } catch (error) {
            // Ignore update errors
          }
        }
      } else {
        console.warn("[Context] Database not available, continuing with Supabase user only");
      }
    } catch (error) {
      // Database operations failed, but we can still proceed
      console.warn("[Context] Database operations failed (non-critical):", error instanceof Error ? error.message : String(error));
    }
    
    // Step 3: Return user (from database if available, otherwise null)
    // The auth.me query will handle returning the Supabase user info if database user is null
    console.log("[Context] Returning context:", { 
      hasUser: !!user, 
      userId: user?.id,
      supabaseUserId: supabaseUser.id,
    });
    
    return { req, res, user };
  } catch (error) {
    console.error("[Context] Error in createContext:", error);
    return { req, res, user: null };
  }
}
