import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ColorsTab from "@/components/ColorsTab";
import { colorPalettes } from "@/data/colors";
import { setLocale } from "@/i18n";

const STORAGE_KEY = "test-copy-counts";

describe("ColorsTab copy count behavior", () => {
  beforeEach(() => {
    act(() => {
      setLocale("en");
    });
    window.localStorage.clear();
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("queues visual count on click and persists only after mouse leave flush", async () => {
    render(
      <ColorsTab
        palette={colorPalettes.default}
        swatchMode="solo"
        copyCountsStorageKey={STORAGE_KEY}
      />,
    );

    const swatch = screen.getByRole("button", {
      name: /Copy hex code .* for Turbofuel$/i,
    });

    await waitFor(() => expect(swatch).toHaveTextContent("0x"));
    fireEvent.click(swatch);
    await waitFor(() => expect(swatch).toHaveTextContent("1x"));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("{}");

    fireEvent.mouseLeave(swatch);
    await waitFor(() =>
      expect(window.localStorage.getItem(STORAGE_KEY)).toContain(
        "\"COLOR_TURBOFUEL\":1",
      ),
    );
  });

  it("resets queued and persisted counts when reset event is dispatched", async () => {
    render(
      <ColorsTab
        palette={colorPalettes.default}
        swatchMode="solo"
        copyCountsStorageKey={STORAGE_KEY}
      />,
    );

    const swatch = screen.getByRole("button", {
      name: /Copy hex code .* for Turbofuel$/i,
    });

    fireEvent.click(swatch);
    await waitFor(() => expect(swatch).toHaveTextContent("1x"));
    fireEvent.mouseLeave(swatch);
    await waitFor(() =>
      expect(window.localStorage.getItem(STORAGE_KEY)).toContain(
        "\"COLOR_TURBOFUEL\":1",
      ),
    );

    act(() => {
      window.dispatchEvent(new Event("ficsit:reset-copy-counters"));
    });

    await waitFor(() => {
      const updatedSwatch = screen.getByRole("button", {
        name: /Copy hex code .* for Turbofuel$/i,
      });
      expect(updatedSwatch).toHaveTextContent("0x");
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe("{}");
    });
  });
});
