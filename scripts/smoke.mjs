/**
 * Browser smoke test: loads the built app, exercises hold/reroll, plays a run to a
 * terminal state, and checks mobile layout. Assumes a server is already serving the
 * build (npm run build && npx vite preview --port 4173).
 *
 * Usage: node scripts/smoke.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4173';

const errors = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });

page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

await page.goto(BASE, { waitUntil: 'networkidle' });

const dice = await page.locator('button[aria-label^="Die showing"]').count();
console.log('dice on screen:', dice);
console.log('combo:', (await page.locator('text=would deal').textContent())?.trim());

// Hold the first die, reroll, and confirm it kept its value.
const firstDie = page.locator('button[aria-label^="Die showing"]').first();
const before = await firstDie.getAttribute('aria-label');
await firstDie.click();
console.log('after hold click:', await page.locator('button[aria-pressed="true"]').count(), 'held');
await page.getByRole('button', { name: /Reroll/ }).click();
await page.waitForTimeout(250);
const heldNow = await page.locator('button[aria-pressed="true"]').first().getAttribute('aria-label');
console.log('held die kept value:', before?.replace(', held','') === heldNow?.replace(', held',''), `(${before} -> ${heldNow})`);

await page.screenshot({ path: 'screenshots/01-combat.png' });

// Play until an upgrade choice appears.
let sawUpgrade = false;
for (let i = 0; i < 120; i++) {
  const picker = page.getByText(/choose an upgrade/i);
  if (await picker.count()) { sawUpgrade = true; break; }
  const attack = page.getByRole('button', { name: 'Attack' });
  if (!(await attack.isEnabled())) break;
  await attack.click();
  await page.waitForTimeout(60);
}
console.log('reached upgrade screen:', sawUpgrade);

if (sawUpgrade) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'screenshots/02-upgrade.png' });
  await page.getByTestId('upgrade-option').first().click();
  await page.waitForTimeout(300);
}

// Play the run out to a terminal state.
let ended = null;
for (let i = 0; i < 4000; i++) {
  if (await page.getByRole('heading', { name: /Victory|Run Over/ }).count()) {
    ended = await page.getByRole('heading', { name: /Victory|Run Over/ }).textContent();
    break;
  }
  const option = page.getByTestId('upgrade-option');
  if (await option.count()) {
    await option.first().click();
    await page.waitForTimeout(30);
    continue;
  }
  const attack = page.getByRole('button', { name: 'Attack' });
  if (await attack.count() && await attack.isEnabled()) {
    await attack.click();
    await page.waitForTimeout(30);
  } else break;
}
console.log('run ended with:', ended);
await page.waitForTimeout(400);
await page.screenshot({ path: 'screenshots/03-end.png' });

// Mobile viewport check.
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(BASE, { waitUntil: 'networkidle' });
const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
console.log('mobile horizontal overflow:', overflow);
await mobile.screenshot({ path: 'screenshots/04-mobile.png' });

console.log('console errors:', errors.length ? errors : 'none');
await browser.close();
