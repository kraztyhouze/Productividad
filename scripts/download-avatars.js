import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PUBLIC = path.join(__dirname, '..', 'public', 'avatars');

const AVATARS = {
    dragonball: [
        { name: 'Goku', url: 'https://dragonball-api.com/characters/goku_normal.webp' },
        { name: 'Vegeta', url: 'https://dragonball-api.com/characters/vegeta_normal.webp' },
        { name: 'Gohan', url: 'https://dragonball-api.com/characters/gohan.webp' },
        { name: 'Piccolo', url: 'https://dragonball-api.com/characters/picolo_normal.webp' },
        { name: 'Freezer', url: 'https://dragonball-api.com/characters/Freezer.webp' },
        { name: 'Trunks', url: 'https://dragonball-api.com/characters/Trunks_Buu_Artwork.webp' },
        { name: 'Broly', url: 'https://dragonball-api.com/transformaciones/Broly_DBS_Base.webp' },
        { name: 'Beerus', url: 'https://dragonball-api.com/characters/Beerus_DBS_Broly_Artwork.webp' },
        { name: 'Cell', url: 'https://dragonball-api.com/characters/celula.webp' },
        { name: 'MajinBuu', url: 'https://dragonball-api.com/characters/BuuGordo_Universo7.webp' },
        { name: 'Gogeta', url: 'https://dragonball-api.com/transformaciones/gogeta.webp' },
        { name: 'Jiren', url: 'https://dragonball-api.com/characters/Jiren.webp' },
    ],
    marvel: [
        // Using Superhero API - doesn't block hotlinking
        { name: 'Iron Man', url: 'https://www.superherodb.com/pictures2/portraits/10/100/85.jpg' },
        { name: 'Spider-Man', url: 'https://www.superherodb.com/pictures2/portraits/10/100/133.jpg' },
        { name: 'Thor', url: 'https://www.superherodb.com/pictures2/portraits/10/100/140.jpg' },
        { name: 'Hulk', url: 'https://www.superherodb.com/pictures2/portraits/10/100/83.jpg' },
        { name: 'Wolverine', url: 'https://www.superherodb.com/pictures2/portraits/10/100/161.jpg' },
        { name: 'Deadpool', url: 'https://www.superherodb.com/pictures2/portraits/10/100/835.jpg' },
        { name: 'Captain America', url: 'https://www.superherodb.com/pictures2/portraits/10/100/274.jpg' },
        { name: 'Thanos', url: 'https://www.superherodb.com/pictures2/portraits/10/100/1305.jpg' },
        { name: 'Venom', url: 'https://www.superherodb.com/pictures2/portraits/10/100/22.jpg' },
        { name: 'Black Panther', url: 'https://www.superherodb.com/pictures2/portraits/10/100/247.jpg' },
        { name: 'Doctor Strange', url: 'https://www.superherodb.com/pictures2/portraits/10/100/55.jpg' },
        { name: 'Loki', url: 'https://www.superherodb.com/pictures2/portraits/10/100/928.jpg' },
    ],
};

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(dest);
        protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            // Follow redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                file.close();
                fs.unlinkSync(dest);
                return download(res.headers.location, dest).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                file.close();
                fs.unlinkSync(dest);
                return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            }
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }).on('error', (err) => {
            file.close();
            fs.unlinkSync(dest);
            reject(err);
        });
    });
}

async function main() {
    for (const [theme, avatars] of Object.entries(AVATARS)) {
        const dir = path.join(PUBLIC, theme);
        fs.mkdirSync(dir, { recursive: true });
        for (const avatar of avatars) {
            const ext = avatar.url.includes('.webp') ? '.webp' : '.jpg';
            const filename = avatar.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() + ext;
            const dest = path.join(dir, filename);
            if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
                console.log(`  SKIP ${theme}/${filename} (exists)`);
                continue;
            }
            try {
                await download(avatar.url, dest);
                const size = fs.statSync(dest).size;
                console.log(`  ✓ ${theme}/${filename} (${(size / 1024).toFixed(1)}KB)`);
            } catch (err) {
                console.log(`  ✗ ${theme}/${filename}: ${err.message}`);
            }
        }
    }
    console.log('\nDone! Now generating manifest...');

    // Generate manifest for the server
    const manifest = {};
    for (const [theme, avatars] of Object.entries(AVATARS)) {
        manifest[theme] = [];
        const dir = path.join(PUBLIC, theme);
        for (const avatar of avatars) {
            const ext = avatar.url.includes('.webp') ? '.webp' : '.jpg';
            const filename = avatar.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() + ext;
            const dest = path.join(dir, filename);
            if (fs.existsSync(dest) && fs.statSync(dest).size > 500) {
                manifest[theme].push({ name: avatar.name, file: `/avatars/${theme}/${filename}` });
            }
        }
    }
    fs.writeFileSync(path.join(PUBLIC, 'manifest.json'), JSON.stringify(manifest, null, 2));
    console.log('Manifest written to public/avatars/manifest.json');
}

main().catch(console.error);
