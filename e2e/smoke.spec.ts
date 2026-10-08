import { expect, test } from '@playwright/test';

/**
 * Parcours minimal de la phase 1 : la page charge sans erreur, le geste de
 * fronde lance le héros, le héros s'arrête de lui-même.
 */
test('charge, vise, lance et s\'immobilise sur un viewport mobile', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForFunction(() => window.__fronde?.state().phase === 'idle');

  const before = await page.evaluate(() => window.__fronde!.state());
  expect(before.throws).toBe(0);

  // Appui au centre, glissement vers le bas : le héros part vers le haut.
  const viewport = page.viewportSize()!;
  const x = viewport.width / 2;
  const y = viewport.height * 0.55;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 50, { steps: 5 });
  await page.mouse.move(x, y + 130, { steps: 5 });
  await page.mouse.up();

  await page.waitForFunction(() => window.__fronde!.state().throws === 1);
  await expect
    .poll(() => page.evaluate(() => window.__fronde!.state().phase), { timeout: 30_000 })
    .toBe('idle');

  const after = await page.evaluate(() => window.__fronde!.state());
  expect(after.hero.y).toBeLessThan(before.hero.y);
  expect(after.inputs).toBe(1);
  expect(errors).toEqual([]);
});

test('un geste qui revient dans la zone morte n\'a aucun effet', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__fronde?.state().phase === 'idle');
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
  expect(state.phase).toBe('idle');
});
