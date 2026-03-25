# Frontend Code Review — `satisfactory-tools`

Date: 2026-03-24  
Reviewer role: Senior Frontend Engineer  
Scope: **Frontend-only** (React app, client architecture, UI system, tests, tooling).

---

## A) Executive summary

### Overall code health score: **7.2 / 10**

### Biggest strengths

1. **Robust domain/data normalization layer** for color and own-palette imports (`src/data/colors.ts`, `src/data/own-palette.ts`) with meaningful validations and deterministic export shape.
2. **Good user-focused interaction coverage in E2E tests**, especially around clipboard behavior, tab modes, localStorage persistence, and own-palette workflows (`tests/e2e/colors-tab.spec.ts`).
3. **Localization architecture is simple and effective** with runtime locale switching + fallback behavior (`src/i18n/index.ts`).
4. **Consistent use of typed constants/config modules** (`src/config/storage.ts`, `src/config/tabs.ts`) reducing magic strings in core flow.
5. **Attention to a11y semantics in key UI controls** (tab roles, aria-pressed toggles, accessible names for swatches, keyboard arrows in tab bar).

### Top 5 risks

1. **Core feature components are oversized and highly stateful**, increasing regression risk and onboarding cost (`ColorsTab` ~667 LOC, `useOwnPaletteEditor` ~468 LOC).
2. **Stack mismatch vs stated architecture**: no actual usage of React Query, React Hook Form, or Zod in product flows; this can mislead contributors and fragment patterns.
3. **Main tab path does expensive filtering/sorting on every key stroke and copy-count update** with no debouncing/transition/virtualization strategy; scale risk if dataset grows.
4. **Accessibility gaps remain in mobile/filter interactions and status/feedback announcements** (no dialog focus assertions in tests, icon/toggle behavior not deeply tested).
5. **Testing strategy leans heavily on one large E2E spec file and light unit-level component tests**, which can become brittle and slow over time.

### Top 5 highest-value improvements

1. Split `ColorsTab` into focused hooks/components (`useColorFiltering`, `useCopyCountRanking`, `FiltersPanel`, `ColorGrid`).
2. Split `useOwnPaletteEditor` into reducer + focused command handlers (import/export/save/reset), with pure functions tested independently.
3. Introduce a unified form strategy for Own tab (RHF + Zod or keep custom, but standardize); eliminate duplicated validation messaging and centralize field errors.
4. Add query/data-layer conventions or explicitly remove unused async/state tooling from app expectations; document actual stack in README.
5. Re-balance tests: add targeted component interaction tests for Own edit rows/dialogs and reduce E2E duplication.

---

## B) Findings table

