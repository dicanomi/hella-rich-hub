import { test, expect } from "@playwright/test";

for (const width of [414, 900, 1440]) {
  test(`motion comparison preserves geometry and native scrolling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/motion-review");
    const artwork = page.locator(".advantage-motion");
    await expect(artwork.locator("svg")).toHaveCount(1);
    await expect(artwork.locator("path")).toHaveCount(149);
    await page.getByRole("button", { name: "A · Play once on entry" }).click();
    const lower = artwork.locator('[data-part="lower"]');
    await artwork.scrollIntoViewIfNeeded();
    await expect(artwork).toHaveAttribute("data-motion-state", "complete");
    const finalTransform = await lower.getAttribute("transform");
    await page.evaluate(() => scrollTo(0, 0));
    await expect(artwork).toHaveAttribute("data-motion-state", "complete");
    await expect(lower).toHaveAttribute("transform", finalTransform!);
    await page.getByRole("button", { name: "B · Scroll controlled" }).click();
    await page.evaluate(() => {
      const element = document.querySelector(".advantage-motion")!;
      scrollTo(0, scrollY + element.getBoundingClientRect().top - innerHeight * 0.86);
    });
    await expect(lower).not.toHaveAttribute("transform", finalTransform!);
    const closedTransform = await lower.getAttribute("transform");
    await page.evaluate(() => scrollBy(0, innerHeight * 0.82));
    await expect(lower).toHaveAttribute("transform", finalTransform!);
    await page.evaluate(() => scrollBy(0, -innerHeight * 0.87));
    await expect(lower).toHaveAttribute("transform", closedTransform!);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
    await expect(page.locator(".motion-review-reference video")).not.toHaveAttribute("loop");
    await expect(page.locator(".motion-review-reference video")).not.toHaveAttribute("autoplay");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(artwork).toHaveAttribute("data-motion-state", "static");
    const staticTransform = await lower.evaluate(element => {
      const matrix = (element as SVGGElement).transform.baseVal.consolidate()?.matrix;
      return matrix ? [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f] : [1, 0, 0, 1, 0, 0];
    });
    expect(staticTransform).toEqual([1, 0, 0, 1, 0, 0]);
    await expect(lower).toHaveCSS("opacity", "1");
    expect(await artwork.locator('[data-part="curve"] path').getAttribute("pathLength")).toBeNull();
  });
}

test("Reduced-motion Index does not load the animation engine or reference video", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", request => requests.push(request.url()));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Enterprise AWS Consulting/ })).toBeVisible();
  expect(requests.filter(url => /MotionReview|AnimatedAdvantage|DesktopAdvantage|MobileAdvantage|advantage-motion-reference/.test(url))).toEqual([]);
});

test("motion review matches Index section typography and layout across widths", async ({ page }) => {
  for (const width of [414, 600, 601, 900, 1440, 2120]) {
    await page.setViewportSize({ width, height: 1000 });
    const measure = async (route: string) => {
      await page.goto(route);
      await page.locator("#forward-deployed").waitFor();
      await page.evaluate(() => document.fonts.ready);
      return page.locator("#forward-deployed").evaluate(section => {
        const origin = section.getBoundingClientRect();
        return [".section-heading", ".eyebrow", "h2", ".advantage-points", ".advantage-points p", ".advantage-points strong", ".advantage-diagram"].map(selector => {
          const element = section.querySelector(selector)!;
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return { selector, x: Math.round((rect.left - origin.left) * 10) / 10,
            y: Math.round((rect.top - origin.top) * 10) / 10, width: Math.round(rect.width * 10) / 10,
            fontSize: style.fontSize, fontWeight: style.fontWeight, fontFamily: style.fontFamily,
            lineHeight: style.lineHeight, gap: style.gap };
        });
      });
    };
    const index = await measure("/");
    const review = await measure("/motion-review");
    await expect(page.locator(".advantage-motion svg")).toBeVisible();
    expect(review).toEqual(index);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
});

for (const width of [414, 1440]) {
  test(`Index uses the approved reversible animation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await page.locator("#forward-deployed").scrollIntoViewIfNeeded();
    const artwork = page.locator("#forward-deployed .advantage-motion");
    await expect(artwork).toHaveAttribute("data-motion-mode", "scroll");
    await page.evaluate(() => {
      const rect = document.querySelector(".advantage-motion")!.getBoundingClientRect();
      scrollTo(0, scrollY + rect.top - innerHeight * 0.86);
    });
    const lower = artwork.locator('[data-part="lower"]');
    const offset = () => lower.evaluate(element => (element as SVGGElement).transform.baseVal.consolidate()?.matrix.f ?? 0);
    await expect.poll(offset).toBeLessThan(-100);
    await page.evaluate(() => scrollBy(0, innerHeight * 0.82));
    await expect.poll(offset).toBe(0);
    await page.evaluate(() => scrollBy(0, -innerHeight * 0.87));
    await expect.poll(offset).toBeLessThan(-100);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(artwork).toHaveCount(0);
    await expect(page.locator(`.advantage-diagram .diagram-${width <= 600 ? "mobile" : "desktop"} img`)).toBeVisible();
  });
}

test("visible graph top aligns with the eyebrow in the two-column layout", async ({ page }) => {
  for (const width of [601, 900, 1440, 2120]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/motion-review");
    await page.locator(".advantage-motion svg").waitFor();
    await page.evaluate(() => document.fonts.ready);
    const difference = await page.locator("#forward-deployed").evaluate(section => {
      const svg = section.querySelector("svg")!;
      const point = svg.createSVGPoint();
      point.y = svg.getBBox().y;
      const graphTop = point.matrixTransform(svg.getScreenCTM()!).y;
      return graphTop - section.querySelector(".eyebrow")!.getBoundingClientRect().top;
    });
    expect(Math.abs(difference)).toBeLessThan(0.2);
  }
});
