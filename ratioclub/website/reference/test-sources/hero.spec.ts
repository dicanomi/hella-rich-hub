import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [320, 414, 768, 1440, 1920]) {
  test(`hero reflows at ${width}px without hiding content`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    const hero = await page.locator(".hero-surface").boundingBox();
    const action = await page
      .getByRole("link", { name: "Schedule an Architecture Review" })
      .boundingBox();
    expect(
      (await page.locator(".hero-index").boundingBox())!.height,
    ).toBeGreaterThanOrEqual(900);
    expect(hero!.height).toBeGreaterThanOrEqual(885);
    expect(action!.y + action!.height).toBeLessThanOrEqual(
      hero!.y + hero!.height,
    );
  });
}

test("reduced motion uses the matching 404 still without fetching video", async ({
  page,
}) => {
  const media: string[] = [];
  page.on("request", (request) => {
    if (/\.mp4(?:$|\?)/.test(request.url()))
      media.push(request.url());
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Play background video" }),
  ).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  expect(media).toEqual([]);
  await expect(page.locator(".hero-poster-image img")).toHaveAttribute("src",/404-video-frame/);
  expect(await page.locator(".hero-poster").evaluate(e=>getComputedStyle(e,"::after").backgroundColor)).toBe("rgba(0, 0, 0, 0.45)");
  await page.getByRole("button", { name: "Play background video" }).click();
  await expect(
    page.getByRole("button", { name: "Pause background video" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause background video" }).click();
  expect(
    await page
      .locator("video")
      .evaluateAll((videos) => videos.every((video) => (video as HTMLVideoElement).paused)),
  ).toBe(true);
});

test("data saving uses the poster even without reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: Object.assign(new EventTarget(), { saveData: true }),
    }),
  );
  const media: string[] = [];
  page.on("request", (request) => {
    if (/\.mp4(?:$|\?)/.test(request.url())) media.push(request.url());
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Play background video" }),
  ).toBeVisible();
  expect(media).toEqual([]);
});

test("menu Escape restores focus and hidden links cannot receive focus", async ({
  page,
  browserName,
}) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open navigation" });
  await toggle.click();
  await expect(
    page.getByRole("navigation", { name: "Additional navigation" }),
  ).toBeVisible();
  // Safari uses Option-Tab for links when full keyboard navigation is disabled.
  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  await expect(page.locator("#expanded-navigation a").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(
    page.getByRole("navigation", { name: "Additional navigation" }),
  ).toBeHidden();
  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  await expect(
    page.getByRole("link", { name: "Schedule an Architecture Review" }),
  ).toBeFocused();
});

test("primary enquiry action reaches Contact without a calendar", async ({page}) => {
 await page.goto('/');await page.getByRole('link',{name:'Schedule an Architecture Review',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Contact',exact:true})).toBeVisible();await expect(page.locator('iframe')).toHaveCount(0);
});

test("automated accessibility checks pass closed and open navigation", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Open navigation" }).click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test("legal routes contain only Ratioclub status content and no external links", async ({
  page,
}) => {
  for (const path of ["/terms-and-conditions", "/privacy-notice"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('.legal-reading-introduction')).toContainText('placeholder');
    const origins = await page.locator('a').evaluateAll(links => links.map(link => new URL(link.href).origin));
    expect(origins.length).toBeGreaterThan(1);
    expect(origins.every(origin => origin === 'http://127.0.0.1:5191')).toBe(true);
    await page.reload();
    await expect(
      page.getByRole("link", { name: "Ratioclub home" }).first(),
    ).toBeVisible();
  }
});

test("200% text sizing remains readable without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 414, height: 896 });
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    414,
  );
  await expect(
    page.getByRole("link", { name: "Schedule an Architecture Review" }),
  ).toBeVisible();
});

test("navigation animates both ways and closes on outside click", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const toggle = page.locator(".menu-toggle");
  const menu = page.locator("#expanded-navigation");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(
    await menu.evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toContain("0.18s");
  await menu.evaluate((el) =>
    Promise.all(el.getAnimations().map((animation) => animation.finished)),
  );
  await expect(menu).toHaveCSS("opacity", "1");
  await page.mouse.click(5, page.viewportSize()!.height - 5);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toHaveAttribute("inert", "");

  await expect(menu).toHaveCSS("visibility", "hidden");
  await toggle.click();
  await toggle.click();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(menu).toHaveCSS("opacity", "1");
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCSS("visibility", "hidden");
});

test("white frame is equal on three edges and switches off at 600px", async ({
  page,
}) => {
  for (const width of [414, 600, 601, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1080 });
    await page.goto("/");
    const edges = await page.locator(".hero-index").evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.paddingLeft, style.paddingRight, style.paddingBottom];
    });
    expect(edges).toEqual(Array(3).fill(width <= 600 ? "0px" : "15px"));
  }
});

