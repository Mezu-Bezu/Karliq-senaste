import { expect, test, type Locator, type Page } from "@playwright/test";

async function tabUntilFocused(page: Page, target: Locator, maxTabs: number) {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }

  throw new Error(`Tab did not reach ${await target.getAttribute("aria-label") ?? await target.textContent()}`);
}

async function expectFocusedRevealToBeComplete(target: Locator) {
  await expect(target).toBeFocused();
  await expect(target).toBeInViewport();

  const revealState = await target.evaluate((element) => {
    const reveal = element.closest<HTMLElement>("[data-reveal], [data-proof-reveal]");
    if (!reveal) return null;
    const styles = window.getComputedStyle(reveal);
    return {
      opacity: Number(styles.opacity),
      visibility: styles.visibility,
      clipPath: styles.clipPath,
    };
  });

  expect(revealState).not.toBeNull();
  expect(revealState?.visibility).toBe("visible");
  expect(revealState?.opacity).toBeGreaterThan(0.99);
  expect(revealState?.clipPath === "none" || revealState?.clipPath.includes("0px")).toBe(true);
}

const viewports = [
  { name: "small phone", width: 320, height: 700 },
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1280, height: 720 },
  { name: "desktop", width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test(`home renders without overflow on ${viewport.name}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Form som rör sig.");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.locator("#contact")).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
}

test("mobile menu traps focus and closes with Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Öppna meny" });
  await toggle.click();
  const mobileNavigation = page.getByRole("navigation", { name: "Mobil navigering" });
  await expect(mobileNavigation).toBeVisible();
  await expect(mobileNavigation.getByRole("link", { name: /Process/ })).toBeFocused();
  await expect(mobileNavigation.getByRole("link", { name: /Instagram/ })).toBeVisible();
  const menuBox = await mobileNavigation.boundingBox();
  const instagramBox = await mobileNavigation.getByRole("link", { name: /Instagram/ }).boundingBox();
  expect(menuBox?.height).toBeGreaterThan(800);
  expect((instagramBox?.y ?? 900) + (instagramBox?.height ?? 0)).toBeLessThanOrEqual(844);
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("mobile menu navigation moves focus to the cross-route destination", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: "Öppna meny" }).click();
  const mobileNavigation = page.getByRole("navigation", { name: "Mobil navigering" });
  await mobileNavigation.getByRole("link", { name: /Process/ }).click();

  await expect(page).toHaveURL(/\/#method$/);
  await expect(page.locator("#method")).toBeFocused();
  await expect(page.locator(".menu-toggle")).toHaveAttribute("aria-expanded", "false");
});

test("reduced motion uses the static hero and readable stacked scenes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".signal-loom-canvas")).toHaveCount(0);
  await expect(page.locator(".static-loom")).toBeVisible();
  await expect(page.locator(".static-word")).toContainText("KARLIQ");
  await expect(page.getByRole("heading", { name: "Från skiss till publicerad sida." })).toBeVisible();
});

test("hero fallback remains tactile when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(
      this: HTMLCanvasElement,
      contextId: string,
      ...args: unknown[]
    ) {
      if (contextId === "webgl" || contextId === "webgl2") return null;
      return Reflect.apply(originalGetContext, this, [contextId, ...args]);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");

  const world = page.locator(".hero-world");
  const firstJoint = page.locator(".static-joint").first();
  await expect(world).toHaveAttribute("data-visual-mode", "fallback");
  await expect(page.locator(".signal-loom-canvas")).toHaveCount(0);

  const initialTransform = await firstJoint.evaluate((element) => getComputedStyle(element).transform);
  await page.mouse.move(1_080, 280);
  await expect(world).toHaveAttribute("data-fallback-reacting", "");
  await expect.poll(
    () => firstJoint.evaluate((element) => getComputedStyle(element).transform),
  ).not.toBe(initialTransform);

  await page.mouse.click(1_050, 460);
  await expect(world).toHaveAttribute("data-fallback-pulse", "");
});

test("the motion controller follows live reduced-motion changes", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(page.locator("html")).not.toHaveClass(/\blenis\b/);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("html")).toHaveAttribute("data-motion", "full");

  if (await page.evaluate(() => !window.matchMedia("(pointer: coarse)").matches)) {
    await expect(page.locator("html")).toHaveClass(/\blenis\b/);
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(page.locator("html")).not.toHaveClass(/\blenis\b/);
  await expect(page.locator("[data-reveal]").first()).toHaveCSS("visibility", "visible");
  expect(pageErrors).toEqual([]);
});

test("services heading settles promptly after a fast jump", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const heading = page.locator(".agency-services-head");
  await heading.scrollIntoViewIfNeeded();

  await expect.poll(
    () => heading.evaluate((element) => {
      const styles = getComputedStyle(element);
      return Number(styles.opacity) > 0.99
        && (styles.clipPath === "none" || styles.clipPath.includes("0px"));
    }),
    { timeout: 1_100 },
  ).toBe(true);
});

test("hash scrolling tolerates malformed encoding and yields to user scrolling", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });

  await page.goto("/#%");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(pageErrors).toEqual([]);

  await page.goto("/#services");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  await page.waitForTimeout(180);
  const scrollPositionBeforeInput = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 320);
  await expect.poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThanOrEqual(scrollPositionBeforeInput + 300);
  const userScrollPosition = await page.evaluate(() => window.scrollY);

  await page.waitForTimeout(950);
  const settledScrollPosition = await page.evaluate(() => window.scrollY);
  expect(Math.abs(settledScrollPosition - userScrollPosition)).toBeLessThanOrEqual(2);
});

test("contact area exposes direct contact and social links", async ({ page }) => {
  await page.goto("/#contact");
  await expect(page.getByRole("heading", { name: /Låt oss bygga/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Starta ett projekt/ })).toHaveAttribute(
    "href",
    "mailto:erikkarlsson09@hotmail.com",
  );
  await expect(page.getByRole("link", { name: /Erik Karlsson/ })).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/erik-karlsson-b41329424/",
  );
  await expect(page.getByRole("link", { name: /@karliq.se/ })).toHaveAttribute(
    "href",
    "https://www.instagram.com/karliq.se/",
  );
});

test("public pages contain no pricing or budget prompts", async ({ page }) => {
  for (const path of ["/"]) {
    await page.goto(path);
    await expect(page.locator("body")).not.toContainText(/\b\d[\d\s]*\s*kr\b/i);
    await expect(page.locator("body")).not.toContainText(/Budgetsignal/i);
  }
});

test("micro interactions respond to pointer, keyboard and live reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");

  const primaryCta = page.getByRole("link", { name: /Utforska tjänster/ });
  await primaryCta.hover({ position: { x: 24, y: 24 } });
  await expect(primaryCta).toHaveAttribute("data-micro-active", "pointer");
  const pointerPosition = await primaryCta.evaluate((element) =>
    element.style.getPropertyValue("--micro-x"),
  );
  expect(pointerPosition).not.toBe("");
  expect(pointerPosition).not.toBe("50%");

  await page.mouse.down();
  await expect(primaryCta).toHaveAttribute("data-micro-pressed", "");
  await page.mouse.up();
  await expect(primaryCta).not.toHaveAttribute("data-micro-pressed", { timeout: 1_000 });

  const secondaryCta = page.getByRole("link", { name: /Starta projekt/ }).first();
  await secondaryCta.focus();
  await expect(secondaryCta).toHaveAttribute("data-micro-active", "keyboard");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(secondaryCta).not.toHaveAttribute("data-micro-active");
  await primaryCta.hover({ position: { x: 30, y: 20 } });
  await expect(primaryCta).not.toHaveAttribute("data-micro-active");
});

test("cross-route header links land on their home sections", async ({ page }) => {
  test.setTimeout(120_000);
  const targets = [
    { name: "Process", id: "method", expectedTop: 80 },
    { name: "Tjänster", id: "services", expectedTop: 1 },
    { name: "Studio", id: "founder", expectedTop: 1 },
    { name: "Starta projekt", id: "contact", expectedTop: 1 },
  ];

  for (const target of targets) {
    await page.goto("/");
    const link = page.locator(".site-header").getByRole("link", { name: target.name, exact: true });
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/#${target.id}$`));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
    await expect.poll(
      () => page.locator(`#${target.id}`).evaluate(
        (element, expectedTop) => Math.abs(element.getBoundingClientRect().top - expectedTop),
        target.expectedTop,
      ),
      { timeout: 5_000 },
    ).toBeLessThanOrEqual(3);
  }
});

