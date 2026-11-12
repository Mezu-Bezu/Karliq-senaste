import { expect, test } from "@playwright/test";
import { logoBricks } from "../components/logoBricks";

test("logo and full background build automatically without scrolling", async ({ page }) => {
  await page.goto('/sv#services');
  const scene = page.locator('[data-automation-scene]');
  await expect(scene).toHaveAttribute('data-build', 'playing');
  const position = await page.evaluate(() => scrollY);
  await expect(scene).toHaveAttribute('data-build', 'complete', { timeout: 10000 });
  expect(Math.abs(await page.evaluate(() => scrollY) - position)).toBeLessThan(3);
  await expect(scene.locator('[data-automation-brick]')).toHaveCount(logoBricks.length);
  await expect(scene.locator('[data-background-brick]')).toHaveCount(240);
  await expect.poll(() => scene.locator('[data-automation-brick], [data-background-brick]').evaluateAll(elements => elements.every(el => {
    const css = getComputedStyle(el);
    return Math.abs(new DOMMatrix(css.transform).m42) < .1 && Number(css.opacity) === 1;
  }))).toBe(true);
  expect(await scene.evaluate(el => el.clientHeight)).toBeLessThanOrEqual(await page.evaluate(() => Math.max(innerHeight, 752)));
  const cap = page.locator('[data-lego-transition]');
  await expect(cap.locator('[data-transition-brick]')).toHaveCount(64);
  await scene.evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * .55));
  await expect.poll(() => cap.locator('[data-transition-brick]').evaluateAll(elements => elements.every(el => Number(getComputedStyle(el).opacity) === 1))).toBe(true);
  await expect(scene).toHaveAttribute('data-build', 'complete');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '.tmp/lego-return-seam.png' });
});

for (const width of [320, 390, 768, 1440]) {
  test(`logo and background fit at ${width}px with reduced motion`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/sv#services');
    const scene = page.locator('[data-automation-scene]');
    await expect(scene).toHaveAttribute('data-build', 'complete');
    await expect(scene.getByRole('link', { name: 'Berätta vad som tar tid' })).toHaveAttribute('href', '#contact');
    for (const locator of [scene.getByRole('heading'), scene.locator('[data-brick-logo]')]) {
      const box = await locator.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if (width === 390 || width === 1440) await scene.screenshot({ path: `.tmp/lego-wall-${width}.png` });
  });
}