test("conversion action opens Contact and footer links remain local", async ({
  page,
}) => {
  await page.goto("/");
  const action = page.getByRole("link", { name: "COME SAY HI!" });
  await action.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole('dialog',{name:'Contact',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Contact',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
  await page
    .getByRole("navigation", { name: "Footer navigation" })
    .getByRole("link", { name: "Privacy Notice" })
    .click();
  await expect(page).toHaveURL(/\/privacy-notice$/);
  await expect(
    page.getByRole("heading", { name: "Privacy Notice", exact: true }),
  ).toBeVisible();
});

test("card groups keep complete rows until the mobile layout", async ({
  page,
}) => {
  for (const width of [414, 600, 601, 700, 900, 1200, 1440]) {
    await page.setViewportSize({ width, height: 1080 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    for (const [selector, count] of [
      [".feature-grid", 4],
      [".solutions-grid", 3],
    ] as const) {
      const rowCount = await page
        .locator(selector)
        .evaluate(
          (grid) =>
            new Set(
              [...grid.children].map((card) =>
                Math.round(card.getBoundingClientRect().top),
              ),
            ).size,
        );
      expect(rowCount).toBe(width <= 600 ? count : selector === ".feature-grid" && width <= 1100 ? 2 : 1);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  }
});

test("footer keeps clearance above the wordmark across compact widths", async ({ page }) => {
  for (const width of [414, 600, 601, 700, 900, 1440]) {
    await page.setViewportSize({ width, height: 1080 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const gap = await page.evaluate(() => {
      const wordmark = document.querySelector(".footer-wordmark")!.getBoundingClientRect();
      const navigation = document.querySelector(".footer-content nav")!.getBoundingClientRect();
      const copyright = document.querySelector(".copyright")!.getBoundingClientRect();
      return wordmark.top - Math.max(navigation.bottom, copyright.bottom);
    });
    expect(gap).toBeGreaterThanOrEqual(31.9);
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(0, 6, 4)");
    await expect(page.locator("footer")).toHaveCSS("background-color", "rgb(23, 31, 35)");
  }
});

test("hero loops in one visible player and pauses without changing the design", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator('video')).toHaveCount(1);
  await expect(page.getByRole('button',{name:'Pause background video'})).toBeVisible();
  const video=page.locator('video');
  const media=await video.evaluate((v:HTMLVideoElement)=>({source:v.currentSrc,duration:v.duration,width:v.videoWidth,height:v.videoHeight}));
  expect(media.source).toContain('hero-review-updated');expect(media.duration).toBe(8);expect([media.width,media.height]).toEqual([1024,768]);
  await video.evaluate((v:HTMLVideoElement)=>{v.currentTime=v.duration-.3;});
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeLessThan(2);
  await expect(page.locator('.hero-video-frames')).toHaveCSS('opacity','1');
  await expect(page.locator('.hero-video-frames')).toHaveCSS('animation-name','none');
  expect(await page.locator('.hero-motion').evaluate(e=>getComputedStyle(e,'::after').backgroundColor)).toBe('rgba(0, 0, 0, 0.45)');
  await page.getByRole('button',{name:'Pause background video'}).click();
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
});

test("hero pauses offscreen and preserves an explicit user pause", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Pause background video" })).toBeVisible();
  const allPaused = () => page.locator("video").evaluateAll(videos => videos.length === 1 && videos.every(video => (video as HTMLVideoElement).paused));
  await page.locator("#scale-speed-efficiency").scrollIntoViewIfNeeded();
  await expect.poll(allPaused).toBe(true);
  const times = await page.locator("video").evaluateAll(videos => videos.map(video => (video as HTMLVideoElement).currentTime));
  await page.waitForTimeout(200);
  expect(await page.locator("video").evaluateAll(videos => videos.map(video => (video as HTMLVideoElement).currentTime))).toEqual(times);
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.getByRole("button", { name: "Pause background video" })).toBeVisible();
  await expect.poll(allPaused).toBe(false);
  await page.getByRole("button", { name: "Pause background video" }).click();
  await expect.poll(allPaused).toBe(true);
  await page.locator("footer").scrollIntoViewIfNeeded();
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.getByRole("button", { name: "Play background video" })).toBeVisible();
  await expect.poll(allPaused).toBe(true);
});

test('hero white frame has no white backing or top border beneath the media', async ({ page }) => {
  for (const width of [414, 601, 1115, 1440]) {
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    const paint=await page.locator('.hero-index').evaluate(e => {
      const s=getComputedStyle(e,'::before');
      return { background:s.backgroundColor,top:s.borderTopWidth,side:s.borderLeftWidth,bottom:s.borderBottomWidth,heroTop:document.querySelector('.hero-surface')!.getBoundingClientRect().top };
    });
    expect(paint.background).toBe('rgba(0, 0, 0, 0)');
    expect(paint.top).toBe('0px');
    expect(paint.side).toBe(width>600?'15px':'0px');
    expect(paint.bottom).toBe(paint.side);
    expect(paint.heroTop).toBe(0);
  }
});

test('Index has no entrance animation on first load, return, or refresh', async ({page}) => {
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  for(const entry of ['first','return','refresh']) {
    if(entry==='return') {
      await page.locator('.header-links a[href="/solutions"]').click();
      await page.locator('.brand-link').click();
    }
    if(entry==='refresh') await page.reload();
    await expect(page.getByRole('button',{name:'Pause background video'})).toBeVisible();
    await expect(page.locator('.hero-video-frames')).toHaveCSS('animation-name','none');
    await expect(page.locator('.hero-video-frames')).toHaveCSS('opacity','1');
    expect(await page.locator('.hero-motion').evaluate(e=>getComputedStyle(e,'::after').backgroundColor)).toBe('rgba(0, 0, 0, 0.45)');
    if(entry==='return') expect(await page.locator('video').first().evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeLessThan(2);
  }
});
