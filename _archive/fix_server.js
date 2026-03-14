import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'server/index.js');
const content = fs.readFileSync(filePath, 'utf8');

// Find the end of valid code
const marker = "console.log(`Server running on port ${PORT}`);";
const index = content.lastIndexOf(marker);

if (index !== -1) {
    // Find the closing brace line after marker
    const closingBraceIndex = content.indexOf('});', index);
    if (closingBraceIndex !== -1) {
        // Cut everything after }); including newline
        const cleanContent = content.substring(0, closingBraceIndex + 3);
        fs.writeFileSync(filePath, cleanContent, 'utf8');
        console.log("Fixed server/index.js!");
    } else {
        console.log("Could not find closing brace.");
    }
} else {
    console.log("Could not find marker.");
}
