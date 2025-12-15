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
  
  // #region agent log
  try {
    const fs = require('fs');
    const path = require('path');
    const logPath = '/Users/a/circulo/.cursor/debug.log';
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logEntry = JSON.stringify({location:'context.ts:41',message:'createContext entry',data:{hasAuthHeader:!!req.headers.authorization,hasAccessToken:!!accessToken},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n';
    fs.appendFileSync(logPath, logEntry);
  } catch (e) {}
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
    const logEntry2 = JSON.stringify({location:'context.ts:52',message:'Token verification result',data:{hasSupabaseUser:!!supabaseUser,userId:supabaseUser?.id,userEmail:supabaseUser?.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n';
    fs.appendFileSync(logPath, logEntry2);
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
    try {
      const fs = require('fs');
      const path = require('path');
      const logPath = '/Users/a/circulo/.cursor/debug.log';
      const logDir = path.dirname(logPath);
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      const logEntry3 = JSON.stringify({location:'context.ts:66',message:'Database availability check',data:{hasDatabase:!!database,hasDatabaseUrl:!!process.env.DATABASE_URL,databaseUrlLength:process.env.DATABASE_URL?.length,databaseUrlPrefix:process.env.DATABASE_URL?.substring(0,20)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})+'\n';
      fs.appendFileSync(logPath, logEntry3);
    } catch (e) {}
    // #endregion
    
    if (!database) {
      // #region agent log
      try {
        const fs = require('fs');
        const path = require('path');
        const logPath = '/Users/a/circulo/.cursor/debug.log';
        const logDir = path.dirname(logPath);
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        const logEntry = JSON.stringify({location:'context.ts:71',message:'Database not available',data:{hasDatabaseUrl:!!process.env.DATABASE_URL,databaseUrlPrefix:process.env.DATABASE_URL?.substring(0,30)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})+'\n';
        fs.appendFileSync(logPath, logEntry);
      } catch (e) {}
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
    const logEntry4 = JSON.stringify({location:'context.ts:74',message:'User lookup result',data:{found:!!user,userId:user?.id,supabaseUserId:supabaseUser.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n';
    fs.appendFileSync(logPath, logEntry4);
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
        const logEntry5 = JSON.stringify({location:'context.ts:82',message:'User upsert attempted',data:{supabaseUserId:supabaseUser.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n';
        fs.appendFileSync(logPath, logEntry5);
        // #endregion
        
        user = await db.getUserBySupabaseId(supabaseUser.id);
        
        // #region agent log
        const logEntry6 = JSON.stringify({location:'context.ts:90',message:'User created, lookup result',data:{found:!!user,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n';
        fs.appendFileSync(logPath, logEntry6);
        // #endregion
        
        console.log("[Context] User created, lookup result:", { found: !!user, userId: user?.id });
      } catch (error) {
        // #region agent log
        const logEntry7 = JSON.stringify({location:'context.ts:93',message:'Error creating user',data:{errorMessage:error instanceof Error?error.message:String(error),errorName:error instanceof Error?error.name:'Unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n';
        fs.appendFileSync(logPath, logEntry7);
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
    const logEntry8 = JSON.stringify({location:'context.ts:115',message:'Returning context with user',data:{hasUser:!!user,userId:user?.id,userName:user?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n';
    fs.appendFileSync(logPath, logEntry8);
    // #endregion
    
    console.log("[Context] Returning context with user:", { 
      hasUser: !!user, 
      userId: user?.id,
      userName: user?.name 
    });
    
    return { req, res, user: user || null };
  } catch (error) {
    // #region agent log
    const logEntry9 = JSON.stringify({location:'context.ts:118',message:'Error in createContext',data:{errorMessage:error instanceof Error?error.message:String(error),errorName:error instanceof Error?error.name:'Unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n';
    fs.appendFileSync(logPath, logEntry9);
    // #endregion
    console.error("[Context] Error in createContext:", error);
    if (error instanceof Error) {
      console.error("[Context] Error stack:", error.stack);
    }
    return { req, res, user: null };
  }
}
