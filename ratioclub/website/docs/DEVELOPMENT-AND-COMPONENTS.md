# Development and component map

## Editing

- Copy: `src/content/index.ts`, `about.ts`, `solutions.ts`, `sections.ts`; current legal copy is `src/content/privacy-notice.json` and `src/content/terms-and-conditions.json`, rendered by `PrivacyNoticeContent.tsx` and `TermsConditionsContent.tsx` through `LegalPage.tsx`. The old preview JSON remains unused source/reference material.
- Shared H1/H2/H3: `src/typography.css`. Use semantic levels; decorative section numerals are not headings. Do not add new page-specific heading scales.
- CTA contract: `src/actions.css`; compact navigation/footer links are separate. Keep approved padding and hover variants.
- Index: `HeroIndex.tsx`, `HeroMedia.tsx`, `useHeroIntro.ts`; heading, CTA group, logo and nav fade simultaneously over 650ms on every visit. Reduced motion bypasses the reveal; interaction ends it without blocking a click.
- Quote: Solutions includes three-arm Fibonacci artwork, matching its hero geometry at rest. The quote is static at rest with hover and scroll animation disabled. No entrance spin. `Quote.tsx` and `useQuoteReveal.ts`; separate opening quote and attribution on desktop/mobile; Index quote then attribution reveal remains. About includes its attribution on both layouts.
- Header: `Header.tsx`, `styles.css`. Desktop at 769px and above shows two direct text links with no hamburger or open menu. Compact layouts retain the two-bar menu toggle and open navigation; resizing to desktop closes it. Legal links remain only in the footer. No code-level route change delays.
- Subpage heroes: `SubpageHero.tsx`, `useSubpageArtworkIntro.ts`; Solutions/About golden-ratio artwork starts stationary; hover reveals depth and rotates, then returns to its readable resting pose. Mobile retains the approved hidden-artwork layout below 600px. Solutions/About use Graphite backgrounds, Cyan H1s, Silver three-arm golden-ratio artwork (`GoldenRatioShape.tsx`), flat start and hover depth reveal.
- Shapes: Index uses `motion/wireframe/RotatingWireframe.tsx`; About uses six distinct medium-density forms from `SacredMorphShapes.tsx`. About shapes rotate and morph on hover only; they do not animate on scroll. Visibility cleanup and reduced-motion behavior remain. Mobile artwork retains safe room to avoid cropping; service graphs unchanged.
- About _01 titles: explicit two-line desktop/tablet layout; narrow tablets use two columns to avoid overlap. Mobile wording/layout is unchanged.
- About section gaps: `useAboutSectionGaps.ts` compensates external padding outside content so visible gaps match _03-to-_04. Internal table/card padding and copy remain unchanged. It measures after fonts and responds to resizing.
- Footer: `Footer.tsx`, `FooterWordmark.tsx`, `useLocalCopyrightYear.ts`. Copyright follows visitor local time at New Year. Plain footer links use 25px line height. Legal links are muted/Silver-hover without underlines. Logo progressive blur begins lower at 40% instead of 25%, retaining original size/position/color and maximum blur at its base.
- Legal pages: `LegalPage.tsx`, `legal.css`, `SacredMorphShapes.tsx`; no text reveal. Medium-density nested and subdivided polyhedra morph independently. Terms and Privacy use different sets. Artwork is hidden below 601px; legal scroll response is deliberately calmer. H1 uses the sitewide contract, body remains 16px/1.6 with normal letter spacing and 540px reading measure. Draft legal H2 remains an explicit existing reading-layout exception. Preserve the supplied November 23, 2026 copy, numbered lists and California table. The Privacy table scrolls internally on small screens.

## Modals and preferences

Contact and Privacy Choices are native full-screen dialogs, same URL. Centered content; local copy/switch behavior; 180ms fade; reduced-motion bypass. X and Escape close; desktop mouse clicks outside the content container also close (dragging from inside does not); Contact has no lower Close button. Modal close icons spin 90 degrees and morph from X into the ratio symbol on desktop hover, reversing on leave; reduced motion bypasses it. Privacy action buttons precede policy links/notices and retain their padding. Focus returns to the opener. Switch thumbs show ON/OFF inside the track, animate from the opposite position on open without changing preferences, and stay muted. Required is disabled.

Preferences save locally only. Necessary is locked on; Analytics/Marketing can store selections but `optionalProcessingAllowed()` returns false. GPC forces marketing off; DNT forces both off. Unsaved close discards edits; storage failure is reported. No preference enables installed tracking because no such integration exists. Contact copy feedback is success-only, with honest failure behavior; the retained Contact form does not send email.

## Navigation and scroll

`main.tsx`, `scroll-restoration.ts`: ordinary page navigation goes to top on one activation, repeated same-route navigation returns to top, hashes target their section, refresh/history traversal restore reading position. Safari history state writes are throttled; do not restore per-frame replaceState calls. Preserve links as native anchors and do not place transparent interaction layers over them.

## Media

`src/assets/` contains the source fallbacks; source imports become hashed output. Fonts are local. Hero video/poster crop and fixed darkening are intentional. `src/content/media-overrides.json` is `{}` in this package, so all slots use fallbacks. Only local exported CMS media paths are accepted; no credential or remote endpoint enters the browser. `public/social/web-card.png` and favicon are fixed URLs and require revalidation caching.

Solutions/About hero areas below navigation are 25% shorter while type/art sizes remain unchanged. Index mobile feature slots use 0/30px top/bottom padding; Core Solutions slots use 0/20px with card top padding 0/40/24px. LinkedIn uses the client company page in the footer and compact open navigation. About outcome text is now “Zero silent hardware degradation”. Intro paragraphs on Solutions/About use Roboto, retaining existing weight/size/spacing rules.
