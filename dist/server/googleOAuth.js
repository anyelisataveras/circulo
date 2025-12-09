import { google } from 'googleapis';
import { encrypt, encryptJSON, decryptJSON } from './encryption.js';
/**
 * Google OAuth integration for per-user authentication
 * Each user can connect their own Google account for Drive access
 */
const SCOPES = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/drive.readonly', // Read-only access to Drive
    'https://www.googleapis.com/auth/drive.file', // Access to files created by the app
];
/**
 * Get OAuth2 client instance
 */
export function getOAuth2Client() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.VITE_APP_URL || 'http://localhost:3000'}/api/google/callback`;
    if (!clientId || !clientSecret) {
        throw new Error('Google OAuth credentials not configured');
    }
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}
/**
 * Generate authorization URL for user to connect Google account
 */
export function getAuthUrl(userId) {
    const oauth2Client = getOAuth2Client();
    return oauth2Client.generateAuthUrl({
        access_type: 'offline', // Request refresh token
        scope: SCOPES,
        state: encrypt(userId.toString()), // Encrypt user ID in state parameter
        prompt: 'consent', // Force consent screen to ensure refresh token
    });
}
/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code) {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.access_token) {
        throw new Error('No access token received from Google');
    }
    return tokens;
}
/**
 * Get user info from Google
 */
export async function getUserInfo(accessToken) {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    return {
        id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture || undefined,
    };
}
/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken) {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
}
/**
 * Encrypt and store Google tokens securely
 */
export function encryptTokens(tokens) {
    return encryptJSON(tokens);
}
/**
 * Decrypt stored Google tokens
 */
export function decryptTokens(encryptedTokens) {
    return decryptJSON(encryptedTokens);
}
/**
 * Check if access token is expired
 */
export function isTokenExpired(expiryDate) {
    if (!expiryDate)
        return true;
    // Consider token expired 5 minutes before actual expiry
    const bufferTime = 5 * 60 * 1000;
    return Date.now() >= (expiryDate - bufferTime);
}
/**
 * Get valid access token, refreshing if necessary
 */
export async function getValidAccessToken(encryptedTokens) {
    const tokens = decryptTokens(encryptedTokens);
    // If token is still valid, return it
    if (!isTokenExpired(tokens.expiry_date)) {
        return { accessToken: tokens.access_token };
    }
    // Token expired, refresh it
    if (!tokens.refresh_token) {
        throw new Error('No refresh token available. User needs to reconnect Google account.');
    }
    const newTokens = await refreshAccessToken(tokens.refresh_token);
    // Merge new tokens with existing (keep refresh_token if not provided)
    const mergedTokens = {
        ...tokens,
        ...newTokens,
        refresh_token: newTokens.refresh_token || tokens.refresh_token,
    };
    return {
        accessToken: mergedTokens.access_token,
        updatedTokens: encryptTokens(mergedTokens),
    };
}
/**
 * List files from user's Google Drive
 */
export async function listDriveFiles(accessToken, options = {}) {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const response = await drive.files.list({
        pageSize: options.pageSize || 20,
        pageToken: options.pageToken,
        q: options.query,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, iconLink, thumbnailLink)',
        orderBy: 'modifiedTime desc',
    });
    return {
        files: response.data.files || [],
        nextPageToken: response.data.nextPageToken,
    };
}
/**
 * Get file metadata from Google Drive
 */
export async function getDriveFileMetadata(accessToken, fileId) {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const response = await drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, iconLink, thumbnailLink',
    });
    return response.data;
}
/**
 * Download file from Google Drive
 */
export async function downloadDriveFile(accessToken, fileId) {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
}
/**
 * Revoke Google access (disconnect account)
 */
export async function revokeAccess(accessToken) {
    const oauth2Client = getOAuth2Client();
    await oauth2Client.revokeToken(accessToken);
}
