import { expect, test } from "@playwright/test";

test("renders the wiki UI and core interactions", async ({ page }) => {
  const searchIndexResponse = page.waitForResponse((response) => response.url().endsWith("/assets/search-index.json"));

  await page.goto("/");
  await searchIndexResponse;

  await expect(page.locator(".site-header .brand")).toBeVisible();
  await expect(page.locator(".site-nav").getByRole("link", { name: "Wiki", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Toggle theme" })).toBeVisible();

  const searchInput = page.getByLabel("Search");
  await searchInput.fill("codex");

  const searchResults = page.locator("#search-results");
  await expect(searchResults).toBeVisible();

  const codexHit = searchResults.getByRole("link", { name: /oh-my-codex \(OMX\)/ });
  await expect(codexHit).toBeVisible();
  await codexHit.click();

  await expect(page).toHaveURL(/\/wiki\/oh-my-codex\/$/);
  await expect(page.locator(".hero h1")).toHaveText("oh-my-codex (OMX)");

  const rootTheme = page.locator("html");
  await page.getByRole("button", { name: "Toggle theme" }).click();
  await expect(rootTheme).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(rootTheme).toHaveAttribute("data-theme", "dark");

  const backlinksPanel = page.locator(".rail-column section").filter({
    has: page.getByRole("heading", { name: "Backlinks", exact: true })
  });
  const wikiIndexBacklink = backlinksPanel.getByRole("link", { name: "Wiki Index", exact: true });
  await expect(wikiIndexBacklink).toBeVisible();
  await wikiIndexBacklink.click();

  await expect(page).toHaveURL(/\/wiki\/index\/$/);
  await expect(page.locator(".hero h1")).toHaveText("Wiki Index");
});
