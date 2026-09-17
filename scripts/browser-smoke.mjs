/** UI-only smoke tests. No injected game state, storage writes or simulation shortcuts. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium, firefox } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const browserName = process.env.SMOKE_BROWSER || process.argv[2] || 'chrome';
assert.ok(['chrome', 'firefox', 'msedge'].includes(browserName), 'Unknown browser');
const artifacts = path.join(root, 'test-results', browserName);
const origin = 'http://127.0.0.1:8000';
const startedAt = Date.now();
const issues = [];
const checkpoints = [];
const performanceSamples = [];
let server, browser, context, page, timeoutHandle;
let serverLog = '';
let failure;

function checkpoint(name) {
  checkpoints.push({ name, elapsedSeconds: (Date.now() - startedAt) / 1000 });
  console.log(`[${browserName}] ${name}`);
}

async function readyServer() {
  server = spawn(process.env.PYTHON || 'python3', ['-m', 'http.server', '8000', '--bind', '127.0.0.1'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let startupError;
  server.on('error', error => { startupError = error; });
  server.stdout.on('data', data => { serverLog += data.toString(); });
  server.stderr.on('data', data => { serverLog += data.toString(); });
  for (let attempt = 0; attempt < 80; attempt++) {
    if (startupError) throw startupError;
    if (server.exitCode !== null) throw new Error(`Static server stopped: ${serverLog}`);
    try {
      const response = await fetch(`${origin}/index.html`, { signal: AbortSignal.timeout(800) });
      if (response.ok) return;
    } catch { /* The newly spawned server needs a moment to bind its socket. */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Static server did not become ready.');
}

async function savedData() {
  // Read-only observation: all modifications are made through visible UI controls.
  return page.evaluate(() => JSON.parse(localStorage.getItem('minuit-musee-v1')));
}

async function screenshot(name) {
  await page.screenshot({ path: path.join(artifacts, `${name}.png`), fullPage: true });
}

async function clickCell(x, y) {
  const canvas = page.locator('#board');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  assert.ok(box && box.width > 0 && box.height > 0);
  await page.mouse.click(box.x + (x * 48 + 24) * box.width / 960,
    box.y + (y * 48 + 24) * box.height / 576);
}

async function firstMission({ pause = false } = {}) {
  await page.locator('#begin').click();
  await page.locator('#modal').waitFor({ state: 'hidden' });
  if (pause) {
    await page.waitForFunction(() => document.querySelector('#timer').textContent !== '00:00');
    await page.locator('#pause').click();
    await page.locator('#resume').waitFor({ state: 'visible' });
    const frozen = await page.locator('#timer').textContent();
    await page.waitForTimeout(1250);
    assert.equal(await page.locator('#timer').textContent(), frozen, 'Pause must freeze the displayed clock');
    await screenshot('02-pause');
    await page.locator('#resume').click();
    await page.waitForFunction(value => document.querySelector('#timer').textContent !== value, frozen);
    checkpoint('Pause and resume preserve/freeze the mission clock');
    const cadence = await page.evaluate(() => new Promise(resolve => {
      const intervals = [];
      let previous;
      function sample(now) {
        if (previous !== undefined) intervals.push(now - previous);
        previous = now;
        if (intervals.length < 60) requestAnimationFrame(sample);
        else {
          const sorted = [...intervals].sort((a, b) => a - b);
          const medianMs = (sorted[29] + sorted[30]) / 2;
          resolve({ frames: 60, medianMs, estimatedFps: 1000 / medianMs,
            minMs: sorted[0], maxMs: sorted[59] });
        }
      }
      requestAnimationFrame(sample);
    }));
    performanceSamples.push(cadence);
    console.log(`[${browserName}] RAF median ${cadence.medianMs.toFixed(2)} ms / ${cadence.estimatedFps.toFixed(1)} fps (informational)`);
  }
  // Genuine point-and-click navigation, waiting for rendered collection feedback.
  const works = [[3, 2], [10, 5], [16, 2]];
  for (let index = 0; index < works.length; index++) {
    await clickCell(...works[index]);
    await page.waitForFunction(count => document.querySelectorAll('#loot-list .collected').length === count,
      index + 1, { timeout: 25000 });
  }
  assert.match(await page.locator('#exit-status').textContent(), /SORTIE OUVERTE/);
  await clickCell(17, 9);
  await page.locator('#next').waitFor({ state: 'visible', timeout: 20000 });
  assert.match(await page.locator('#modal-content h2').textContent(), /galerie libérée/);
  assert.equal(await page.locator('#loot-list .collected').count(), 3);
}