test("closing particle field remains directly interactive", async ({ page }) => {
  await page.goto("/#contact");
  const signalField = page.locator(".closing-swarm-field");
  await signalField.scrollIntoViewIfNeeded();
  await signalField.click({ position: { x: 120, y: 280 } });
  await expect(signalField).toContainText("Våg 1 skapad.");
});

test("skip link moves actual focus to the home main content", async ({ page }) => {
  await page.goto("/");

  const skipLink = page.getByRole("link", { name: /Hoppa till innehållet/ });
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.locator("main#main-content")).toBeFocused();
});

test("keyboard reaches home reveals and completes them without manual scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");

  const hiddenFocusableReveals = await page.locator("[data-reveal]").evaluateAll((elements) =>
    elements
      .filter((element) => element.querySelector("a[href], button:not([disabled]), [tabindex='0']"))
      .filter((element) => window.getComputedStyle(element).visibility === "hidden")
      .map((element) => element.className),
  );
  expect(hiddenFocusableReveals).toEqual([]);

  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main-content")).toBeFocused();

  const processButton = page.getByRole("button", { name: /Riktning/ });
  await tabUntilFocused(page, processButton, 6);
  await expectFocusedRevealToBeComplete(processButton);

  const founderCta = page.getByRole("link", { name: /Prata projekt/ });
  await tabUntilFocused(page, founderCta, 5);
  await expectFocusedRevealToBeComplete(founderCta);

  const closingCta = page.locator("#contact .closing-mail");
  await tabUntilFocused(page, closingCta, 4);
  await expectFocusedRevealToBeComplete(closingCta);
});
