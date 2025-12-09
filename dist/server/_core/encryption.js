/**
 * Encryption utilities for sensitive data
 *
 * Uses AES-256-GCM encryption for secure, authenticated encryption of
 * sensitive data like Google OAuth tokens stored in the database.
 */
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { ENV } from './env.js';
const scryptAsync = promisify(scrypt);
// Algorithm for encryption (GCM provides authentication)
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const ENCODING = 'base64';
/**
 * Get or generate the encryption key from environment
 * In production, this should be a proper secret management solution (AWS KMS, etc.)
 */
function getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY || ENV.cookieSecret;
    if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is not set. ' +
            'Generate one with: openssl rand -base64 32');
    }
    if (key.length < 32) {
        throw new Error(`ENCRYPTION_KEY must be at least 32 characters. Current length: ${key.length}`);
    }
    return key;
}
/**
 * Derive a key from the encryption key and salt using scrypt
 */
async function deriveKey(password, salt) {
    return (await scryptAsync(password, salt, KEY_LENGTH));
}
/**
 * Encrypt a string value
 *
 * Format of encrypted string:
 * [salt:iv:authTag:encryptedData] all in base64, separated by colons
 *
 * @param plaintext - The string to encrypt
 * @returns Encrypted string in format: salt:iv:authTag:encryptedData
 */
export async function encrypt(plaintext) {
    if (!plaintext) {
        return null;
    }
    try {
        const password = getEncryptionKey();
        // Generate random salt and IV
        const salt = randomBytes(SALT_LENGTH);
        const iv = randomBytes(IV_LENGTH);
        // Derive encryption key from password and salt
        const key = await deriveKey(password, salt);
        // Create cipher
        const cipher = createCipheriv(ALGORITHM, key, iv);
        // Encrypt the data
        let encrypted = cipher.update(plaintext, 'utf8', ENCODING);
        encrypted += cipher.final(ENCODING);
        // Get authentication tag
        const authTag = cipher.getAuthTag();
        // Combine all parts: salt:iv:authTag:encryptedData
        const result = [
            salt.toString(ENCODING),
            iv.toString(ENCODING),
            authTag.toString(ENCODING),
            encrypted
        ].join(':');
        return result;
    }
    catch (error) {
        console.error('[Encryption] Failed to encrypt data:', error);
        throw new Error('Encryption failed');
    }
}
/**
 * Decrypt a string value
 *
 * @param ciphertext - Encrypted string in format: salt:iv:authTag:encryptedData
 * @returns Decrypted plaintext string
 */
export async function decrypt(ciphertext) {
    if (!ciphertext) {
        return null;
    }
    try {
        const password = getEncryptionKey();
        // Split the encrypted string
        const parts = ciphertext.split(':');
        if (parts.length !== 4) {
            throw new Error('Invalid encrypted data format');
        }
        const [saltB64, ivB64, authTagB64, encrypted] = parts;
        // Convert from base64
        const salt = Buffer.from(saltB64, ENCODING);
        const iv = Buffer.from(ivB64, ENCODING);
        const authTag = Buffer.from(authTagB64, ENCODING);
        // Derive the same key
        const key = await deriveKey(password, salt);
        // Create decipher
        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        // Decrypt the data
        let decrypted = decipher.update(encrypted, ENCODING, 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        console.error('[Encryption] Failed to decrypt data:', error);
        throw new Error('Decryption failed - data may be corrupted');
    }
}
/**
 * Encrypt multiple fields in an object
 */
export async function encryptFields(obj, fields) {
    const result = { ...obj };
    for (const field of fields) {
        if (result[field]) {
            result[field] = await encrypt(String(result[field]));
        }
    }
    return result;
}
/**
 * Decrypt multiple fields in an object
 */
export async function decryptFields(obj, fields) {
    const result = { ...obj };
    for (const field of fields) {
        if (result[field]) {
            result[field] = await decrypt(String(result[field]));
        }
    }
    return result;
}
export default {
    encrypt,
    decrypt,
    encryptFields,
    decryptFields,
};
