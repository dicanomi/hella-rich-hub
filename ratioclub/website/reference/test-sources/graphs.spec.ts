import { test, expect } from "@playwright/test";

for (const width of [414, 900, 1440]) {
  test(`graph motion moves the dot, pauses offscreen and preserves layout at ${width}px`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width, height: 1100 });
    await page.goto("/graph-review");
    await expect(page.locator(".solution-graph-motion")).toHaveCount(3);
    for (const graph of await page.locator(".solution-graph-motion").all()) {
      await graph.scrollIntoViewIfNeeded();
      await expect(graph).toHaveAttribute("data-active", "true");
      await expect(graph).toHaveAttribute("data-dot-state", /forward|backward/);
      const dot = graph.locator("circle");
      const position = await dot.evaluate(e => [e.getAttribute("cx"), e.getAttribute("cy")]);
      const stroke = await graph.locator(".solution-signal").evaluate(e => getComputedStyle(e).stroke);
      await expect.poll(() => graph.locator(".solution-signal").evaluate(e => getComputedStyle(e).stroke)).not.toBe(stroke);
      await expect.poll(() => dot.evaluate(e => [e.getAttribute("cx"), e.getAttribute("cy")])).not.toEqual(position);
      await graph.hover();
      await expect(graph).toHaveAttribute("data-hover", "true");
      await expect(graph.locator(".graph-hover-lift").first()).not.toHaveCSS("transform", "none");
      await page.mouse.move(0, 0);
      await expect(graph.locator(".graph-hover-lift").first()).toHaveCSS("transform", "none");
      await page.evaluate(() => scrollTo(0, 0));
      await page.setViewportSize({ width, height: 350 });
      await expect(graph).toHaveAttribute("data-active", "false");
      await page.setViewportSize({ width, height: 1100 });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const graph of await page.locator(".solution-graph-motion").all()) {
      await expect(graph).toHaveAttribute("data-active", "false");
      await expect(graph.locator(".solution-signal")).toHaveCSS("animation-name", "none");
      await expect(graph.locator(".solution-signal")).toHaveCSS("stroke", "rgb(78, 148, 167)");
    }
  });
}

test("dot and color reverse together and start another cycle", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/graph-review");
  const graph = page.locator('.solution-graph-motion[data-variant="gpu"]');
  await graph.scrollIntoViewIfNeeded();
  await expect(graph).toHaveAttribute("data-dot-state", "forward");
  await expect(graph).toHaveAttribute("data-dot-state", "backward");
  const dot = graph.locator("circle");
  const x = Number(await dot.getAttribute("cx"));
  await expect.poll(async () => Number(await dot.getAttribute("cx"))).toBeLessThan(x - 1);
  await expect(graph).toHaveAttribute("data-dot-state", "forward");
  const start = Number(await dot.getAttribute("cx"));
  await expect.poll(async () => Number(await dot.getAttribute("cx"))).toBeGreaterThan(start + 1);
});

test("Index loops have no SVG pause/play control and respect reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/");
  await page.locator("#core-solutions").scrollIntoViewIfNeeded();
  const graphs = page.locator("#core-solutions .solution-graph-motion");
  await expect(graphs).toHaveCount(3);
  await expect(graphs.first()).toHaveAttribute("data-active", "true");
  await expect(page.locator("#core-solutions button")).toHaveCount(0);
  await expect(page.locator(".media-toggle")).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(graphs).toHaveCount(0);
  await expect(page.locator("#core-solutions .svg-artwork img")).toHaveCount(3);
});
