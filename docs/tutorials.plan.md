# Landing-First Interactive Tutorials

## Summary

Implement landing tutorial showcase first. Then build four action-driven tutorials:

- Swatches and dynamic sorting
- Search and filtering
- Color harmony
- Accessibility

## [x] 1. Landing Carousel and Preview Assets

- Add tutorial section directly after tool cards, before featured colors.
- Reuse installed `embla-carousel-react`.
- Add four slides matching tutorial order.
- Each slide contains localized title, explanation, feature highlights, preview image, pagination, and “Start tutorial” CTA.
- Use manual arrows, dots, touch swipe, and keyboard navigation. No autoplay.
- Use split desktop layout and stacked mobile layout.
- Add accessible carousel labels, focus states, and fixed image dimensions.

Create four English-only 1200×675 WebP previews:

- DUO swatches, copy zones, counter, and reorder indicator
- Search, category filters, and reduced results
- Harmony dialog and generated palette
- Accessibility controls and assisted swatches

Add `generate:tutorial-previews` script:

- Start isolated local app.
- Seed deterministic state.
- Capture real UI with Playwright.
- Compose terminal-style frames and English annotations using Sharp.
- Write optimized assets under `public/tutorials/`.
- Keep intermediate screenshots temporary.
- Commit generated WebPs; do not regenerate during every build.

Add landing route contract immediately:

- Swatches → localized DUO route with `?tutorial=swatches`
- Filtering → localized DUO route with `?tutorial=filtering`
- Harmony → localized DUO route with `?tutorial=harmony`
- Accessibility → localized DUO route with `?tutorial=accessibility`

## 2. Tutorial Foundation

- Add pinned React Joyride v3 dependency.
- Add `TutorialProvider` around tool pages.
- Define `TutorialId`, tutorial catalog, typed steps, route mappings, and action requirements.
- Consume validated tutorial query after targets mount, start tutorial, then remove parameter using history replacement.
- Preserve locale, unrelated query parameters, and hash.
- Add Help button beside A11Y control with same four tutorial entries.
- Never auto-start during ordinary visits.

Tutorial controls:

- Back, Cancel, Escape, progress indicator, and keyboard focus.
- Required actions advance automatically.
- Informational steps use Next.
- Route change or missing target cancels tutorial and restores state.
- Stable `data-tutorial` anchors avoid translated-text selectors.

## 3. Tutorial Flows

### Swatches

- SOLO requires primary copy.
- DUO/OWN requires primary and secondary copies.
- Temporarily clear active counters and target non-first swatch to demonstrate count increase and movement toward top.
- OWN switches EDIT to VIEW temporarily, then restores original mode.
- One-color OWN palette teaches counter without reorder.
- Empty OWN palette disables tutorial with explanation.

### Search and Filtering

- Temporarily clear search and categories.
- Require search text that reduces results.
- Require category selection.
- Explain combined result count.
- Mobile flow requires opening filter sheet.

### Color Harmony

- Require opening harmony from swatch.
- Force hover-only harmony action visible during tutorial.
- Explain primary and secondary anchors.
- Require changing harmony mode.
- Require toggling `FACTORY_SAFE`.
- Require copying generated suggestion.

### Accessibility

- Require opening A11Y sheet.
- Require changing vision simulation.
- Require toggling symbols and patterns.
- Finish with spotlighted swatch preview.

## 4. State Restoration

- Snapshot counters, pending counts, filters, accessibility settings, OWN VIEW/EDIT mode, dialogs, sheets, and tutorial-controlled UI.
- Restore snapshot on Finish, Cancel, Escape, navigation, or target failure.
- Reset reorder animations during restoration.
- Real clipboard writes remain; previous clipboard content is never read.
- No completion tracking or tutorial analytics.

## 5. Tests and Acceptance

- Test landing carousel content, ordering, localization, navigation, swipe, keyboard controls, focus, and no autoplay.
- Verify four WebPs exist, decode, and measure 1200×675.
- Verify every landing CTA reaches correct localized mode and starts selected tutorial.
- Unit-test tutorial catalog, action gating, query handling, mode-specific steps, and state restoration.
- E2E-test all tutorials on desktop and mobile.
- Cover SOLO, DUO, OWN, one-color OWN, and empty OWN.
- Verify Finish, Cancel, Escape, and navigation restore all captured state.
- Verify clipboard changes while counters/settings restore.
- Verify Ukrainian landing launches Ukrainian tutorial despite English preview image.
- Run unit tests, E2E suite, TypeScript check, and production build.

## Assumptions

- Landing work is first implementation milestone.
- OWN palette editing tutorial remains out of scope.
- Help button appears only on tool pages.
- Preview images use English UI; surrounding content and alt text are localized.
- Existing visual design, local-storage policy, and no-analytics policy remain unchanged.
