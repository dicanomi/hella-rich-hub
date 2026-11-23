import { test, expect } from "@playwright/test";

for (const width of [414, 900, 1440]) {
  test(`true wireframe rotation changes geometry and stops at ${width}px`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width, height: 1100 });
    await page.goto("/wireframe-review");
    await expect(page.locator(".wireframe-object")).toHaveCount(4);
    for (const object of await page.locator(".wireframe-object").all()) {
      await object.scrollIntoViewIfNeeded();
      const path = object.locator("path").first();
      const original = await path.getAttribute("d");
      await object.getByRole("button").click();
      await expect(path).not.toHaveAttribute("d", original!);
      await expect(object).toHaveAttribute("data-animating", "false");
      const settled = await path.getAttribute("d");
      await page.waitForTimeout(150);
      expect(await path.getAttribute("d")).toBe(settled);
      await expect(object.locator("svg")).toHaveCSS("transform", "none");
    }
    await expect(page.locator("canvas")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const button of await page.getByRole("button").all()) await expect(button).toBeDisabled();
  });
}

test("hover rotation coasts to a stop and no tilt remains on Index", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/wireframe-review");
  const object = page.locator(".wireframe-object").first();
  const path = object.locator("path").first();
  const original = await path.getAttribute("d");
  await object.locator(".wireframe-hover-area").hover();
  await expect(path).not.toHaveAttribute("d", original!);
  await page.mouse.move(0, 0);
  const leaving = await path.getAttribute("d");
  await expect(path).not.toHaveAttribute("d", leaving!);
  await expect(object).toHaveAttribute("data-animating", "false");
  expect(await path.getAttribute("d")).not.toBe(original);
  const settled = await path.getAttribute("d");
  await page.waitForTimeout(150);
  expect(await path.getAttribute("d")).toBe(settled);
  await page.goto("/");
  await expect(page.locator(".feature-artwork-tilt")).toHaveCount(0);
});

test("all projected edges remain inside the SVG at every sampled angle", async () => {
  const { makeWireframe, fittedScale, makeProjector } = await import("../src/motion/wireframe/geometry");
  for (const shape of ["sphere", "horn", "cubes", "torus"] as const) {
    const lines = makeWireframe(shape);
    const scale = fittedScale(lines, shape);
    for (let step = 0; step <= 120; step++) {
      const project = makeProjector(shape, step * Math.PI / 12, scale);
      for (const line of lines) {
        const coordinates = project(line).path.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
        expect(Math.min(...coordinates)).toBeGreaterThanOrEqual(19.99);
        expect(Math.max(...coordinates)).toBeLessThanOrEqual(300.01);
      }
    }
  }
});

test("Index illustrations rotate and coast without moving card text", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/");
  const objects = page.locator(".feature-card .wireframe-object--illustration");
  await expect(objects).toHaveCount(4);
  await expect(objects.getByRole("button")).toHaveCount(0);
  for (const object of await objects.all()) {
    await object.scrollIntoViewIfNeeded();
    const card = object.locator("xpath=ancestor::article");
    const heading = await card.locator("h3").boundingBox();
    const path = object.locator("path").first();
    const original = await path.getAttribute("d");
    await object.locator(".wireframe-hover-area").hover();
    await expect(path).not.toHaveAttribute("d", original!);
    expect(await card.locator("h3").boundingBox()).toEqual(heading);
    await page.mouse.move(0, 0);
    await expect(object).toHaveAttribute("data-animating", "false");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await objects.first().locator(".wireframe-hover-area").hover();
  await expect(objects.first()).toHaveAttribute("data-animating", "false");
});

test("sphere and torus have balanced visible dimensions", async ({ page }) => {
  await page.goto("/wireframe-review");
  await expect(page.locator(".wireframe-object")).toHaveCount(4);
  const dimensions = await page.locator(".wireframe-object").evaluateAll(objects => objects.map(object => {
    const bounds = object.querySelector("svg")!.getBBox();
    return Math.max(bounds.width, bounds.height);
  }));
  expect(Math.max(...dimensions) / Math.min(...dimensions)).toBeLessThan(1.15);
});
