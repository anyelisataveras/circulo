/**
 * Supabase Server Client
 *
 * This module provides server-side Supabase client instances for:
 * - Admin operations (using service role key)
 * - Auth verification
 */
import { createClient } from '@supabase/supabase-js';
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
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
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
export function createSupabaseClientWithToken(accessToken) {
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
export async function verifySupabaseToken(accessToken) {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
        return null;
    }
    return user;
}
/**
 * Get user by Supabase user ID (admin operation)
 */
export async function getSupabaseUserById(userId) {
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
