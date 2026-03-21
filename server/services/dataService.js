import { encrypt, generateBlindIndex } from '../utils/crypto.js';

/**
 * DataService centralizes the encryption logic for sensitive entities.
 * Ensures that whenever an employee is saved, sensitive fields are encrypted
 * and blind indexes are generated for performant, secure searching.
 */
export const DataService = {
    
    /**
     * Map of sensitive fields and whether they require a blind index for searching.
     */
    EMPLOYEE_SECURITY_MAP: {
        first_name: { encrypt: true, bindex: true },
        last_name: { encrypt: true, bindex: true },
        alias: { encrypt: true, bindex: false },
        email: { encrypt: true, bindex: true },
        username: { encrypt: true, bindex: true },
        phone: { encrypt: true, bindex: false },
        address: { encrypt: true, bindex: false }
    },

    /**
     * Prepares an employee object for database insertion or update.
     * Encrypts sensitive fields and populates blind index columns.
     */
    prepareEmployeeForSave(data) {
        const result = { ...data };
        
        for (const [field, config] of Object.entries(this.EMPLOYEE_SECURITY_MAP)) {
            const value = data[field];
            if (value !== undefined && value !== null && typeof value === 'string') {
                if (config.bindex) {
                    result[`${field}_bindex`] = generateBlindIndex(value);
                }
                if (config.encrypt) {
                    result[field] = encrypt(value);
                }
            }
        }
        
        return result;
    },

    /**
     * Used for building search queries. Converts a clear-text search term
     * into its Blind Index equivalent.
     */
    getBlindIndex(searchTerm) {
        return generateBlindIndex(searchTerm);
    }
};
