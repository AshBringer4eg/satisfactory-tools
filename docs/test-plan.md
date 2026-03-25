# Risk-Based Frontend Test Plan (Lead QA)

## 1) Executive summary

### Overall test risk assessment

- **Overall risk: Medium–High** for regressions in stateful UI behavior due to heavy client-side state and persistence (`localStorage`, tab persistence, copy counters, own-palette draft/edit/save/import/export), animation-driven reordering, and locale-dependent rendering.
- **Highest risk cluster:** `Own` tab editor flow (multi-step state transitions, validation, import/export, mode switching, and storage error handling).
- **Secondary risk cluster:** color swatch interaction model (copy behavior, delayed counter flush on mouse leave, animated reorder token/floating state).

### Test strategy summary

- Keep E2E **small and critical-path only** (smoke + high-risk multi-step flows).
- Put most logic confidence in **unit tests** for data normalization/validation and **integration tests** for stateful components (`ColorsTab`, `OwnTab`, `AppTabBar`, locale switching).
- Use **manual exploratory** for visual and interaction quality (animations, responsive layout nuances, overflow/truncation, dark/light/contrast behavior if applicable).
- Avoid redundant test duplication across layers.

### Top 10 highest-risk areas

1. Own palette draft validation and save enable/disable logic.
2. Own import/export base64 flows and malformed payload handling.
3. Own edit/use mode transitions with unsaved changes and error states.
4. Copy count persistence and reset event coordination across tabs.
5. Search + category filter combination and empty result behavior.
6. Counter-driven resorting/reorder animation and floating placeholder logic.
7. Locale switching and localized labels for dynamic data (colors/categories).
8. Mobile filter `Sheet` behavior (open/close, focus, same filter semantics as desktop).
9. Route fallback (`*`) and base URL behavior under GitHub Pages basename.
10. Storage failure fallback branches (read/write failures) and resilience UX.

### Top 10 highest-value automated tests