| Title                                                                            | Severity | Type                    | Why it matters                                                                                                                                   | Evidence                                                                                                                                  | File(s)                                                                                                 | Recommended fix                                                                                                                                      |
| -------------------------------------------------------------------------------- | -------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ColorsTab` is a monolith with mixed responsibilities                            | High     | Confirmed issue         | It combines filtering, persistence, animation orchestration, layout, and interaction handling. This increases cognitive load and defect surface. | Component has ~667 LOC, numerous `useState/useEffect/useMemo/useCallback`, floating animation orchestration + storage logic in same file. | `src/components/ColorsTab.tsx`                                                                          | Extract to feature hooks + presentational subcomponents. Keep animation logic isolated from filtering/storage.                                       |
| Own palette editor hook is too broad                                             | High     | Confirmed issue         | State transitions are hard to reason about and test. Side effects (localStorage, clipboard, dialog state, validation) are intertwined.           | `useOwnPaletteEditor` ~468 LOC, many states and handlers with broad return shape.                                                         | `src/components/tabs/own/use-own-palette-editor.ts`                                                     | Move to `useReducer` with typed actions; isolate IO operations into small service helpers.                                                           |
| Stated stack includes React Query / RHF / Zod, but app runtime does not use them | Medium   | Confirmed issue         | Misalignment causes confusion and architectural drift; contributors may assume patterns that don’t exist.                                        | No `@tanstack/react-query` usage; only RHF import appears in shadcn template file, not app features. No zod usage in src app logic.       | `package.json`, `src/components/ui/form.tsx`, `src/components/tabs/**`, `src/components/ColorsTab.tsx`  | Either adopt these libraries for real feature flows (forms/data state) or update docs/context to reflect actual architecture.                        |
| Filtering/ranking recomputation is synchronous per keystroke and count change    | Medium   | Improvement opportunity | Current dataset is manageable, but UX may degrade as records/features grow.                                                                      | `getFilteredColors` does filter + sort with `search.toLowerCase()` repeated and recomputed on each state update.                          | `src/components/ColorsTab.tsx`                                                                          | Precompute lowercased query once, memoize indexed fields, consider `useDeferredValue` for search text and/or list virtualization if growth expected. |
| Repeated hardcoded inline styles and duplicated desktop/mobile blocks            | Medium   | Confirmed issue         | Style drift risk and reduced maintainability.                                                                                                    | Many inline border/radius/shadow styles; footer duplicates almost entire markup for md vs mobile.                                         | `src/components/ColorSwatch.tsx`, `src/components/ColorsTab.tsx`, `src/components/layout/AppFooter.tsx` | Extract tokenized utility classes or shared style constants; reduce duplicated DOM structures with responsive utility composition.                   |
| Accessibility coverage is partial (good base, missing deeper checks)             | Medium   | Improvement opportunity | Core semantics are present, but regressions could slip in for dialogs, focus trap, keyboard-only flows.                                          | Unit a11y tests verify limited controls only; no explicit focus assertions for dialogs/sheet.                                             | `src/test/accessibility-controls.test.tsx`, `tests/e2e/colors-tab.spec.ts`                              | Add tests for focus management on `Dialog`/`Sheet`, Escape close behavior, and keyboard navigation in own-editor controls.                           |
| Single large E2E file mixes many concerns and duplicates test patterns           | Medium   | Confirmed issue         | Harder maintenance, slower debugging, increased flake risk in future.                                                                            | One spec file ~653 LOC covering SOLO/DUO/OWN + locale-dependent selectors.                                                                | `tests/e2e/colors-tab.spec.ts`                                                                          | Split into domain specs (`solo.spec.ts`, `duo.spec.ts`, `own.spec.ts`, `i18n.spec.ts`) with shared helpers/fixtures.                                 |
| Example test adds no product confidence                                          | Low      | Confirmed issue         | Non-informative passing tests can mask meaningful coverage gaps.                                                                                 | `expect(true).toBe(true)` only.                                                                                                           | `src/test/example.test.ts`                                                                              | Replace with a smoke test of app render/routing or remove.                                                                                           |
| Router setup is clean but minimal; no route-level error boundaries               | Low      | Improvement opportunity | As app grows, route isolation and failure handling will matter.                                                                                  | Only `/` and `*` routes, no route errorElement/loaders.                                                                                   | `src/App.tsx`, `src/pages/NotFound.tsx`                                                                 | Introduce layout route and route-level error boundaries when adding more pages/async data.                                                           |
| Unused generated shadcn UI surface may increase maintenance noise                | Low      | Needs verification      | Not inherently wrong, but many unused UI primitives can burden linting, dependency upgrades, and code search clarity.                            | Large `src/components/ui/*` set appears mostly unused by app.                                                                             | `src/components/ui/*`                                                                                   | Verify intended component library strategy; prune or move unused primitives to separate package/folder.                                              |
| Client-side security posture is generally safe                                   | Low      | Improvement opportunity | No dangerous HTML injection observed; still worth codifying constraints for future additions.                                                    | No `dangerouslySetInnerHTML`; external links include `rel="noopener noreferrer"`; localStorage use is non-sensitive app state.            | `src/components/layout/AppFooter.tsx`, `src/components/**`, `src/pages/**`                              | Add lint rule/checklist for unsafe HTML rendering and URL sanitization for future user-generated content features.                                   |

---

## C) Detailed review by category

## 1. Project overview

### Structure and entry points

- Entry: `src/main.tsx` mounts `App` directly.
- App shell + routing in `src/App.tsx` using `createBrowserRouter` with basename from Vite base path.
- Pages: `src/pages/Index.tsx` (main app), `src/pages/NotFound.tsx`.
- Feature-heavy components live under `src/components`, with `tabs/own` containing the own-palette editor logic.
- Data/domain logic is centralized in `src/data/colors.ts` and `src/data/own-palette.ts`.
- i18n runtime store in `src/i18n/index.ts` with JSON locale files.

### Route structure

- Two routes only: `/` and catch-all `*`.
- Tab navigation is in-page state, not router-based sections.

### Shared UI/component patterns

- Strong use of shadcn/Radix primitives for table, input, select, dialog, sheet.
- Heavy custom-tailwind styling layered on top of primitives.
- Some duplicated UI layout per breakpoint (footer and filter structures).

### Hooks/utilities organization

- Feature logic mostly lives in component files and one large hook (`use-own-palette-editor.ts`).
- Utilities for own tab split into `utils.ts` + `types.ts` is a good pattern.

### Config structure

- `vite.config.ts` defines base by mode and injects `__APP_VERSION__`.
- `tsconfig.app.json` is strict; aliases are set.
- `eslint.config.js` is present and lightweight; no unused vars enforced.

### Test setup

- Unit/integration: Vitest + Testing Library under `src/test`.
- E2E: Playwright with dev server on 4173 and clipboard mocking in spec.

### Linting/type-check setup

- `pnpm lint` and `pnpm tsc` are configured and pass.
- TS strict mode is enabled in app config.

---

## 2. Frontend architecture

### Good patterns

- Data normalization and schema-like runtime checking are centralized in data modules.
- Storage keys and tab definitions are extracted to config files.
- Locale handling is framework-agnostic and avoids context-provider overuse.

### Issues / opportunities

- **UI + domain + animation coupling** is high in `ColorsTab`.
- Own-tab editing flow has broad responsibility spread across `OwnTab` and `useOwnPaletteEditor`.
- Reuse of table row editor (`OwnEditRow`) is good, but parent orchestrator remains bulky.
- Many generated `ui` primitives likely not used in app flow (needs verification if intentionally kept as design system seed).

---

## 3. React quality

### Strengths

- `useEffect` cleanup is generally handled correctly (timeouts/events).
- Appropriate use of `useMemo/useCallback` in several hotspots.
- Tab keyboard behavior is intentionally implemented.

### Concerns

- Derived structures are still recomputed in render paths frequently (`previousIndexByName` computed outside memo pattern).
- Some handlers and state transitions in `ColorsTab` are difficult to reason about due to animation+state queue interaction.
- `NotFound` logs to `console.error` on mount; noisy for expected user navigation edge cases.

---

## 4. TypeScript quality

### Strengths

- Good use of literal unions (`AppTabId`, category codes).
- Runtime parsing functions defensively validate unknown input.
- Type names are mostly descriptive and domain-aligned.

### Concerns

- Some broad casts (`as LocaleTree`) and string-based key access are unavoidable but brittle; test coverage compensates somewhat.
- `@typescript-eslint/no-unused-vars` is globally disabled, reducing signal for dead code.
- Strong TS exists, but architecture-level typing could improve with reducer action unions in own editor flow.

---

## 5. Data fetching / async state (React Query scope)

### Confirmed state

- No React Query usage in app feature code.
- No async server-state architecture is present (expected for static/local app).

### Recommendation

- If this remains a static/local-first app, remove mention of React Query from architecture context/docs to reduce conceptual noise.
- If remote sync/import sources are planned, introduce query-key conventions early.

---

## 6. Forms and validation

### Strengths

- Own palette validation is comprehensive and explicit in domain helpers.
- Import/export pipeline has clear parse -> validate -> normalize stages.

### Concerns

- Form state is fully manual; RHF/Zod are not used for feature forms despite stated stack.
- Validation messages are aggregate strings; no field-level structured error mapping for row cells.
- Duplicate field-state logic can grow quickly as own-editor complexity increases.

---

## 7. Routing and navigation

### Strengths

- Simple and clean for current app size.
- Router basename handling is correctly wired for GitHub Pages.

### Concerns

- Tab state is persisted in localStorage and independent of URL; deep linking to tab modes is unavailable.
- As features grow, URL-addressable tabs/pages may become necessary.

---

## 8. Accessibility

### Positive observations

- Tablist/tabpanel roles + aria relationships exist.
- Swatch buttons and icon actions generally have accessible names.
- Search and category toggles include labels and state indicators.

### Gaps

- Limited automated testing around dialog focus management and keyboard trap behavior.
- Some status updates are visually present but not consistently tied to robust live-region patterns in all flows.
- Duplicated mobile/desktop markup increases risk of a11y divergence.

---

## 9. Client-side security

### Confirmed positives

- No `dangerouslySetInnerHTML` observed.
- External links are hardened with `rel="noopener noreferrer"`.
- localStorage stores non-sensitive app preferences/counters/palette data.

### Watch-outs

- Keep import parsing strict (already strong) and continue rejecting malformed payloads.
- If future user-generated rich text is added, enforce sanitization guardrails.

---

## 10. Performance

### Strengths

- Dataset operations are memoized in key areas.
- Animations are coordinated thoughtfully with Framer Motion.

### Risks

- Heavy list render + animation + sorting in one component can become expensive.
- No virtualization strategy if data volume grows.
- Frequent state updates (`pendingCopyCounts`, moving/floating states) may trigger broad re-renders.

---

## 11. UI system consistency (shadcn/Radix/Tailwind)

### Strengths

- Good use of primitives for core controls (table/select/dialog/sheet).
- Consistent mono-terminal aesthetic.

### Issues

- Inline styles and arbitrary literal values are frequent (radius/border/shadow repeated).
- Desktop/mobile duplicated blocks reduce consistency guarantees.
- Mixed custom button markup and shadcn `Button` usage in nearby contexts.

---

## 12. Testing quality

### Strengths

- Valuable E2E scenarios covering real workflows and persistence.
- Locale tests and palette normalization tests are practical.

### Gaps

- Component-level interaction tests for `OwnEditRow`, `OwnEditDialogs`, and advanced `ColorsTab` state transitions are limited.
- Example placeholder test should be replaced.
- E2E monolith should be split for maintainability.

---

## D) Quick wins

1. Replace `src/test/example.test.ts` with a meaningful app render smoke test.
2. Extract repeated inline styles in `ColorSwatch`/`ColorsTab` into utility classes/constants.
3. Split Playwright tests into multiple specs by feature area.
4. Enable `@typescript-eslint/no-unused-vars` with pragmatic ignore patterns.
5. Add a11y tests for dialog focus and keyboard close behavior.

---

## E) Refactor candidates (priority order)

1. `src/components/ColorsTab.tsx` — highest complexity and multi-responsibility.
2. `src/components/tabs/own/use-own-palette-editor.ts` — orchestration + side effects + validation lifecycle.
3. `src/components/layout/AppFooter.tsx` — duplication and maintainability.
4. `tests/e2e/colors-tab.spec.ts` — split to reduce brittleness and improve debuggability.
5. `src/components/ColorSwatch.tsx` — style/token extraction and subcomponent split for solo/duo variants.

---

## F) Final verdict

### Is the codebase healthy enough to scale?

**Yes, with caveats.** It is healthy for small-to-medium feature growth and has strong domain validation and useful E2E coverage.

### What would become painful first?

- Maintaining and extending monolithic UI/state modules (`ColorsTab`, own-editor hook).
- Keeping tests fast and stable with a single large E2E spec.
- Ensuring consistent UI/a11y behavior across duplicated responsive markup.

### What should be fixed before major new features?

1. Decompose `ColorsTab` and `useOwnPaletteEditor`.
2. Clarify/standardize form strategy (manual vs RHF/Zod) and stack documentation.
3. Improve test structure (split E2E + add focused component interaction tests).
4. Reduce style duplication and centralize design tokens/utilities.
5. Add deeper accessibility regression checks for modal/sheet interactions.

---

## Appendix — Validation checks run during review

- `pnpm lint` ✅
- `pnpm tsc` ✅
- `pnpm test:unit` ✅ (23 tests passed)
