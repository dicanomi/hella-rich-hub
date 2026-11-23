import { test, expect } from "@playwright/test";

for (const width of [414, 1440]) {
  test(`header logo stays still on entry and waves both directions on hover at ${width}px`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const logo = page.locator(".brand-link");
    expect(await logo.evaluate(e => e.getAnimations({ subtree: true }).length)).toBe(0);
    await logo.hover();
    await expect.poll(() => logo.evaluate(e => e.getAnimations({ subtree: true }).length)).toBe(9);
    const sample = (time: number) => logo.evaluate(async (element, time) => {
      const animations = element.getAnimations({ subtree: true });
      animations.forEach(animation => { animation.pause(); animation.currentTime = time; });
      await new Promise(requestAnimationFrame);
      const svg = [...element.querySelectorAll("svg")].find(svg => getComputedStyle(svg).display !== "none")!;
      const letters = [...svg.querySelectorAll("path")].sort((a, b) => a.getBBox().x - b.getBBox().x);
      return letters.map(path => { const transform = getComputedStyle(path).transform; return transform === "none" ? 0 : new DOMMatrix(transform).m42; });
    }, time);
    const outwardLeft = await sample(180);
    expect(outwardLeft[0]).toBeLessThan(-2);
    expect(Math.abs(outwardLeft[8])).toBeLessThan(0.1);
    const outwardRight = await sample(500);
    expect(outwardRight[8]).toBeLessThan(-2);
    const returningLeft = await sample(1100);
    expect(returningLeft[0]).toBeLessThan(-2);
    await logo.evaluate(e => e.getAnimations({ subtree: true }).forEach(animation => animation.finish()));
    await page.mouse.move(0, 0);
    await logo.hover();
    await expect.poll(() => logo.evaluate(e => e.getAnimations({ subtree: true }).filter(a => a.playState === "running").length)).toBe(9);
    await expect(logo).toHaveCSS("opacity", "1");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect.poll(() => logo.evaluate(e => e.getAnimations({ subtree: true }).length)).toBe(0);
    await logo.hover();
    expect(await logo.evaluate(e => e.getAnimations({ subtree: true }).length)).toBe(0);
  });
}

test("scroll tab and footer wordmark do not change opacity on hover", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  for (const selector of [".hero-scroll", ".footer-wordmark"]) {
    const link = page.locator(selector);
    await link.hover();
    await expect(link).toHaveCSS("opacity", "1");
    await expect(link).toHaveCSS("transition-duration", "0s");
  }
});
