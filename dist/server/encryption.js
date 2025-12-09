import crypto from 'crypto';
/**
 * Encryption utilities for securing sensitive data like OAuth tokens
 * Uses AES-256-GCM for authenticated encryption
 */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
/**
 * Get encryption key from environment
 * Falls back to JWT_SECRET if ENCRYPTION_KEY is not set
 */
function getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
    if (!key) {
        throw new Error('ENCRYPTION_KEY or JWT_SECRET must be set');
    }
    return key;
}
/**
 * Derive a key from the master key and salt using PBKDF2
 */
function deriveKey(masterKey, salt) {
    return crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha256');
}
/**
 * Encrypt sensitive data (like OAuth tokens)
 * Returns base64-encoded string containing salt, IV, encrypted data, and auth tag
 */
export function encrypt(plaintext) {
    try {
        const masterKey = getEncryptionKey();
        // Generate random salt and IV
        const salt = crypto.randomBytes(SALT_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);
        // Derive encryption key from master key and salt
        const key = deriveKey(masterKey, salt);
        // Create cipher and encrypt
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(plaintext, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        // Get authentication tag
        const tag = cipher.getAuthTag();
        // Combine salt + iv + encrypted + tag and encode as base64
        const combined = Buffer.concat([
            salt,
            iv,
            Buffer.from(encrypted, 'base64'),
            tag
        ]);
        return combined.toString('base64');
    }
    catch (error) {
        console.error('[Encryption] Failed to encrypt data:', error);
        throw new Error('Encryption failed');
    }
}
/**
 * Decrypt sensitive data
 * Takes base64-encoded string and returns original plaintext
 */
export function decrypt(encryptedData) {
    try {
        const masterKey = getEncryptionKey();
        // Decode base64 and extract components
        const combined = Buffer.from(encryptedData, 'base64');
        const salt = combined.subarray(0, SALT_LENGTH);
        const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const tag = combined.subarray(combined.length - TAG_LENGTH);
        const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH, combined.length - TAG_LENGTH);
        // Derive the same key using salt
        const key = deriveKey(masterKey, salt);
        // Create decipher and decrypt
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(encrypted.toString('base64'), 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        console.error('[Encryption] Failed to decrypt data:', error);
        throw new Error('Decryption failed');
    }
}
/**
 * Encrypt a JSON object
 */
export function encryptJSON(data) {
    return encrypt(JSON.stringify(data));
}
/**
 * Decrypt to a JSON object
 */
export function decryptJSON(encryptedData) {
    const decrypted = decrypt(encryptedData);
    return JSON.parse(decrypted);
}
/**
 * Hash sensitive data for comparison (one-way)
 * Useful for API keys, webhook tokens, etc.
 */
export function hash(data) {
    return crypto
        .createHash('sha256')
        .update(data)
        .digest('hex');
}
/**
 * Generate a secure random token
 */
export function generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}