1. **P0 E2E:** Open app → SOLO search/filter → copy swatch → counter persists after reload.
2. **P0 E2E:** OWN edit flow with invalid draft -> save blocked -> fix -> save -> view enabled.
3. **P0 E2E:** OWN import malformed base64 -> error shown -> no state corruption.
4. **P0 E2E:** OWN export blocked when unsaved/errors; enabled after successful save.
5. **P0 Integration:** `use-own-palette-editor`/OwnTab status transitions for add/remove/reset/clear/import/save.
6. **P0 Unit:** `validateAndNormalizeOwnPaletteDraft` edge cases (#RGB/#RRGGBB, fallback secondary, duplicates, missing names).
7. **P1 Integration:** `ColorsTab` queue/flush copy count behavior and reset event handling.
8. **P1 Integration:** Tablist keyboard navigation and proper `aria-selected`/tabpanel linkage.
9. **P1 Integration:** Locale switching updates visible UI and category/color labels.
10. **P1 Unit:** `importColorsFile` and `importOwnPaletteBase64ToDraftRows` strict validation and normalization rules.

---

## 2) Application understanding

## App purpose (confirmed)

A frontend utility for browsing Satisfactory item/light color references, filtering/searching them, and copying HEX codes, with a customizable “Own” palette editor.

## Pages / routes (confirmed)

- `/` → main app (`Index`).
- `*` → `NotFound` page with home link.

## Main features (confirmed)

- Three tabs: **Solo**, **Duo**, **Own**.
- Search by name/hex and category filters.
- Copy HEX by clicking swatches (single-color in Solo, primary/secondary in Duo/Own-use).
- Copy count tracking and ordering by copy frequency; persistence in localStorage.
- Reset copy counters event across tabs.
- Own palette editing: row add/remove, known code selection vs custom row, validation, save, reset, clear, import(base64), export(base64), copy export text.
- Locale switcher (EN/UK) with locale persistence.

## Reusable UI patterns (confirmed)

- Tablist semantics (`role=tablist`, `role=tab`, `role=tabpanel`) with arrow-key handling.
- Radix-based `Dialog` (own import/export) and `Sheet` (mobile filters).
- Reusable swatch cards with hover/copy feedback and selection interaction.

## Forms / input-heavy areas (confirmed)

- Search input.
- Own edit table inputs: code selector + text/color inputs.
- Import/export dialogs using textarea.
- **No React Hook Form / Zod usage in app flows** despite dependencies present (needs verification if planned but currently unused).

## Async/state flows (confirmed)

- Clipboard writes (`navigator.clipboard.writeText`) with success/failure message paths.
- Animated reorder/floating transitions in `ColorsTab` with deferred copy-count flush.
- Local storage read/write and fallback behavior across active tab, locale, counters, and own palette.

## Mutations / state-changing actions (confirmed)

- Copy action mutates pending + persisted copy counts.
- Tab switching mutates active tab + persisted storage value.
- Own editor mutates draft rows, save state, errors, status, dialogs, and persisted own palette.

## User states (confirmed)

- Loading: **none explicit** for data fetch (local/static app).
- Success: saved/imported/export copied messages.
- Error: validation errors, import errors, storage failure messages, copy unavailable/failed messages.
- Empty: filtered list empty state; own table can become empty after clear.
- Disabled: save/export buttons conditionally disabled/hidden.

## Feature flags/theme (needs verification)

- No explicit feature-flag system found.
- No explicit dark-mode toggle found; app uses theme classes/tokens from Tailwind/shadcn but behavior should be verified.

## Important edge-case-prone areas

- Reorder animation state cleanup (`floatingMove`, placeholder rect, pending counts).
- Event-driven reset of counters across multiple tabs/storage keys.
- Own import payload normalization (code/category/name/hex fallback rules).
- Clipboard availability differences by browser/security context.

### Confirmed use cases

- Browse/search/filter colors and copy hex values.
- Switch between Solo/Duo/Own tabs and persist active tab.
- Edit and persist a custom palette with import/export in Own tab.

### Inferred use cases

- User may rely on color ranking by frequent copy (because sorted by count).
- User may use mobile filter sheet for constrained screens.

### Needs verification

- Whether animation correctness is considered business-critical vs cosmetic.
- Whether EN/UK parity in all user-visible strings is release-critical.
- Whether long-term backward compatibility for imported base64 payloads is required.

---

## 3) Test scope

## In scope

- Frontend UI flows, routing, client validation, accessibility semantics, keyboard interactions, state persistence, and browser compatibility.
- All behavior visible in `Index`, `ColorsTab`, `ColorSwatch`, `OwnTab` and related helpers.

## Out of scope

- Backend/API/database testing (none in repo).
- Server-side auth/session/business workflows (none in repo).
- Performance/load testing at scale beyond practical frontend checks.

## Needs verification

- Exact support matrix for browsers/devices beyond default Chromium-like local development.
- Product expectations for offline mode and clipboard restrictions.

---

## 4) Risk-based coverage matrix

| Feature / Use case                               | User value                   | Risk   | Priority | Main risks                               | Recommended level                       | Notes                                   |
| ------------------------------------------------ | ---------------------------- | ------ | -------- | ---------------------------------------- | --------------------------------------- | --------------------------------------- |
| App shell + route rendering (`/`, `*`)           | App opens and fallback works | Medium | P1       | basename/routing regressions             | E2E smoke + integration                 | Include NotFound back-home path         |
| Tab switching + keyboard navigation              | Core navigation              | Medium | P1       | ARIA mismatch, keyboard break            | Integration + E2E smoke                 | Existing a11y unit covers part          |
| Solo swatch copy flow                            | Core user action             | High   | P0       | clipboard failure, count mismatch        | E2E + integration                       | Verify copy feedback + count increment  |
| Duo swatch copy flow (primary/secondary)         | Core user action             | High   | P0       | wrong hex copied, wrong button mapping   | E2E + integration                       | Dual-hit area higher risk               |
| Search + category filter composition             | Frequent behavior            | High   | P0       | incorrect combined predicates            | E2E + integration                       | Include empty states                    |
| Counter persistence + reset event                | Repeat usage reliability     | High   | P0       | stale storage, cross-tab reset drift     | E2E + integration                       | Event-driven state prone to regressions |
| Reorder animation logic                          | UX + ranking trust           | Medium | P2       | unstable movement state                  | Integration + manual                    | Keep automation minimal to avoid flake  |
| Locale switching + locale persistence            | International UX             | Medium | P1       | stale labels/partial localization        | Integration + E2E smoke                 | Validate EN/UK toggling                 |
| Own edit mode: row add/remove/edit               | Advanced core feature        | High   | P0       | state corruption, hidden save/view logic | E2E + integration                       | Most complex state surface              |
| Own validation errors + disabled/hidden controls | Prevent bad saves            | High   | P0       | invalid data persisted                   | Unit + integration + E2E happy/negative | Use deterministic fixtures              |
| Own save/reset/clear persistence                 | Data integrity               | High   | P0       | wrong localStorage payloads              | E2E + integration + unit helpers        | Validate payload shape                  |
| Own import base64 + normalization                | Data portability             | High   | P0       | malformed import handling, wrong mapping | Unit + E2E                              | Include mixed known/custom rows         |
| Own export base64 + clipboard copy               | Portability/shareability     | Medium | P1       | export blocked state errors              | Integration + E2E                       | assert blocking rules                   |
| Mobile filter sheet (Radix dialog semantics)     | Mobile usability             | Medium | P1       | filter mismatch desktop/mobile           | E2E mobile + manual                     | focus trap manually verify              |
| NotFound logging behavior                        | Diagnostics                  | Low    | P3       | noisy console side effects               | Do not automate heavily                 | one route assertion sufficient          |

---

## 5) Detailed test scenarios (major flows)

### Scenario 1: SOLO core browse/copy/persist

- **Preconditions:** clean localStorage for copy counts.
- **Steps:** open `/` -> search “turbofuel” -> click swatch -> move cursor off swatch -> reload.
- **Expected:** clipboard gets primary hex; count increments and persists; swatch order reflects higher count.
- **Failure states:** clipboard unavailable message path; count not persisted.
- **Priority:** P0.
- **Automation:** E2E (critical path) + integration for deterministic state transitions.

### Scenario 2: DUO primary/secondary correctness

- **Preconditions:** app loaded, DUO tab active.
- **Steps:** click primary then secondary areas for same item.
- **Expected:** primary hex then secondary hex copied; labels/aria names map to correct target.
- **Failure states:** both areas copying same hex; wrong count/feedback.
- **Priority:** P0.
- **Automation:** E2E + integration.

### Scenario 3: Search + category filtering composition

- **Preconditions:** default palette loaded.
- **Steps:** enter search term matching multiple categories -> toggle category -> clear search.
- **Expected:** intersection logic works; results summary updates; empty state appears when no match.
- **Failure states:** union logic bug, stale results after clear.
- **Priority:** P0.
- **Automation:** Integration + one E2E smoke.

### Scenario 4: Counter reset from footer/event

- **Preconditions:** some copied counts exist in default and own keys.
- **Steps:** trigger reset action (footer) or reset event; inspect UI + storage.
- **Expected:** counts zeroed in UI; both storage keys cleared.
- **Failure states:** one key not reset, stale pending counts remain.
- **Priority:** P0.
- **Automation:** E2E + integration.

### Scenario 5: OWN edit guardrails (save/view)

- **Preconditions:** open Own -> Edit mode.
- **Steps:** create invalid row state -> verify save hidden/disabled + errors -> fix fields -> save -> view appears.
- **Expected:** strict gating of save/view by valid draft and unsaved-change status.
- **Failure states:** save allowed on invalid draft, view available with unsaved changes.
- **Priority:** P0.
- **Automation:** E2E + integration.

### Scenario 6: OWN import malformed then recover

- **Preconditions:** open Own edit.
- **Steps:** import malformed base64 -> observe errors -> import valid payload -> save.
- **Expected:** malformed input rejected without corrupting state; valid import loads rows and saves.
- **Failure states:** crash, silent accept, stale error blocking valid save.
- **Priority:** P0.
- **Automation:** E2E + unit tests for parser.

### Scenario 7: OWN export block/unblock

- **Preconditions:** Own edit in clean state.
- **Steps:** confirm export enabled -> introduce unsaved/invalid row -> export blocked warning -> save valid draft -> export + copy.
- **Expected:** block conditions enforced; copied base64 non-empty and dialog closes on success.
- **Failure states:** export enabled while invalid; no copy feedback.
- **Priority:** P1.
- **Automation:** E2E + integration.

### Scenario 8: Language switch persistence

- **Preconditions:** none.
- **Steps:** switch EN -> UK -> reload.
- **Expected:** locale-sensitive labels change and persist; fallback still readable.
- **Failure states:** partial updates, persistence failure.
- **Priority:** P1.
- **Automation:** Integration + E2E smoke.

### Scenario 9: Mobile filter sheet behavior

- **Preconditions:** viewport mobile width.
- **Steps:** open menu sheet -> apply category filter -> close -> verify list reflects filter; keyboard close (`Esc`) works.
- **Expected:** identical filter semantics as desktop; focus returns to trigger.
- **Failure states:** inaccessible dialog/focus leak.
- **Priority:** P1.
- **Automation:** E2E mobile + manual accessibility checks.

### Scenario 10: NotFound route recovery

- **Preconditions:** none.
- **Steps:** navigate to unknown route -> click return home.
- **Expected:** 404 message shown; link navigates to `/` under basename.
- **Failure states:** broken link under deployment base path.
- **Priority:** P2.
- **Automation:** E2E smoke.

---

## 6) Test layer recommendations

## A) Unit tests (logic-heavy, stable)

1. `validateAndNormalizeOwnPaletteDraft` full rule set (required defaultName, duplicate known code, hex formats, secondary fallback, category behavior).
   - **Why unit:** deterministic and pure; fastest high-value signal.
2. `importOwnPaletteBase64ToDraftRows` and `parseOwnPaletteObjectToDraftRows` invalid structures and normalization.
   - **Why unit:** parser-level edge cases easier at function granularity.
3. `importColorsFile` normalization (auto code generation, duplicate code exception, category fallback to `CATEGORY_OTHER`).
   - **Why unit:** critical data integrity boundary.
4. Own utils: `isHexColor`, comparable row equality, known-code mapping transformations.
   - **Why unit:** prevent regressions in save-enable logic.
5. i18n helpers (`normalizeLocaleCode`, fallback key behavior) where exposed indirectly.
   - **Why unit/integration mix:** fallback and persistence logic important but mostly pure.

## B) Component/integration tests (stateful UI behavior)

1. `ColorsTab` interaction model: pending count queue, flush on swatch leave, reorder visual-state flags.
2. Search + category toggles + results summary + empty state rendering.
3. `AppTabBar` keyboard navigation and tab/tabpanel ARIA linkage.
4. `OwnTab` mode transitions (`use` vs `edit`) and button visibility logic (`save`, `view`, `export`).
5. `OwnEditDialogs` open/close behavior and disable states.
6. Clipboard unavailable branches for swatch and export copy.
7. Locale switching updates on header/tab labels and color/category names.

**Why integration for these:** multiple components/hooks and derived state interplay; catches regressions without full browser flake cost.

## C) E2E tests (critical journeys only)

1. App smoke: load `/`, tab navigation works, key controls visible.
2. SOLO critical flow: search/filter/copy/persist/reload/reset.
3. DUO correctness: primary vs secondary copy actions.
4. OWN critical edit flow: invalid -> fix -> save -> export/import path.
5. Routing fallback: unknown route to home.

**Why E2E:** validates integrated browser behavior, routing, clipboard mocks, storage, and cross-component interactions.

## D) Manual exploratory tests (human judgement)

1. Animation smoothness and absence of jank during reorder transitions.
2. Overflow/truncation with long names and extreme zoom (125/200%).
3. Mobile usability of sheet/dialogs and footer dense links.
4. Visual contrast/readability for overlays and text on varied swatch colors.
5. Browser-specific quirks (especially Safari clipboard and selection behavior).

**Why manual:** visual/UX quality and nuanced interaction are brittle in automation.

---

## 7) Edge cases and failure cases (non-happy path)

- `localStorage` read failure for active tab/locale/own palette (should fallback gracefully).
- `localStorage` write failure after save/reset/clear (status messages should indicate memory-only success).
- Clipboard API missing/denied on insecure context.
- Import payload: empty, malformed base64, valid base64 but invalid JSON, invalid schema, missing colors, duplicate known codes.
- Own row with selected known code + overridden fields; ensure known-code behavior is deterministic.
- Secondary color blank should fallback to primary after save/import normalization.
- Search input clear action should fully reset filtering and result count.
- Reset counters while animations/pending counts active (should converge cleanly).
- Category with zero remaining results under active search.
- Unknown route with basename path in deployed environment.

---

## 8) Accessibility test plan

## Automate

- Tablist semantics (`role`, `aria-selected`, `aria-controls`, keyboard arrows).
- Search input has accessible name.
- Category toggles expose `aria-pressed`.
- Dialog open/close presence and focusable controls.
- Icon+text action buttons have discernible names.

## Manual checks

- Focus order and visible focus indicator in header -> tabs -> filters -> swatches -> footer.
- `Dialog` and `Sheet` focus trap + `Esc` behavior + return focus to trigger.
- Keyboard-only operation for key journeys (search, filters, tab switching, own edit save/import/export).
- Screen reader naming quality for swatches and hex code elements.
- Contrast on colored backgrounds and feedback overlays.

## Needs verification

- Live-region adequacy of status/error announcements (some use `role=status`, but broader announcement strategy is unclear).

---

## 9) Responsive/browser test plan

## Minimum smart matrix

- **Desktop:**
  - Chrome latest (primary dev target).
  - Firefox latest (secondary engine differences in focus/selection).
  - Edge latest (Chromium parity plus enterprise usage).
- **Mobile:**
  - iPhone Safari (clipboard/selection/dialog differences).
  - Android Chrome.

## Viewports

- Mobile: `375x812` (iPhone baseline).
- Tablet: `768x1024`.
- Desktop: `1280x800` and one wide viewport (`1536x864`) to inspect grid behavior.

## Why this matrix

- App has explicit mobile/desktop split for filters (`Sheet` vs sidebar), so breakpoint transitions are risk-heavy.
- Clipboard and text selection behavior differ across engines, affecting core “copy hex” workflow.

---

## 10) Test data / environment needs

- **Fixtures:**
  - Small deterministic palette fixture (3–5 rows) for integration tests.
  - Valid and invalid base64 import strings (schema mismatch, malformed JSON, duplicate codes).
  - Localized expectations for EN/UK labels.
- **Mocks/helpers:**
  - Clipboard mock helper (`writeText` success/failure modes).
  - LocalStorage seed/reset helper for active tab, locale, counts, own palette.
  - Custom render helper for tab harness and locale reset after each test.
- **E2E setup:**
  - Pre-test storage cleanup.
  - Stable selectors via role/label + selected `data-testid` where present.
- **No network mocks required** for app behavior (static/local data only).

---

## 11) Flakiness prevention recommendations

- Prefer **semantic selectors** (`getByRole`, accessible names) over brittle class selectors.
- Keep animation assertions coarse (state end conditions), not frame-by-frame timing.
- In E2E, use `expect.poll` only for true async state boundaries (clipboard/storage), not arbitrary sleeps.
- Isolate state per test: clear localStorage and reset locale before/after tests.
- Avoid testing internal implementation details (exact framer-motion internals).
- For dialogs/sheets, assert open/closed + focus behavior rather than transition classes.
- For reorder behavior, assert final ordering/count, not transient positions.
- Keep one canonical helper per critical user action to reduce selector drift.

---

## 12) Final QA recommendation

## Must test before every release (absolute minimum)

1. App smoke load + tab switching + route fallback.
2. SOLO search/filter/copy/persist/reset.
3. DUO primary/secondary copy correctness.
4. OWN invalid->valid->save flow and storage persistence.
5. OWN import malformed + valid path, export block/unblock + copy.
6. Locale switch EN/UK and persistence.

## Can be deferred (if time constrained)

- Deep animation polish scenarios beyond one sanity check.
- Extensive cross-browser permutations beyond minimum matrix.
- Rare storage failure branch simulation in every CI run (keep as targeted suite).

## Best smoke tests

- `/` load + one swatch copy on SOLO.
- Switch to DUO + verify secondary copy works.
- Switch to OWN + open edit + save unchanged/valid state and return to view.
- Navigate to unknown route and recover via “return home”.

## Biggest blind spots today

- Existing tests are strong but still thin on **mobile sheet/dialog focus behavior**, **manual accessibility quality**, and **browser-specific clipboard constraints**.
- Dependencies for React Query / RHF / Zod are present but not used in app logic; future additions in those areas could bypass current test architecture unless proactively covered.

---

## Evidence basis (repository-derived)

- App shell/routes: `src/App.tsx`, `src/pages/Index.tsx`, `src/pages/NotFound.tsx`.
- Core browse/filter/copy logic: `src/components/ColorsTab.tsx`, `src/components/ColorSwatch.tsx`.
- Own editor and validation/import/export logic: `src/components/tabs/OwnTab.tsx`, `src/components/tabs/own/use-own-palette-editor.ts`, `src/components/tabs/own/OwnEditRow.tsx`, `src/components/tabs/own/OwnEditDialogs.tsx`, `src/data/own-palette.ts`, `src/data/colors.ts`.
- Locale/persistence behavior: `src/i18n/index.ts`, `src/config/storage.ts`, `src/components/layout/AppHeader.tsx`.
- Existing test baseline: `tests/e2e/colors-tab.spec.ts`, `src/test/accessibility-controls.test.tsx`, `src/test/own-palette.test.ts`, `src/test/colors-data.test.ts`.
