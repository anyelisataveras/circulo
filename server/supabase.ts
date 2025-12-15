/**
 * Supabase Server Client
 * 
 * This module provides server-side Supabase client instances for:
 * - Admin operations (using service role key)
 * - Auth verification
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY');
}

/**
 * Public Supabase client (uses anon key)
 * Use for operations that respect RLS policies
 */
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Admin Supabase client (uses service role key)
 * Use for admin operations that bypass RLS
 * CAUTION: Only use server-side, never expose to client
 */
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl || '', supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Create a Supabase client with a user's access token
 * This allows server operations to run as the authenticated user
 */
export function createSupabaseClientWithToken(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl || '', supabaseAnonKey || '', {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Verify a Supabase access token and return the user
 */
export async function verifySupabaseToken(accessToken: string) {
  try {
    // #region agent log
    const fs = require('fs');
    const logPath = '/Users/a/circulo/.cursor/debug.log';
    const logEntry = JSON.stringify({location:'supabase.ts:69',message:'verifySupabaseToken entry',data:{hasToken:!!accessToken,tokenLength:accessToken.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n';
    fs.appendFileSync(logPath, logEntry);
    // #endregion
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    // #region agent log
    const logEntry2 = JSON.stringify({location:'supabase.ts:72',message:'getUser result',data:{hasUser:!!user,hasError:!!error,errorMessage:error?.message,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n';
    fs.appendFileSync(logPath, logEntry2);
    // #endregion
    
    if (error) {
      console.error("[Supabase] Error verifying token:", error);
      return null;
    }
    
    if (!user) {
      console.warn("[Supabase] Token verified but no user returned");
      return null;
    }
    
    console.log("[Supabase] Token verified successfully, user:", {
      id: user.id,
      email: user.email,
    });
    
    return user;
  } catch (error) {
    // #region agent log
    const fs = require('fs');
    const logPath = '/Users/a/circulo/.cursor/debug.log';
    const logEntry3 = JSON.stringify({location:'supabase.ts:90',message:'Exception verifying token',data:{errorMessage:error instanceof Error?error.message:String(error),errorName:error instanceof Error?error.name:'Unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n';
    fs.appendFileSync(logPath, logEntry3);
    // #endregion
    console.error("[Supabase] Exception verifying token:", error);
    return null;
  }
}

/**
 * Get user by Supabase user ID (admin operation)
 */
export async function getSupabaseUserById(userId: string) {
  if (!supabaseAdmin) {
    console.error('[Supabase] Admin client not available');
    return null;
  }
  
  const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  
  if (error || !user) {
    return null;
  }
  
  return user;
}





