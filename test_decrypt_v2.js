import 'dotenv/config';
import { decrypt } from './server/utils/crypto.js';

const encrypted = "e521a57f6013feca1a1790da:ad40337ac88355e16c805a0f417e08e9:d03ac2dfecfa";
console.log('Trying to decrypt with current key...');
const result = decrypt(encrypted);
console.log('Result:', result);
if (result === '[SECURE_DATA]') {
    console.log('❌ Decryption failed with current key.');
} else {
    console.log(`✅ Decryption successful! Name: "${result}"`);
}
