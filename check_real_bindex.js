import { generateBlindIndex } from './server/utils/crypto.js';
import dotenv from 'dotenv';
dotenv.config();

const user = 'admin';
const bindex = generateBlindIndex(user);
console.log(`BIndex for '${user}' is: ${bindex}`);
