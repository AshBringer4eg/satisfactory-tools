import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

describe("mode routing", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    window.localStorage.clear();
  });

  it("opens mode paths and updates the path when mode changes", async () => {
    window.history.replaceState(null, "", "/duo/");
    const { default: App } = await import("@/App");
    render(<App />);

    expect(screen.getByRole("tab", { name: "DUO" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.click(screen.getByRole("tab", { name: "OWN" }));
    await waitFor(() => expect(window.location.pathname).toBe("/own/"));
    expect(screen.getByRole("tab", { name: "OWN" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  }, 15_000);

  it("uses DUO when URL has no mode path", async () => {
    const { default: App } = await import("@/App");
    render(<App />);

    expect(screen.getByRole("tab", { name: "DUO" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
