import 'dotenv/config';
import { decrypt } from './server/utils/crypto.js';

const encrypted = "86d5c57a16973f594a301f7d:ab31708fcdea3a5f26e059ec299d3845:f5d60e871c14b6";
console.log('Trying to decrypt with current key...');
const result = decrypt(encrypted);
console.log('Result:', result);
if (result === '[SECURE_DATA]') {
    console.log('❌ Decryption failed with current key.');
} else {
    console.log('✅ Decryption successful!');
}
