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
 */
export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const { req, res } = opts;
  
  // Try to get the access token from Authorization header
  const accessToken = extractBearerToken(req.headers.authorization);
  
  // #region agent log
  debugLog('context.ts:41', 'createContext entry', { hasAuthHeader: !!req.headers.authorization, hasAccessToken: !!accessToken }, 'B');
  // #endregion
  
  if (!accessToken) {
    console.log("[Context] No access token in Authorization header");
    return { req, res, user: null };
  }
  
  console.log("[Context] Access token received, verifying...");
  
  try {
    // Verify the Supabase token
    const supabaseUser = await verifySupabaseToken(accessToken);
    
    // #region agent log
    debugLog('context.ts:52', 'Token verification result', { hasSupabaseUser: !!supabaseUser, userId: supabaseUser?.id, userEmail: supabaseUser?.email }, 'D');
    // #endregion
    
    if (!supabaseUser) {
      console.error("[Context] Token verification failed or no user returned");
      return { req, res, user: null };
    }
    
    console.log("[Context] Token verified, Supabase user:", {
      id: supabaseUser.id,
      email: supabaseUser.email,
      hasMetadata: !!supabaseUser.user_metadata,
    });
    
    // Check if database is available
    const database = await db.getDb();
    
    // #region agent log
    debugLog('context.ts:66', 'Database availability check', { hasDatabase: !!database, hasDatabaseUrl: !!process.env.DATABASE_URL, databaseUrlLength: process.env.DATABASE_URL?.length, databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) }, 'A');
    // #endregion
    
    if (!database) {
      // #region agent log
      debugLog('context.ts:71', 'Database not available', { hasDatabaseUrl: !!process.env.DATABASE_URL, databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) }, 'A');
      // #endregion
      console.error("[Context] Database not available - DATABASE_URL may not be configured");
      console.error("[Context] DATABASE_URL present:", !!process.env.DATABASE_URL);
      console.error("[Context] DATABASE_URL length:", process.env.DATABASE_URL?.length);
      console.error("[Context] DATABASE_URL prefix:", process.env.DATABASE_URL?.substring(0, 30));
      console.error("[Context] Cannot create/fetch user without database connection");
      return { req, res, user: null };
    }
    
    // Get or create user in our database
    let user = await db.getUserBySupabaseId(supabaseUser.id);
    
    // #region agent log
    debugLog('context.ts:74', 'User lookup result', { found: !!user, userId: user?.id, supabaseUserId: supabaseUser.id }, 'A');
    // #endregion
    
    console.log("[Context] User lookup result:", { found: !!user, userId: user?.id });
    
    if (!user) {
      console.log("[Context] User not found, creating new user...");
      try {
        // Create user in our database
        await db.upsertUser({
          supabaseUserId: supabaseUser.id,
          email: supabaseUser.email ?? null,
          name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || null,
          loginMethod: supabaseUser.app_metadata?.provider || 'email',
          lastSignedIn: new Date(),
        });
        
        // #region agent log
        debugLog('context.ts:82', 'User upsert attempted', { supabaseUserId: supabaseUser.id }, 'A');
        // #endregion
        
        user = await db.getUserBySupabaseId(supabaseUser.id);
        
        // #region agent log
        debugLog('context.ts:90', 'User created, lookup result', { found: !!user, userId: user?.id }, 'A');
        // #endregion
        
        console.log("[Context] User created, lookup result:", { found: !!user, userId: user?.id });
      } catch (error) {
        // #region agent log
        debugLog('context.ts:93', 'Error creating user', { errorMessage: error instanceof Error ? error.message : String(error), errorName: error instanceof Error ? error.name : 'Unknown' }, 'A');
        // #endregion
        console.error("[Context] Error creating user:", error);
        // Don't fail completely, but log the error
      }
    } else {
      console.log("[Context] User found, updating last signed in...");
      try {
        // Update last signed in
        await db.upsertUser({
          supabaseUserId: supabaseUser.id,
          lastSignedIn: new Date(),
        });
      } catch (error) {
        console.error("[Context] Error updating user:", error);
        // Continue even if update fails
      }
    }
    
    // #region agent log
    debugLog('context.ts:115', 'Returning context with user', { hasUser: !!user, userId: user?.id, userName: user?.name }, 'A');
    // #endregion
    
    console.log("[Context] Returning context with user:", { 
      hasUser: !!user, 
      userId: user?.id,
      userName: user?.name 
    });
    
    return { req, res, user: user || null };
  } catch (error) {
    // #region agent log
    debugLog('context.ts:118', 'Error in createContext', { errorMessage: error instanceof Error ? error.message : String(error), errorName: error instanceof Error ? error.name : 'Unknown' }, 'A');
    // #endregion
    console.error("[Context] Error in createContext:", error);
    if (error instanceof Error) {
      console.error("[Context] Error stack:", error.stack);
    }
    return { req, res, user: null };
  }
}