async function smoke() {
  await fs.mkdir(artifacts, { recursive: true });
  await readyServer();
  browser = await (browserName === 'firefox' ? firefox : chromium).launch({
    headless: true,
    ...(browserName === 'firefox' ? {} : { channel: browserName }),
  });
  context = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'fr-FR' });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => issues.push(`pageerror: ${error.stack || error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') issues.push(`console: ${message.text()}`);
  });
  page.on('response', response => {
    if (response.status() >= 400) issues.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  page.on('requestfailed', request => {
    const reason = request.failure()?.errorText || '';
    // Navigations and paused media may cancel an otherwise valid in-flight request.
    if (!/ABORTED|NS_BINDING_ABORTED/i.test(reason)) issues.push(`request: ${request.url()} ${reason}`);
  });
  await page.goto(origin, { waitUntil: 'load', timeout: 30000 });
  await page.locator('#home').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#home-progress').textContent(), '00 / 09 GALERIES LIBÉRÉES');
  await screenshot('01-menu');
  await page.setViewportSize({ width: 390, height: 844 });
  await screenshot('01-menu-mobile');
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.locator('#credits-open').click();
  assert.match(await page.locator('#modal-content').textContent(), /CC BY 3\.0/);
  assert.match(await page.locator('#modal-content').textContent(), /Open Font License/);
  await page.locator('#modal [data-close]').click();
  await page.locator('#home-options').click();
  await page.locator('#motion').check();
  await page.locator('#music-volume').focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  const musicSetting = await page.locator('#music-volume').inputValue();
  await page.locator('#options-done').click();
  checkpoint('Menu, licensed credits and options work');

  await page.locator('#play').click();
  await firstMission({ pause: true });
  await screenshot('03-real-victory');
  const recorded = (await savedData()).results;
  assert.deepEqual(Object.keys(recorded), ['1']);
  assert.ok(recorded['1'].stars >= 1 && recorded['1'].time > 0);
  await page.locator('#result-missions').click();
  assert.equal(await page.locator('.mission-card:not([disabled])').count(), 2);
  checkpoint('First gallery won through actual clicks and second gallery unlocked');

  await page.reload({ waitUntil: 'load' });
  await page.locator('#home').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#home-progress').textContent(), '01 / 09 GALERIES LIBÉRÉES');
  assert.deepEqual((await savedData()).results, recorded);
  await page.locator('#home-options').click();
  assert.equal(await page.locator('#motion').isChecked(), true);
  assert.equal(await page.locator('#music-volume').inputValue(), musicSetting);
  await page.locator('#test-mode').check();
  await page.locator('#options-done').click();
  await page.locator('#test-badge').waitFor({ state: 'visible' });
  await page.locator('#missions-open').click();
  assert.equal(await page.locator('.mission-card').count(), 9);
  assert.equal(await page.locator('.mission-card:not([disabled])').count(), 9);
  checkpoint('Save/options survive reload; test mode unlocks all nine galleries');

  await page.locator('.mission-card[data-level="0"]').click();
  assert.match(await page.locator('#modal-content').textContent(), /AUCUN RECORD/);
  await firstMission();
  assert.deepEqual((await savedData()).results, recorded, 'A test-mode victory must not change any saved record');
  assert.match(await page.locator('#modal-content').textContent(), /résultat non enregistré/);
  await page.locator('#result-missions').click();
  checkpoint('Test-mode victory leaves every normal-mode record unchanged');

  await page.locator('.mission-card[data-level="8"]').click();
  await page.locator('#begin').click();
  assert.match(await page.locator('#mission-title').textContent(), /salle de l’aube/);
  const decoys = Number(await page.locator('#decoy-count').textContent());
  const emps = Number(await page.locator('#emp-count').textContent());
  await page.locator('#decoy').click();
  await page.waitForFunction(expected => Number(document.querySelector('#decoy-count').textContent) === expected, decoys - 1);
  await page.locator('#emp').click();
  await page.waitForFunction(expected => Number(document.querySelector('#emp-count').textContent) === expected, emps - 1);
  assert.match(await page.locator('#board-status').textContent(), /EMP/);
  await screenshot('04-final-gallery-gadgets');
  await page.locator('#pause').click();
  await page.locator('#resume').waitFor({ state: 'visible' });
  assert.deepEqual((await savedData()).results, recorded);
  checkpoint('Final-gallery decoy and EMP spend actual available charges');
  await page.reload({ waitUntil: 'load' });
  await page.locator('#home').waitFor({ state: 'visible' });
  await page.locator('#test-badge').waitFor({ state: 'visible' });
  assert.deepEqual((await savedData()).results, recorded);
  assert.equal(issues.length, 0, issues.join('\n'));
  checkpoint('No JavaScript errors, failed assets or HTTP errors');
}

try {
  await Promise.race([
    smoke(),
    new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error('Browser smoke exceeded its 170-second deadline.')), 170000);
    }),
  ]);
} catch (error) {
  failure = error;
  console.error(error.stack || error);
  if (page && !page.isClosed()) await screenshot('failure').catch(() => {});
  process.exitCode = 1;
} finally {
  clearTimeout(timeoutHandle);
  if (context) await context.tracing.stop({ path: path.join(artifacts, 'trace.zip') }).catch(() => {});
  if (browser) await browser.close().catch(() => {});
  if (server) server.kill('SIGTERM');
  await fs.mkdir(artifacts, { recursive: true });
  await fs.writeFile(path.join(artifacts, 'server.log'), serverLog);
  await fs.writeFile(path.join(artifacts, 'report.json'), JSON.stringify({
    browser: browserName,
    passed: !failure,
    elapsedSeconds: (Date.now() - startedAt) / 1000,
    checkpoints,
    performanceSamples,
    issues,
    failure: failure?.stack || null,
  }, null, 2) + '\n');
}
