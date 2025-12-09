/**
 * tRPC Context
 *
 * Creates the context for each tRPC request, including user authentication via Supabase
 */
import * as db from "../db";
import { verifySupabaseToken } from "../supabase";
/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(authHeader) {
    if (!authHeader)
        return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        return null;
    }
    return parts[1];
}
/**
 * Create tRPC context for each request
 */
export async function createContext(opts) {
    const { req, res } = opts;
    // Try to get the access token from Authorization header
    const accessToken = extractBearerToken(req.headers.authorization);
    if (!accessToken) {
        return { req, res, user: null };
    }
    try {
        // Verify the Supabase token
        const supabaseUser = await verifySupabaseToken(accessToken);
        if (!supabaseUser) {
            return { req, res, user: null };
        }
        // Get or create user in our database
        let user = await db.getUserBySupabaseId(supabaseUser.id);
        if (!user) {
            // Create user in our database
            await db.upsertUser({
                supabaseUserId: supabaseUser.id,
                email: supabaseUser.email ?? null,
                name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || null,
                loginMethod: supabaseUser.app_metadata?.provider || 'email',
                lastSignedIn: new Date(),
            });
            user = await db.getUserBySupabaseId(supabaseUser.id);
        }
        else {
            // Update last signed in
            await db.upsertUser({
                supabaseUserId: supabaseUser.id,
                lastSignedIn: new Date(),
            });
        }
        return { req, res, user: user || null };
    }
    catch (error) {
        console.error("[Auth] Error verifying token:", error);
        return { req, res, user: null };
    }
}
