/**
 * OAuth authentication with CSRF protection
 *
 * Implements proper state token validation to prevent CSRF attacks
 */
import { COOKIE_NAME } from "../../shared/const.js";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { randomBytes } from "crypto";
// Store for OAuth state tokens (in production, use Redis or database)
const oauthStates = new Map();
// Clean up expired states every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [state, data] of oauthStates.entries()) {
        if (data.expiresAt < now) {
            oauthStates.delete(state);
        }
    }
}, 5 * 60 * 1000);
function getQueryParam(req, key) {
    const value = req.query[key];
    return typeof value === "string" ? value : undefined;
}
/**
 * Generate a cryptographically secure OAuth state token
 */
function generateOAuthState(redirectUri) {
    const state = randomBytes(32).toString("hex");
    oauthStates.set(state, {
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        redirectUri,
    });
    return state;
}
/**
 * Validate OAuth state token
 */
function validateOAuthState(state) {
    const data = oauthStates.get(state);
    if (!data) {
        return null;
    }
    if (data.expiresAt < Date.now()) {
        oauthStates.delete(state);
        return null;
    }
    // Delete after use (one-time use token)
    oauthStates.delete(state);
    return data.redirectUri;
}
export function registerOAuthRoutes(app) {
    /**
     * Initiate OAuth flow - generates and stores state token
     */
    app.get("/api/oauth/initiate", async (req, res) => {
        try {
            const redirectUri = getQueryParam(req, "redirect") || "/";
            const state = generateOAuthState(redirectUri);
            // Return the state token for the client to use in OAuth redirect
            res.json({
                state,
                message: "State token generated - use this in OAuth redirect"
            });
        }
        catch (error) {
            console.error("[OAuth] Initiate failed", error);
            res.status(500).json({ error: "Failed to initiate OAuth flow" });
        }
    });
    /**
     * OAuth callback - validates state token before processing
     */
    app.get("/api/oauth/callback", async (req, res) => {
        const code = getQueryParam(req, "code");
        const state = getQueryParam(req, "state");
        if (!code || !state) {
            res.status(400).json({ error: "code and state are required" });
            return;
        }
        // CRITICAL: Validate state token to prevent CSRF
        const redirectUri = validateOAuthState(state);
        if (!redirectUri) {
            console.error("[OAuth] Invalid or expired state token");
            res.status(400).json({
                error: "Invalid or expired state token. Please restart the login process."
            });
            return;
        }
        try {
            const tokenResponse = await sdk.exchangeCodeForToken(code, state);
            const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
            if (!userInfo.openId) {
                res.status(400).json({ error: "openId missing from user info" });
                return;
            }
            // Upsert user in database
            await db.upsertUser({
                openId: userInfo.openId,
                name: userInfo.name || null,
                email: userInfo.email ?? null,
                loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
                lastSignedIn: new Date(),
            });
            // Reduced session token expiry to 7 days for better security
            const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
            const sessionToken = await sdk.createSessionToken(userInfo.openId, {
                name: userInfo.name || "",
                expiresInMs: SEVEN_DAYS_MS,
            });
            const cookieOptions = getSessionCookieOptions(req);
            res.cookie(COOKIE_NAME, sessionToken, {
                ...cookieOptions,
                maxAge: SEVEN_DAYS_MS,
                httpOnly: true, // Prevent JavaScript access
                secure: process.env.NODE_ENV === 'production', // HTTPS only in production
                sameSite: 'lax', // CSRF protection
            });
            // Redirect to the original redirect URI
            res.redirect(302, redirectUri);
        }
        catch (error) {
            console.error("[OAuth] Callback failed", error);
            // Don't leak error details to client
            res.status(500).json({ error: "Authentication failed. Please try again." });
        }
    });
}
