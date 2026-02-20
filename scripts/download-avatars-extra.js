import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '..', 'public', 'avatars');

// Disney characters from the Disney API (images hosted on Fandom, we download locally)
const DISNEY_CHARS = [
    { name: 'Mickey Mouse', id: 4702 },
    { name: 'Simba', id: 6548 },
    { name: 'Stitch', id: 6688 },
    { name: 'Elsa', id: 2370 },
    { name: 'Buzz Lightyear', id: 1152 },
    { name: 'Genie', id: 3063 },
    { name: 'Woody', id: 7623 },
    { name: 'Baymax', id: 651 },
    { name: 'Moana', id: 4769 },
    { name: 'Maui', id: 4633 },
    { name: 'Rapunzel', id: 6073 },
    { name: 'Jack Sparrow', id: 3718 },
];

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return download(res.headers.location, dest).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => { file.close(resolve); });
        });
        req.on('error', reject);
        req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

async function fetchDisneyChar(id) {
    return new Promise((resolve, reject) => {
        https.get(`https://api.disneyapi.dev/character/${id}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
        }).on('error', reject);
    });
}

// Generate themed SVGs for Music
function musicSVG(name, emoji, color1, color2) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${color1}"/><stop offset="100%" style="stop-color:${color2}"/></linearGradient></defs>
  <rect width="200" height="200" rx="30" fill="url(#g)"/>
  <text x="100" y="115" text-anchor="middle" font-size="90">${emoji}</text>
  <text x="100" y="175" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="16" fill="white" opacity="0.9">${name}</text>
</svg>`;
}

// Generate themed SVGs for Football
function futbolSVG(name, emoji, color1, color2) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${color1}"/><stop offset="100%" style="stop-color:${color2}"/></linearGradient></defs>
  <rect width="200" height="200" rx="30" fill="url(#g)"/>
  <text x="100" y="115" text-anchor="middle" font-size="90">${emoji}</text>
  <text x="100" y="175" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="14" fill="white" opacity="0.9">${name}</text>
</svg>`;
}

async function main() {
    // --- DISNEY ---
    const disneyDir = path.join(PUBLIC, 'disney');
    fs.mkdirSync(disneyDir, { recursive: true });
    const disneyManifest = [];
    for (const char of DISNEY_CHARS) {
        const filename = char.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() + '.png';
        const dest = path.join(disneyDir, filename);
        if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
            console.log(`  SKIP disney/${filename}`);
            disneyManifest.push({ name: char.name, file: `/avatars/disney/${filename}` });
            continue;
        }
        try {
            const data = await fetchDisneyChar(char.id);
            const imgUrl = data.data ? data.data.imageUrl : data.imageUrl;
            if (!imgUrl) throw new Error('No imageUrl');
            await download(imgUrl, dest);
            console.log(`  ✓ disney/${filename} (${(fs.statSync(dest).size / 1024).toFixed(1)}KB)`);
            disneyManifest.push({ name: char.name, file: `/avatars/disney/${filename}` });
        } catch (err) {
            console.log(`  ✗ disney/${filename}: ${err.message}`);
        }
    }

    // --- MUSIC ---
    const musicDir = path.join(PUBLIC, 'musica');
    fs.mkdirSync(musicDir, { recursive: true });
    const musicAvatars = [
        { name: 'Guitarra', emoji: '🎸', c1: '#7c3aed', c2: '#a855f7' },
        { name: 'Piano', emoji: '🎹', c1: '#1e293b', c2: '#334155' },
        { name: 'Micrófono', emoji: '🎤', c1: '#f59e0b', c2: '#d97706' },
        { name: 'Batería', emoji: '🥁', c1: '#dc2626', c2: '#991b1b' },
        { name: 'Saxofón', emoji: '🎷', c1: '#0891b2', c2: '#155e75' },
        { name: 'Violín', emoji: '🎻', c1: '#92400e', c2: '#78350f' },
        { name: 'DJ', emoji: '🎧', c1: '#2563eb', c2: '#1d4ed8' },
        { name: 'Trompeta', emoji: '🎺', c1: '#ea580c', c2: '#c2410c' },
        { name: 'Notas', emoji: '🎵', c1: '#db2777', c2: '#9d174d' },
        { name: 'Rockstar', emoji: '🤘', c1: '#374151', c2: '#111827' },
        { name: 'Cantante', emoji: '🎶', c1: '#059669', c2: '#047857' },
        { name: 'Compositor', emoji: '🎼', c1: '#4338ca', c2: '#3730a3' },
    ];
    const musicManifest = [];
    for (const a of musicAvatars) {
        const filename = a.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() + '.svg';
        const dest = path.join(musicDir, filename);
        fs.writeFileSync(dest, musicSVG(a.name, a.emoji, a.c1, a.c2));
        musicManifest.push({ name: a.name, file: `/avatars/musica/${filename}` });
        console.log(`  ✓ musica/${filename}`);
    }

    // --- FOOTBALL ---
    const futbolDir = path.join(PUBLIC, 'futbol');
    fs.mkdirSync(futbolDir, { recursive: true });
    const futbolAvatars = [
        { name: 'Balón', emoji: '⚽', c1: '#16a34a', c2: '#15803d' },
        { name: 'Portero', emoji: '🧤', c1: '#0284c7', c2: '#0369a1' },
        { name: 'Bota de Oro', emoji: '👟', c1: '#f59e0b', c2: '#d97706' },
        { name: 'Trofeo', emoji: '🏆', c1: '#ca8a04', c2: '#a16207' },
        { name: 'Camiseta 10', emoji: '👕', c1: '#dc2626', c2: '#b91c1c' },
        { name: 'Estadio', emoji: '🏟️', c1: '#059669', c2: '#047857' },
        { name: 'Banderín', emoji: '🚩', c1: '#7c3aed', c2: '#6d28d9' },
        { name: 'Silbato', emoji: '📣', c1: '#eab308', c2: '#ca8a04' },
        { name: 'Medalla', emoji: '🥇', c1: '#d97706', c2: '#92400e' },
        { name: 'Gol', emoji: '🥅', c1: '#0f766e', c2: '#115e59' },
        { name: 'Tarjeta Roja', emoji: '🟥', c1: '#991b1b', c2: '#7f1d1d' },
        { name: 'Campeón', emoji: '🏅', c1: '#1d4ed8', c2: '#1e40af' },
    ];
    const futbolManifest = [];
    for (const a of futbolAvatars) {
        const filename = a.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() + '.svg';
        const dest = path.join(futbolDir, filename);
        fs.writeFileSync(dest, futbolSVG(a.name, a.emoji, a.c1, a.c2));
        futbolManifest.push({ name: a.name, file: `/avatars/futbol/${filename}` });
        console.log(`  ✓ futbol/${filename}`);
    }

    // Update manifest
    const existingManifest = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'manifest.json'), 'utf8'));
    existingManifest.disney = disneyManifest;
    existingManifest.musica = musicManifest;
    existingManifest.futbol = futbolManifest;
    fs.writeFileSync(path.join(PUBLIC, 'manifest.json'), JSON.stringify(existingManifest, null, 2));
    console.log('\nManifest updated!');
}

main().catch(console.error);
