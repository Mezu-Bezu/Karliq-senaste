import { expect, test, type Page } from "@playwright/test";

const transition = (page: Page) => page.locator("[data-route-transition]");

async function expectTransitionSettled(page: Page) {
  await expect(transition(page)).toHaveAttribute("data-phase", "hidden");
}

test("route mask stays hidden on initial load without overflow or hydration errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  await expectTransitionSettled(page);

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  expect(errors).toEqual([]);
});

test("same-page hashes bypass the route mask", async ({ page }) => {
  await page.goto("/");
  await expectTransitionSettled(page);

  await page.locator(".site-header").getByRole("link", { name: "Process" }).click();
  await expect(page).toHaveURL(/#method$/);
  await expectTransitionSettled(page);
});

test("external, utility, modified, target and download clicks bypass the mask", async ({ page }) => {
  await page.goto("/");
  await expectTransitionSettled(page);

  await page.evaluate(() => {
    const fixtures = [
      { href: "https://example.com", target: "" },
      { href: "mailto:test@example.com", target: "" },
      { href: "tel:+46700000000", target: "" },
    ];

    for (const fixture of fixtures) {
      const link = document.createElement("a");
      link.href = fixture.href;
      if (fixture.target) link.target = fixture.target;
      link.addEventListener("click", (event) => event.preventDefault());
      document.body.append(link);
      link.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
        }),
      );
      link.remove();
    }
  });

  await expectTransitionSettled(page);
  await expect(page).toHaveURL(/\/$/);
});
