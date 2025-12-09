import { google } from 'googleapis';
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
export class GoogleDriveService {
    oauth2Client;
    constructor(config) {
        this.oauth2Client = new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri);
    }
    /**
     * Generate OAuth2 authorization URL
     */
    getAuthUrl() {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent', // Force consent to get refresh token
        });
    }
    /**
     * Exchange authorization code for tokens
     */
    async getTokensFromCode(code) {
        const { tokens } = await this.oauth2Client.getToken(code);
        return tokens;
    }
    /**
     * Set credentials for API calls
     */
    setCredentials(accessToken, refreshToken, expiryDate) {
        this.oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
            expiry_date: expiryDate,
        });
    }
    /**
     * List files from Google Drive
     */
    async listFiles(options = {}) {
        const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
        const response = await drive.files.list({
            pageSize: options.pageSize || 100,
            pageToken: options.pageToken,
            q: options.query || "trashed=false",
            orderBy: options.orderBy || 'modifiedTime desc',
            fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink, thumbnailLink)',
        });
        return {
            files: response.data.files || [],
            nextPageToken: response.data.nextPageToken,
        };
    }
    /**
     * Get file metadata
     */
    async getFileMetadata(fileId) {
        const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
        const response = await drive.files.get({
            fileId,
            fields: 'id, name, mimeType, size, modifiedTime, webViewLink, iconLink, thumbnailLink, description',
        });
        return response.data;
    }
    /**
     * Download file content
     */
    async downloadFile(fileId) {
        const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
        const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    }
    /**
     * Export Google Workspace file to specific format
     */
    async exportFile(fileId, mimeType) {
        const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
        const response = await drive.files.export({ fileId, mimeType }, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    }
    /**
     * Check if file is a Google Workspace file that needs export
     */
    isGoogleWorkspaceFile(mimeType) {
        return mimeType.startsWith('application/vnd.google-apps.');
    }
    /**
     * Get export MIME type for Google Workspace files
     */
    getExportMimeType(googleMimeType) {
        const exportMap = {
            'application/vnd.google-apps.document': 'application/pdf',
            'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.google-apps.presentation': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.google-apps.drawing': 'application/pdf',
        };
        return exportMap[googleMimeType] || 'application/pdf';
    }
    /**
     * Refresh access token if expired
     */
    async refreshAccessToken() {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        return credentials.access_token;
    }
}
