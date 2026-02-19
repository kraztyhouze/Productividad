import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const LOG_FILE = 'app_exploration_report.txt';
const SCREENSHOT_DIR = 'screenshots';

function log(message) {
    console.log(message);
    fs.appendFileSync(LOG_FILE, message + '\n');
}

async function captureState(page, name) {
    const filename = `${name}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    log(`[SCREENSHOT] Saved to ${filepath}`);

    const url = page.url();
    log(`[PAGE] URL: ${url}`);

    const content = await page.evaluate(() => {
        // Simple simplified DOM dump
        const cleanText = document.body.innerText.replace(/\n\s*\n/g, '\n');
        return cleanText.substring(0, 5000); // First 5000 chars
    });
    log(`[CONTENT START]\n${content}\n[CONTENT END]\n--------------------------------------------------\n`);
}

(async () => {
    if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR);
    fs.writeFileSync(LOG_FILE, 'APP EXPLORATION REPORT\n======================\n');

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--window-size=1400,900']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    log("1. Navigating to Store Selection...");
    try {
        await page.goto('http://localhost:5174', { waitUntil: 'networkidle0', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));
        await captureState(page, '01_store_selection');

        // Click on "Sevilla" store
        const storeClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const specificBtn = buttons.find(b => b.innerText.includes('Sevilla'));
            if (specificBtn) {
                specificBtn.click();
                return true;
            }
            // Fallback to first big button
            const bigBtn = buttons.find(b => b.offsetHeight > 50);
            if (bigBtn) {
                bigBtn.click();
                return true;
            }
            return false;
        });

        if (storeClicked) {
            log("   Clicked a store button.");
            await new Promise(r => setTimeout(r, 2000));
            // Should be at login
            await captureState(page, '02_login_screen');

            // Login
            log("2. Attempting Login...");
            await page.type('input[type="text"]', 'Gerente'); // Case sensitive maybe?
            await page.type('input[type="password"]', '1234'); // Dummy password, usually auth is mocked or simple

            // Try to submit
            const submitted = await page.evaluate(() => {
                const btn = document.querySelector('button[type="submit"]');
                if (btn) { btn.click(); return true; }
                return false;
            });

            if (submitted) {
                log("   Submitted login form.");
                await new Promise(r => setTimeout(r, 3000));
                await captureState(page, '03_dashboard_initial');

                // Explore Tabs
                const sections = [
                    { path: '/productivity', name: '04_productivity' },
                    { path: '/team', name: '05_team' },
                    { path: '/reports', name: '06_reports' },
                    { path: '/market', name: '07_market' }
                ];

                for (const section of sections) {
                    log(`3. Navigating to ${section.path}...`);
                    try {
                        const targetUrl = `http://localhost:5174${section.path}`;
                        await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 5000 });
                        await new Promise(r => setTimeout(r, 2000));
                        await captureState(page, section.name);
                    } catch (err) {
                        log(`   Error navigating to ${section.path}: ${err.message}`);
                    }
                }
            } else {
                log("   Could not find submit button on login page.");
            }

        } else {
            log("   Could not find a store button to click.");
        }

    } catch (e) {
        log(`CRITICAL ERROR: ${e.message}`);
    }

    await browser.close();
    log("Done.");
})();
