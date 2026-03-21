const crypto = require('node:crypto');

const ENCRYPTION_KEY = "TikTak_Suite_v2.1_Shield_Proteccion_AES256";
const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
const target = "406ba8a2a8fc25c0e0ad1737a7f13fad";
const text = "admin";

const algs = ['sha256', 'sha1', 'md5', 'sha512'];
const methods = [
    (t, k) => crypto.createHmac('sha256', k).update(t).digest('hex').slice(0, 32),
    (t, k) => crypto.createHmac('sha256', ENCRYPTION_KEY).update(t).digest('hex').slice(0, 32),
    (t, k) => crypto.createHash('sha256').update(t + ENCRYPTION_KEY).digest('hex').slice(0, 32),
    (t, k) => crypto.createHash('sha256').update(ENCRYPTION_KEY + t).digest('hex').slice(0, 32),
    (t, k) => crypto.createHash('sha256').update(t).digest('hex').slice(0, 32),
    (t, k) => crypto.createHmac('sha256', 'TikTak-Secret-Key').update(t).digest('hex').slice(0, 32), // Legacy key?
];

methods.forEach((m, i) => {
    const res = m(text, key);
    if (res === target) console.log(`MATCH found in method ${i}: ${res}`);
    else console.log(`Method ${i} result: ${res}`);
});
