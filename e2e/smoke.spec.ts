import { expect, test, type Page } from '@playwright/test';

/**
 * Parcours de fumée sur viewport mobile : accueil, geste de fronde, frein,
 * pause, sauvegarde et reprise d'un run, mode test, assets et son.
 */

async function startNewRun(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => window.__fronde?.state().screen === 'title');
  await page.evaluate(() => window.__fronde!.press('new-run'));
  // Un run commence sur la carte : on entre dans le premier nœud atteignable, un combat.
  await page.waitForFunction(() => window.__fronde!.state().screen === 'map');
  await page.evaluate(() => window.__fronde!.press(`node:${window.__fronde!.state().reachable[0]}`));
  await page.waitForFunction(() => window.__fronde!.state().screen === 'room' && window.__fronde!.state().phase === 'aim');
}

async function dragThrow(page: Page, dx: number, dy: number): Promise<void> {
  const viewport = page.viewportSize()!;
  const x = viewport.width / 2;
  const y = viewport.height * 0.55;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx / 2, y + dy / 2, { steps: 5 });
  await page.mouse.move(x + dx, y + dy, { steps: 5 });
  await page.mouse.up();
}

test('accueil, geste de fronde, lancer et immobilisation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await startNewRun(page);
  const before = await page.evaluate(() => window.__fronde!.state());
  expect(before.throws).toBe(0);
  await dragThrow(page, 0, 130);
  await page.waitForFunction(() => window.__fronde!.state().throws === 1);
  await expect.poll(() => page.evaluate(() => window.__fronde!.state().phase), { timeout: 30_000 }).not.toBe('moving');
  const after = await page.evaluate(() => window.__fronde!.state());
  expect(after.inputs).toBe(1);
  expect(['aim', 'won', 'lost']).toContain(after.phase);
  // Une élimination fait rejouer dans le même tour ; sinon un tour s'est écoulé.
  if (after.phase === 'aim') {
    const replayed = after.enemies < before.enemies;
    expect(after.turn).toBe(replayed ? before.turn : before.turn + 1);
  }
  expect(errors).toEqual([]);
});

test('un geste qui revient dans la zone morte n\'a aucun effet', async ({ page }) => {
  await startNewRun(page);
  const viewport = page.viewportSize()!;
  const x = viewport.width / 2;
  const y = viewport.height * 0.55;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 100, { steps: 4 });
  await page.mouse.move(x + 5, y + 5, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  const state = await page.evaluate(() => window.__fronde!.state());
  expect(state.throws).toBe(0);
  expect(state.phase).toBe('aim');
});

test('le frein immobilise Dodu une seule fois par salle', async ({ page }) => {
  await startNewRun(page);
  expect(await page.evaluate(() => window.__fronde!.throw(0, -1, 1))).toBe(true);
  await page.waitForFunction(() => window.__fronde!.state().step > 5);
  expect(await page.evaluate(() => window.__fronde!.brake())).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__fronde!.state().phase), { timeout: 30_000 }).not.toBe('moving');
  const state = await page.evaluate(() => window.__fronde!.state());
  if (state.phase === 'aim') {
    expect(await page.evaluate(() => window.__fronde!.throw(0, -1, 0.5))).toBe(true);
    await page.waitForFunction(() => window.__fronde!.state().step > 10);
    expect(await page.evaluate(() => window.__fronde!.brake())).toBe(false);
  }
});

test('pause, reprise, sauvegarde et reprise après rechargement', async ({ page }) => {
  await startNewRun(page);
  expect(await page.evaluate(() => window.__fronde!.state().hasSave)).toBe(true);
  await page.evaluate(() => window.__fronde!.pause());
  expect(await page.evaluate(() => window.__fronde!.state().screen)).toBe('pause');
  await page.evaluate(() => window.__fronde!.press('resume'));
  expect(await page.evaluate(() => window.__fronde!.state().screen)).toBe('room');
  const room = await page.evaluate(() => window.__fronde!.state().room);
  // Rechargement : l'accueil propose la reprise, qui revient dans la même salle du même run.
  await page.reload();
  await page.waitForFunction(() => window.__fronde?.state().screen === 'title');
  expect(await page.evaluate(() => window.__fronde!.state().hasSave)).toBe(true);
  await page.evaluate(() => window.__fronde!.press('continue-run'));
  await page.waitForFunction(() => window.__fronde!.state().screen === 'room');
  expect(await page.evaluate(() => window.__fronde!.state().room)).toBe(room);
  expect(await page.evaluate(() => window.__fronde!.state().act)).toBe(1);
});

test('le mode test rend Dodu invincible et choisit la salle de départ', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__fronde?.state().screen === 'title');
  await page.evaluate(() => window.__fronde!.press('options'));
  await page.evaluate(() => window.__fronde!.press('opt-test'));
  await page.evaluate(() => window.__fronde!.press('opt-invincible'));
  // Six pas d'avance dans l'ordre des salles dessinées : salle-6, le boss. En mode test, le run entre directement en combat.
  for (let i = 0; i < 6; i++) await page.evaluate(() => window.__fronde!.press('opt-node'));
  await page.evaluate(() => window.__fronde!.press('back-title'));
  await page.evaluate(() => window.__fronde!.press('new-run'));
  await page.waitForFunction(() => window.__fronde!.state().screen === 'room');
  const state = await page.evaluate(() => window.__fronde!.state());
  expect(state.testMode).toBe(true);
  expect(state.room).toBe('salle-6');
  // Dodu reste dans le cône du boss sans bouger : il ne perd rien.
  await page.evaluate(() => window.__fronde!.throw(1, 0, 0.05));
  await expect.poll(() => page.evaluate(() => window.__fronde!.state().phase), { timeout: 30_000 }).not.toBe('moving');
  expect(await page.evaluate(() => window.__fronde!.state().hp)).toBe(3);
});

test('les assets se chargent et le son joue après le premier geste, quand ils existent', async ({ page }) => {
  await startNewRun(page);
  const assets = await page.evaluate(() => window.__fronde!.assets());
  await dragThrow(page, -20, 120);
  await page.waitForFunction(() => window.__fronde!.state().throws === 1);
  await expect.poll(() => page.evaluate(() => window.__fronde!.state().phase), { timeout: 30_000 }).not.toBe('moving');
  const audio = await page.evaluate(() => window.__fronde!.audio());
  expect(audio.unlocked).toBe(true);
  if (assets.loaded) {
    expect(assets.sprites).toBeGreaterThan(0);
    expect(audio.decoded).toBeGreaterThan(0);
    expect(audio.played).toBeGreaterThan(0);
    await expect.poll(() => page.evaluate(() => window.__fronde!.audio().musicPlaying), { timeout: 10_000 }).toBe(true);
  }
});
