import { expect, test } from "@playwright/test";

test("loads, searches for nurse and shows the verdict", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/robot/i);

  // Preloaded example is labelled as an example before any interaction.
  await expect(page.getByText("Example", { exact: true })).toBeVisible();
  await expect(page.getByText("Type your own job above")).toBeVisible();

  const input = page.getByRole("combobox", { name: /what do you do/i });
  await input.click();
  await input.fill("nurse");
  const option = page.getByRole("option", { name: /Other registered nursing professionals/ });
  await expect(option).toBeVisible();
  await option.click();

  // The reader's own word stays on the card, with the ONS title alongside.
  await expect(page.getByText("Your job:")).toContainText("Nurse");
  await expect(page.getByText("ONS: Other registered nursing professionals")).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: /Update your CV/ })).toBeVisible();
  await expect(page.getByRole("img", { name: /Exposure score 65 out of 100/ })).toBeVisible();
  // The job lands in the URL so the result can be shared.
  await expect(page).toHaveURL(/job=2237/);
  // And the card is on screen after the pick.
  const card = page.locator("article").first();
  await expect(card).toBeInViewport();
});

test("slang resolves and keyboard works", async ({ page }) => {
  await page.goto("/");
  const input = page.getByRole("combobox", { name: /what do you do/i });
  await input.fill("brickie");
  await expect(page.getByRole("option").first()).toContainText("Bricklayers");
  await input.press("Enter");
  await expect(page.getByRole("heading", { level: 3, name: /Safe as houses/ })).toBeVisible();
});

test("a shared link opens on that job", async ({ page }) => {
  await page.goto("/?job=5313");
  await expect(page.getByText("Your job:")).toContainText("Bricklayers");
  await expect(page.getByRole("heading", { level: 3, name: /Safe as houses/ })).toBeVisible();
});

test("tapping a dot shows the job without leaving the chart", async ({ page }) => {
  await page.goto("/");
  await page.locator("#everyone").scrollIntoViewIfNeeded();
  const svg = page.locator("#everyone svg");
  await expect(svg.locator("circle").first()).toBeVisible();
  const y = await page.evaluate(() => window.scrollY);
  const box = (await svg.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.85, box.y + box.height / 2);
  await expect(page.locator("#everyone [aria-live]")).toContainText(/\/100/);
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - y)).toBeLessThan(5);
  await page.getByRole("button", { name: "Make this my job" }).click();
  await expect(page.locator("#checker")).toBeInViewport();
});

test("has no horizontal scroll at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
