import { decrypt } from '../utils/crypto.js';

/**
 * Middleware that intercepts outgoing JSON responses and automatically decrypts any encrypted fields.
 * Maintains invisibility to the frontend while keeping data encrypted in the DB.
 * 
 * Optimized to skip fields that don't match the signature Format: iv(24hex):authTag(32hex):encryptedContent
 */
export function decryptResponseMiddleware(req, res, next) {
    const originalJson = res.json;

    res.json = function (data) {
        if (!data) return originalJson.call(this, data);
        
        // Deep clone to avoid mutating original source objects
        let processedData;
        try {
            const str = JSON.stringify(data);
            if (!str.includes(':')) {
                // Short circuit if no encrypted markers are present
                return originalJson.call(this, data);
            }
            processedData = JSON.parse(str);
        } catch (e) {
            processedData = data; 
        }
        
        processedData = recursiveDecrypt(processedData);
        return originalJson.call(this, processedData);
    };

    next();
}

/**
 * Recursively scans and decrypts any string that matches the encrypted pattern.
 */
function recursiveDecrypt(obj) {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
        const parts = obj.split(':');
        // Strict format check before calling decrypt (24 hex IV, 32 hex AUTH TAG)
        if (parts.length === 3 && parts[0].length === 24 && parts[1].length === 32) {
            return decrypt(obj);
        }
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(recursiveDecrypt);
    }

    if (typeof obj === 'object') {
        // Handle generic objects
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                obj[key] = recursiveDecrypt(obj[key]);
            }
        }
        return obj;
    }

    return obj;
}
