import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import ColorsTab from "@/components/ColorsTab";
import {
  ColorAccessibilityProvider,
} from "@/components/accessibility/ColorAccessibilityProvider";
import AppHeader from "@/components/layout/AppHeader";
import AppTabBar from "@/components/layout/AppTabBar";
import AppTabContent from "@/components/layout/AppTabContent";
import { ACCESSIBILITY_SETTINGS_STORAGE_KEY } from "@/config/storage";
import { type AppTabId } from "@/config/tabs";
import { colorPalettes, importColorsFile } from "@/data/colors";
import { setLocale } from "@/i18n";

const TabBarHarness = () => {
  const [activeTab, setActiveTab] = useState<AppTabId>("solo");
  return (
    <>
      <AppTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <AppTabContent activeTab={activeTab} />
    </>
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

  it("marks selected language button with aria-pressed", () => {
    render(<AppHeader />);

    const enButton = screen.getByTestId("language-en");
    const ukButton = screen.getByTestId("language-uk");

    expect(enButton).toHaveAttribute("aria-pressed", "true");
    expect(ukButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(ukButton);

    expect(ukButton).toHaveAttribute("aria-pressed", "true");
    expect(enButton).toHaveAttribute("aria-pressed", "false");
  });

  it("uses tab roles and supports arrow-key navigation", async () => {
    render(<TabBarHarness />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBeGreaterThan(1);

    const firstTab = tabs[0];
    const secondTab = tabs[1];

    expect(firstTab).toHaveAttribute("aria-selected", "true");
    expect(secondTab).toHaveAttribute("aria-selected", "false");

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
      <ColorAccessibilityProvider>
        <AppHeader />
      </ColorAccessibilityProvider>,
    );

    fireEvent.click(screen.getByTestId("accessibility-menu-trigger"));

    const deutanButton = screen.getByTestId("accessibility-mode-deutan");
    const symbolsButton = screen.getByTestId("accessibility-symbols-toggle");
    const patternsButton = screen.getByTestId("accessibility-patterns-toggle");

    fireEvent.click(deutanButton);
    fireEvent.click(symbolsButton);
    fireEvent.click(patternsButton);

    expect(deutanButton).toHaveAttribute("aria-pressed", "true");
    expect(symbolsButton).toHaveAttribute("aria-pressed", "true");
    expect(patternsButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Report")).not.toBeInTheDocument();

    await waitFor(() =>
      expect(
        window.localStorage.getItem(ACCESSIBILITY_SETTINGS_STORAGE_KEY),
      ).toContain("\"visionMode\":\"deutan\""),
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
    expect(screen.getAllByTestId("swatch-symbol-overlay").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("swatch-pattern-overlay").length).toBeGreaterThan(0);
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
