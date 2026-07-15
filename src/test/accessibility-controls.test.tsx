import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { MemoryRouter } from "react-router-dom";
import ColorsTab from "@/components/ColorsTab";
import { ColorAccessibilityProvider } from "@/components/accessibility/ColorAccessibilityProvider";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import AppTabBar from "@/components/layout/AppTabBar";
import AppTabContent from "@/components/layout/AppTabContent";
import OwnTab from "@/components/tabs/OwnTab";
import ColorHarmonyDialog from "@/components/tabs/own/ColorHarmonyDialog";
import { ACCESSIBILITY_SETTINGS_STORAGE_KEY } from "@/config/storage";
import { type AppTabId } from "@/config/tabs";
import { colorPalettes, importColorsFile } from "@/data/colors";
import { setLocale } from "@/i18n";
import { simulateHexColor } from "@/lib/color-accessibility";
import { getHarmonyTextColor } from "@/lib/color-harmony";

const TabBarHarness = () => {
  const [activeTab, setActiveTab] = useState<AppTabId>("solo");
  return (
    <MemoryRouter>
      <AppTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <AppTabContent activeTab={activeTab} />
    </MemoryRouter>
  );
};

describe("accessibility controls", () => {
  beforeEach(() => {
    act(() => {
      setLocale("en");
    });
    window.localStorage.clear();
  });

  afterEach(() => {
    act(() => {
      setLocale("en");
    });
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("marks selected language link and exposes localized URLs", () => {
    render(<AppHeader />, { wrapper: MemoryRouter });

    const enButton = screen.getByTestId("language-en");
    const ukButton = screen.getByTestId("language-uk");

    expect(enButton).toHaveAttribute("aria-current", "page");
    expect(enButton).toHaveAttribute("href", "/");
    expect(ukButton).toHaveAttribute("href", "/uk/");

    fireEvent.click(ukButton);

    expect(ukButton).toHaveAttribute("aria-current", "page");
    expect(enButton).not.toHaveAttribute("aria-current");
  });

  it("links footer support buttons to Buy Me a Coffee", () => {
    render(<AppFooter onResetCounters={() => undefined} />);

    const supportLinks = screen.getAllByRole("link", {
      name: /Support Satisfactory Color Tools on Buy Me a Coffee/i,
    });
    expect(supportLinks).toHaveLength(2);
    for (const link of supportLinks) {
      expect(link).toHaveAttribute(
        "href",
        "https://buymeacoffee.com/WMtWyZRqFf",
      );
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("uses tab roles and supports arrow-key navigation", async () => {
    render(<TabBarHarness />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBeGreaterThan(1);

    const firstTab = tabs[0];
    const secondTab = tabs[1];

    expect(firstTab).toHaveAttribute("aria-selected", "true");
    expect(secondTab).toHaveAttribute("aria-selected", "false");
    expect(firstTab).toHaveAttribute("href", "/solo/");
    expect(secondTab).toHaveAttribute("href", "/duo/");

    firstTab.focus();
    fireEvent.keyDown(firstTab, { key: "ArrowRight" });

    expect(secondTab).toHaveAttribute("aria-selected", "true");
    expect(firstTab).toHaveAttribute("aria-selected", "false");
    expect(secondTab).toHaveAttribute("aria-controls", "app-tabpanel-duo");
    await waitFor(() =>
      expect(screen.getByRole("tabpanel")).toHaveAttribute(
        "aria-labelledby",
        "app-tab-duo",
      ),
    );
    expect(
      screen.getByRole("heading", {
        name: "Satisfactory Primary & Secondary Color Codes",
      }),
    ).toBeVisible();
  });

  it("copies preview links for the active app mode", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(<TabBarHarness />);

    fireEvent.click(
      screen.getByRole("button", { name: /Copy SOLO mode preview link/i }),
    );
    await waitFor(() =>
      expect(writeText).toHaveBeenLastCalledWith(
        expect.stringMatching(/\/solo\/$/),
      ),
    );

    fireEvent.click(screen.getByRole("tab", { name: "DUO" }));
    fireEvent.click(
      screen.getByRole("button", { name: /Copy DUO mode preview link/i }),
    );
    await waitFor(() =>
      expect(writeText).toHaveBeenLastCalledWith(
        expect.stringMatching(/\/duo\/$/),
      ),
    );
  });

  it("provides accessible search label and category toggle state", () => {
    const palette = colorPalettes.default;
    const firstCategoryCode = palette.categoryCodes[0];

    render(<ColorsTab palette={palette} swatchMode="solo" />);

    const [searchInput] = screen.getAllByTestId("colors-search-input");
    expect(searchInput).toHaveAccessibleName();

    const categoryToggle = screen.getByTestId(
      `category-toggle-${firstCategoryCode}`,
    );
    expect(categoryToggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(categoryToggle);

    expect(categoryToggle).toHaveAttribute("aria-pressed", "true");
  });

  it("opens palette accessibility controls and persists settings", async () => {
    render(
      <MemoryRouter>
        <ColorAccessibilityProvider>
          <AppHeader />
        </ColorAccessibilityProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("accessibility-menu-trigger"));

    const deutanButton = screen.getByTestId("accessibility-mode-deutan");
    const symbolsButton = screen.getByTestId("accessibility-symbols-toggle");
    const patternsButton = screen.getByTestId("accessibility-patterns-toggle");

    expect(screen.getByTestId("accessibility-menu-content")).toHaveClass(
      "w-[min(92vw,384px)]",
      "sm:max-w-[384px]",
    );
    expect(screen.getByTestId("accessibility-mode-normal")).toHaveClass(
      "bg-[length:100%_100%]",
      "bg-no-repeat",
      "font-black",
      "[text-shadow:0_1px_1px_rgba(0,0,0,1),0_0_2px_rgba(0,0,0,1),1px_0_0_rgba(0,0,0,0.85),-1px_0_0_rgba(0,0,0,0.85)]",
    );
    expect(
      within(screen.getByTestId("accessibility-mode-normal")).getByTestId(
        "accessibility-selected-mode-indicator",
      ),
    ).toBeInTheDocument();
    expect(
      within(deutanButton).queryByTestId(
        "accessibility-selected-mode-indicator",
      ),
    ).not.toBeInTheDocument();

    fireEvent.click(deutanButton);
    fireEvent.click(symbolsButton);
    fireEvent.click(patternsButton);

    expect(deutanButton).toHaveAttribute("aria-pressed", "true");
    expect(
      within(deutanButton).getByTestId("accessibility-selected-mode-indicator"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("accessibility-mode-normal")).queryByTestId(
        "accessibility-selected-mode-indicator",
      ),
    ).not.toBeInTheDocument();
    expect(symbolsButton).toHaveAttribute("aria-pressed", "true");
    expect(patternsButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Report")).not.toBeInTheDocument();

    await waitFor(() =>
      expect(
        window.localStorage.getItem(ACCESSIBILITY_SETTINGS_STORAGE_KEY),
      ).toContain('"visionMode":"deutan"'),
    );
  });

  it("keeps original hex copy values while assist rendering is enabled", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    window.localStorage.setItem(
      ACCESSIBILITY_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        visionMode: "deutan",
        showSymbols: true,
        showPatterns: true,
      }),
    );

    render(
      <ColorAccessibilityProvider>
        <ColorsTab palette={colorPalettes.default} swatchMode="solo" />
      </ColorAccessibilityProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Copy hex code #d4292e for Turbofuel/i,
      }),
    );

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("#d4292e"));
    expect(
      screen.getAllByTestId("swatch-symbol-overlay").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByTestId("swatch-pattern-overlay").length,
    ).toBeGreaterThan(0);
  });

  it("applies assist rendering to OWN edit picker trigger swatches", async () => {
    window.localStorage.setItem(
      ACCESSIBILITY_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        visionMode: "deutan",
        showSymbols: true,
        showPatterns: true,
      }),
    );

    render(
      <QueryClientProvider client={new QueryClient()}>
        <ColorAccessibilityProvider>
          <OwnTab />
        </ColorAccessibilityProvider>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "EDIT" }));

    const primaryInput = screen.getAllByTestId("own-row-primary-input")[0];
    const secondaryInput = screen.getAllByTestId("own-row-secondary-input")[0];
    const primaryPickerTrigger = screen.getAllByTestId(
      "own-row-primary-input-picker-trigger",
    )[0];
    const secondaryPickerTrigger = screen.getAllByTestId(
      "own-row-secondary-input-picker-trigger",
    )[0];
    const primaryPickerSwatch = within(primaryPickerTrigger).getByTestId(
      "own-row-primary-input-picker-selected-swatch",
    );
    const secondaryPickerSwatch = within(secondaryPickerTrigger).getByTestId(
      "own-row-secondary-input-picker-selected-swatch",
    );

    fireEvent.change(primaryInput, { target: { value: "#00ff00" } });
    fireEvent.change(secondaryInput, { target: { value: "#0000ff" } });

    expect(primaryPickerSwatch).toHaveStyle({
      backgroundColor: simulateHexColor("#00ff00", "deutan"),
    });
    expect(secondaryPickerSwatch).toHaveStyle({
      backgroundColor: simulateHexColor("#0000ff", "deutan"),
    });
    expect(
      within(primaryPickerTrigger).getByTestId("swatch-symbol-overlay"),
    ).toBeInTheDocument();
    expect(
      within(primaryPickerTrigger).getByTestId("swatch-pattern-overlay"),
    ).toBeInTheDocument();
    expect(
      within(primaryPickerTrigger).getByTestId(
        "own-row-primary-input-picker-selected-swatch-frame",
      ),
    ).toHaveClass("size-8");

    fireEvent.change(secondaryInput, { target: { value: "" } });
    await waitFor(() =>
      expect(secondaryPickerSwatch).toHaveStyle({
        backgroundColor: simulateHexColor("#00ff00", "deutan"),
      }),
    );
  }, 10_000);

  it("keeps real OWN picker values while filtering picker controls for colorblind mode", async () => {
    window.localStorage.setItem(
      ACCESSIBILITY_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        visionMode: "deutan",
        showSymbols: false,
        showPatterns: false,
      }),
    );

    render(
      <QueryClientProvider client={new QueryClient()}>
        <ColorAccessibilityProvider>
          <OwnTab />
        </ColorAccessibilityProvider>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "EDIT" }));

    const primaryInput = screen.getAllByTestId("own-row-primary-input")[0];
    const realHex = "#656f8c";
    const editedHex = "#112233";

    fireEvent.change(primaryInput, { target: { value: realHex } });
    fireEvent.click(
      screen.getAllByTestId("own-row-primary-input-picker-trigger")[0],
    );

    const selectedSwatch = screen.getAllByTestId(
      "own-row-primary-input-picker-selected-swatch",
    )[0];
    const colorArea = await screen.findByTestId(
      "own-row-primary-input-picker-area",
    );
    const hueTrack = screen.getByTestId(
      "own-row-primary-input-picker-hue-track",
    );

    expect(selectedSwatch).toHaveStyle({
      backgroundColor: simulateHexColor(realHex, "deutan"),
    });
    expect(colorArea.style.filter).toMatch(/^url\(#own-color-picker-filter-/);
    expect(hueTrack.style.filter).toMatch(/^url\(#own-color-picker-filter-/);
    expect(
      screen.queryByTestId("own-row-primary-input-picker-option-656f8c"),
    ).not.toBeInTheDocument();

    const hexInput = screen.getByTestId(
      "own-row-primary-input-picker-hex-input",
    ) as HTMLInputElement;
    expect(hexInput.value.toLowerCase()).toBe(realHex);

    fireEvent.change(hexInput, { target: { value: editedHex } });
    fireEvent.blur(hexInput);

    await waitFor(() => expect(primaryInput).toHaveValue(editedHex));
    await waitFor(() =>
      expect(selectedSwatch).toHaveStyle({
        backgroundColor: simulateHexColor(editedHex, "deutan"),
      }),
    );
  });

  it("simulates Harmony samples with overlays while copying original generated hex", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    window.localStorage.setItem(
      ACCESSIBILITY_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        visionMode: "deutan",
        showSymbols: true,
        showPatterns: true,
      }),
    );

    render(
      <ColorAccessibilityProvider>
        <ColorHarmonyDialog
          open
          onOpenChange={() => undefined}
          initialPrimaryHex="#00ff00"
        />
      </ColorAccessibilityProvider>,
    );

    const anchorSwatch = screen.getAllByTestId("harmony-swatch")[0];
    const displayHex = simulateHexColor("#00FF00", "deutan");
    expect(anchorSwatch).toHaveStyle({
      backgroundColor: displayHex,
      color: getHarmonyTextColor(displayHex),
    });
    expect(anchorSwatch).toHaveTextContent("00FF00");
    expect(
      within(anchorSwatch).getByTestId("swatch-symbol-overlay"),
    ).toBeInTheDocument();
    expect(
      within(anchorSwatch).getByTestId("swatch-pattern-overlay"),
    ).toBeInTheDocument();

    fireEvent.click(anchorSwatch);
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("#00FF00"));
  });

  it("copies mode-specific Discord share links from built-in swatches", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    const { rerender } = render(
      <ColorsTab palette={colorPalettes.default} swatchMode="solo" />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Copy Discord share link for Turbofuel/i,
      }),
    );

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        expect.stringMatching(/\/share\/COLOR_TURBOFUEL\/one\.html$/),
      ),
    );

    rerender(<ColorsTab palette={colorPalettes.default} swatchMode="duo" />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Copy Discord share link for Turbofuel/i,
      }),
    );

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        expect.stringMatching(/\/share\/COLOR_TURBOFUEL\/two\.html$/),
      ),
    );
  });

  it("does not show Discord share links when static previews are disabled", () => {
    render(
      <ColorsTab
        palette={colorPalettes.default}
        swatchMode="duo"
        shareLinksEnabled={false}
      />,
    );

    expect(
      screen.queryByRole("button", {
        name: /Copy Discord share link for Turbofuel/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("does not show Discord share links for colors without generated static pages", () => {
    const customPalette = importColorsFile({
      schemaVersion: 1,
      paletteCode: "custom-share-test",
      colors: [
        {
          code: "COLOR_LOCAL_ONLY",
          defaultName: "Local Only",
          hex: "#123456",
          secondaryColor: "#654321",
          categories: ["CATEGORY_OTHER"],
        },
      ],
    });

    render(<ColorsTab palette={customPalette} swatchMode="duo" />);

    expect(
      screen.queryByRole("button", {
        name: /Copy Discord share link for Local Only/i,
      }),
    ).not.toBeInTheDocument();
  });
});
