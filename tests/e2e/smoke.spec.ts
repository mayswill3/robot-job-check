import { expect, test } from "@playwright/test";

test("loads, searches for nurse and shows the verdict", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/robot/i);

  // Preloaded example is visible before any interaction.
  await expect(page.getByText("Your job:")).toContainText("Bank and post office clerks");

  const input = page.getByRole("combobox", { name: /what do you do/i });
  await input.click();
  await input.fill("nurse");
  const option = page.getByRole("option", { name: /Other registered nursing professionals/ });
  await expect(option).toBeVisible();
  await option.click();

  await expect(page.getByText("Your job:")).toContainText("Other registered nursing professionals");
  await expect(page.getByRole("heading", { level: 3, name: /Update your CV/ })).toBeVisible();
  await expect(page.getByRole("img", { name: /Exposure score 65 out of 100/ })).toBeVisible();
});

test("slang resolves and keyboard works", async ({ page }) => {
  await page.goto("/");
  const input = page.getByRole("combobox", { name: /what do you do/i });
  await input.fill("brickie");
  await expect(page.getByRole("option").first()).toContainText("Bricklayers");
  await input.press("Enter");
  await expect(page.getByRole("heading", { level: 3, name: /Safe as houses/ })).toBeVisible();
});

test("has no horizontal scroll at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
