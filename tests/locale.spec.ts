import { expect, test } from "@playwright/test";
import { preferredLocale } from "../lib/site";

test("known visitor country takes priority over browser language", () => {
  expect(preferredLocale("SE", "en-GB")).toBe("sv");
  expect(preferredLocale("NO", "sv-SE")).toBe("en");
  expect(preferredLocale("US", "sv-SE")).toBe("en");
  expect(preferredLocale("XX", "en;q=0.4,sv-SE;q=0.9")).toBe("sv");
  expect(preferredLocale(undefined, "sv;q=0,en;q=0.6")).toBe("en");
});

test("the unlocalized entry keeps the query and does not set cookies", async ({ request }) => {
  const response = await request.get("/?source=test", {
    maxRedirects: 0,
    headers: { "Accept-Language": "en-GB,sv;q=0.3" },
  });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe("/en?source=test");
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["set-cookie"]).toBeUndefined();
});

test("the project opens by keyboard and both detail pages have matching languages", async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/sv#work");
  const project = page.getByRole("link", { name: "3D-visningar för mäklare" });
  await project.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/sv\/3d-visningar$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("3D-visningar för mäklare");
  await expect(page.getByText("Mer information om appen kommer här.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Fråga om appen" })).toHaveAttribute("href", /^mailto:erik@karliq\.se\?/);

  await page.getByRole("link", { name: "English", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/3d-tours$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("3D tours for estate agents");

  await page.getByRole("link", { name: "Privacy and cookies" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy and cookies");
  await page.getByRole("link", { name: "Svenska", exact: true }).click();
  await expect(page).toHaveURL(/\/sv\/integritet$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "sv");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Integritet och kakor");
  expect(await context.cookies()).toEqual([]);
});
