# Satisfactory Tools

Satisfactory Tools is a small web app for browsing item color references for **Satisfactory**.  
It provides fast search/filtering and one-click HEX copy for use in signs, docs, and planning sheets.

## Live Site

https://ashbringer4eg.github.io/satisfactory-tools/

## Features

- Search colors by item name or HEX value
- Filter by item categories (ores, liquids, electronics, fuels, and more)
- Copy HEX values to clipboard with click feedback
- Copy click counters persisted in local storage
- Responsive layout with mobile-friendly filter panel

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS + Radix UI primitives
- Framer Motion
- Vitest + Testing Library
- Playwright (config scaffold included)

## Getting Started

### Prerequisites

- Node.js 22+ recommended
- pnpm 10+

### Install

```bash
pnpm install
```

### Run Development Server

```bash
pnpm dev
```

Default local URL: `http://localhost:8080`

### Build

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Available Scripts

- `pnpm dev` - start Vite dev server
- `pnpm build` - production build
- `pnpm build:dev` - build using development mode
- `pnpm preview` - preview production build locally
- `pnpm lint` - run ESLint
- `pnpm test` - run Vitest once
- `pnpm test:watch` - run Vitest in watch mode

## Deployment (GitHub Pages)

This project is configured for GitHub Pages via GitHub Actions.

- Vite base path is set to `/satisfactory-tools/` in `vite.config.ts`
- Workflow: `.github/workflows/deploy.yml`
- Deploy trigger: push to `main`
- Artifact path: `dist`

Check `https://{username}.github.io/satisfactory-tools/`

## Project Structure

```text
src/
  components/       UI components and feature components
  data/             Satisfactory color dataset
  pages/            Route pages
  test/             Unit test setup and examples. Trust me, they are here and exists :)
```

## Credits

Color list references are credited in-app:

u/Vencam - https://www.reddit.com/r/SatisfactoryGame/comments/154vft6/vencams_colour_list_25/

u/Squidcraft_101 - https://www.reddit.com/r/SatisfactoryGame/comments/1ft4tb8/i_made_a_list_of_item_colors_for_10/
