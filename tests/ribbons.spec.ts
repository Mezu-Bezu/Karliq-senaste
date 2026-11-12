import { expect, test } from "@playwright/test";

test("a single travelling stroke follows forward and reverse scrolling after the hero", async ({ page }) => {
  await page.goto("/sv");
  await expect(page.locator("#top [data-scroll-ribbons]")).toHaveCount(0);
  const ribbon = page.locator("[data-scroll-ribbons]");
  const path = ribbon.locator("path");
  await expect(path).toHaveCount(1);
  await page.locator("#approach").evaluate(section => window.scrollTo(0, section.getBoundingClientRect().top + scrollY - innerHeight * .6));
  await page.waitForTimeout(900);
  const read = () => path.evaluate(el => getComputedStyle(el).strokeDasharray);
  const before = await read();
  await page.evaluate(() => window.scrollBy(0, 400));
  await expect.poll(read).not.toBe(before);
  await page.waitForTimeout(1000);
  const forward = await read();
  await page.evaluate(() => window.scrollBy(0, -400));
  await expect.poll(read).not.toBe(forward);
});

test("reduced motion keeps the single stroke static", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/sv");
  const path = page.locator("[data-scroll-ribbons] path");
  await expect(path).toHaveAttribute("d", /^M/);
  const before = await path.getAttribute("style");
  await page.locator("#approach").scrollIntoViewIfNeeded();
  await expect(path).toHaveAttribute("style", before!);
});

for (const width of [390, 1280]) {
  test(`ribbon crosses the section boundary without clipping at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/sv');
    const approach = page.locator('#approach');
    const path = page.locator('[data-scroll-ribbons] path');
    await expect(path).toHaveAttribute('d', /^M/);
    const connection = await approach.evaluate(section => {
      const svg = section.parentElement!.querySelector('svg[data-scroll-ribbons]')!;
      const route = svg.querySelector('path')!;
      const end = route.getPointAtLength(route.getTotalLength());
      return { sectionHeight: section.clientHeight, svgHeight: svg.getBoundingClientRect().height,
        endpointY: end.y, overflow: getComputedStyle(section).overflow,
        sharedParent: section.parentElement === document.querySelector('#method')?.parentElement };
    });
    expect(connection.svgHeight).toBeGreaterThan(connection.sectionHeight + 300);
    expect(connection.endpointY).toBeGreaterThan(connection.sectionHeight);
    expect(connection.overflow).toBe('hidden');
    expect(connection.sharedParent).toBe(true);
    const deviceBounds = await page.locator('.manifesto-window').boundingBox();
    const sectionBounds = await approach.boundingBox();
    expect(deviceBounds!.y + deviceBounds!.height).toBeLessThanOrEqual(sectionBounds!.y + sectionBounds!.height);
    await expect(page.locator('.method-thread-entry')).toHaveCount(0);
    await approach.evaluate(section => window.scrollTo(0, section.getBoundingClientRect().bottom + scrollY - innerHeight * .55));
    await page.screenshot({ path: `.tmp/ribbon-connection-${width}.png` });
  });
}

test('the device stays still while the visible ribbon advances with scrolling', async ({ page }) => {
  await page.goto('/sv');
  const device = page.locator('.manifesto-window');
  const path = page.locator('[data-scroll-ribbons] path');
  await expect(path).toHaveAttribute('d', /^M/);
  await page.locator('#approach').evaluate(section => window.scrollTo(0, section.getBoundingClientRect().top + scrollY));
  await page.waitForTimeout(800);
  const before = await device.evaluate(el => getComputedStyle(el).transform);
  const initialLength = await path.evaluate(el => parseFloat(getComputedStyle(el).strokeDasharray));
  expect(initialLength).toBeLessThan(90);
  await page.screenshot({ path: '.tmp/ribbon-scroll-before.png' });
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(700);
  expect(await device.evaluate(el => getComputedStyle(el).transform)).toBe(before);
  const visibleLength = await path.evaluate(el => parseFloat(getComputedStyle(el).strokeDasharray));
  expect(visibleLength).toBeGreaterThan(initialLength + 3);
  await expect(path).toHaveCSS('opacity', '1');
  await page.screenshot({ path: '.tmp/ribbon-scroll-after.png' });
});

test('equal scroll distances reveal equal ribbon lengths through the loops', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/sv');
  await page.evaluate(() => document.fonts.ready);
  const path = page.locator('[data-scroll-ribbons] path');
  await expect(path).toHaveAttribute('d', /^M/);
  const range = await page.locator('#approach').evaluate(section => {
    const svg = section.parentElement!.querySelector('svg[data-scroll-ribbons]')!;
    return { start: section.getBoundingClientRect().top + scrollY - innerHeight,
      distance: svg.getBoundingClientRect().height + innerHeight * .3 };
  });
  const lengths: number[] = [];
  for (const progress of [.2, .35, .5, .65]) {
    await page.evaluate(y => window.scrollTo(0, y), range.start + range.distance * progress);
    await page.waitForTimeout(900);
    lengths.push(await path.evaluate(el => parseFloat(getComputedStyle(el).strokeDasharray)));
  }
  for (let index = 1; index < lengths.length; index++) {
    expect(lengths[index] - lengths[index - 1]).toBeCloseTo(15, 0);
  }
});
