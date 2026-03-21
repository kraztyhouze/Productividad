import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
    console.error('❌ CRITICAL ERROR: ENCRYPTION_KEY must be at least 32 characters long.');
    process.exit(1);
}

// Derive a consistent 32-byte key from the environment variable
const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
console.log(`[CRYPTO] Encryption Key Loaded. HashPrefix: ${crypto.createHash('sha256').update(key).digest('hex').slice(0, 8)}`);

/**
 * Encrypts clear text using AES-256-GCM.
 * Format: iv:authTag:encryptedContent
 */
export function encrypt(text) {
    if (text === null || text === undefined || typeof text !== 'string') return text;
    
    // Check if already encrypted to avoid double encryption
    if (text.split(':').length === 3 && text.length > 50) return text;

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string in the format iv:authTag:encryptedContent
 */
export function decrypt(data) {
    if (data === null || data === undefined || typeof data !== 'string') return data;
    
    const parts = data.split(':');
    if (parts.length !== 3) return data; // Not encrypted or wrong format

    try {
        const [ivHex, authTagHex, encrypted] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (e) {
        // Silent failure as per requirements, return safe placeholder
        console.error('[CRYPTO] Decryption failed:', e.message);
        return '[SECURE_DATA]';
    }
}

/**
 * Generates a Blind Index (HMAC) for searchable fields.
 * This is a deterministic hash that allows searching without decryption.
 */
export function generateBlindIndex(text) {
    if (text === null || text === undefined || typeof text !== 'string') return text;
    
    return crypto.createHmac('sha256', key)
        .update(text.toLowerCase().trim())
        .digest('hex')
        .slice(0, 32); // Truncated for efficiency but remains unique
}
