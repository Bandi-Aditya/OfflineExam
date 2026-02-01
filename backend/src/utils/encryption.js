import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'ABCDEF1234567890ABCDEF1234567890';

/**
 * Encrypt data using AES-256
 * @param {any} data - Data to encrypt
 * @returns {string} Encrypted string
 */
export const encrypt = (data) => {
    try {
        const dataString = typeof data === 'string' ? data : JSON.stringify(data);
        const encrypted = CryptoJS.AES.encrypt(dataString, ENCRYPTION_KEY).toString();
        return encrypted;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
};

/**
 * Decrypt AES-256 encrypted data
 * @param {string} encryptedData - Encrypted string
 * @param {boolean} parseJSON - Whether to parse result as JSON
 * @returns {any} Decrypted data
 */
export const decrypt = (encryptedData, parseJSON = true) => {
    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
        const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

        if (!decryptedString) {
            throw new Error('Decryption failed - invalid key or corrupted data');
        }

        return parseJSON ? JSON.parse(decryptedString) : decryptedString;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
};

/**
 * Generate a random session token
 * @returns {string} Random token
 */
export const generateSessionToken = () => {
    return CryptoJS.lib.WordArray.random(32).toString();
};

/**
 * Hash data using SHA-256
 * @param {string} data - Data to hash
 * @returns {string} Hashed string
 */
export const hash = (data) => {
    return CryptoJS.SHA256(data).toString();
};

/**
 * Verify hash
 * @param {string} data - Original data
 * @param {string} hashedData - Hash to compare
 * @returns {boolean} True if match
 */
export const verifyHash = (data, hashedData) => {
    return hash(data) === hashedData;
};
