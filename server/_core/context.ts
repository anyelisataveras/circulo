/**
 * tRPC Context
 * 
 * Creates the context for each tRPC request, including user authentication via Supabase
 */

import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { User } from "../../drizzle/schema.js";
import * as db from "../db.js";
import { verifySupabaseToken } from "../supabase.js";

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
  
  if (!accessToken) {
    console.log("[Context] No access token in Authorization header");
    return { req, res, user: null };
  }
  
  console.log("[Context] Access token received, verifying...");
  
  try {
    // Verify the Supabase token
    const supabaseUser = await verifySupabaseToken(accessToken);
    
    if (!supabaseUser) {
      console.error("[Context] Token verification failed or no user returned");
      return { req, res, user: null };
    }
    
    console.log("[Context] Token verified, Supabase user:", {
      id: supabaseUser.id,
      email: supabaseUser.email,
      hasMetadata: !!supabaseUser.user_metadata,
    });
    
    // Get or create user in our database
    let user = await db.getUserBySupabaseId(supabaseUser.id);
    
    console.log("[Context] User lookup result:", { found: !!user, userId: user?.id });
    
    if (!user) {
      console.log("[Context] User not found, creating new user...");
      // Create user in our database
      await db.upsertUser({
        supabaseUserId: supabaseUser.id,
        email: supabaseUser.email ?? null,
        name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || null,
        loginMethod: supabaseUser.app_metadata?.provider || 'email',
        lastSignedIn: new Date(),
      });
      
      user = await db.getUserBySupabaseId(supabaseUser.id);
      console.log("[Context] User created, lookup result:", { found: !!user, userId: user?.id });
    } else {
      console.log("[Context] User found, updating last signed in...");
      // Update last signed in
      await db.upsertUser({
        supabaseUserId: supabaseUser.id,
        lastSignedIn: new Date(),
      });
    }
    
    console.log("[Context] Returning context with user:", { 
      hasUser: !!user, 
      userId: user?.id,
      userName: user?.name 
    });
    
    return { req, res, user: user || null };
  } catch (error) {
    console.error("[Context] Error in createContext:", error);
    if (error instanceof Error) {
      console.error("[Context] Error stack:", error.stack);
    }
    return { req, res, user: null };
  }
}
