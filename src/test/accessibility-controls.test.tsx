import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useState } from "react";
import ColorsTab from "@/components/ColorsTab";
import AppHeader from "@/components/layout/AppHeader";
import AppTabBar from "@/components/layout/AppTabBar";
import { type AppTabId } from "@/config/tabs";
import { colorPalettes } from "@/data/colors";
import { setLocale } from "@/i18n";

const TabBarHarness = () => {
  const [activeTab, setActiveTab] = useState<AppTabId>("solo");
  return <AppTabBar activeTab={activeTab} onTabChange={setActiveTab} />;
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

  it("uses tab roles and supports arrow-key navigation", () => {
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
});
