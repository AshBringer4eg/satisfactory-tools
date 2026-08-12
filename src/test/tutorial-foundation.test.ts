import { describe, expect, it } from "vitest";
import { tutorialActionMatches } from "@/tutorials/actions";
import { tutorialCatalog } from "@/tutorials/catalog";
import {
  getTutorialIdFromSearch,
  getTutorialUrl,
  removeTutorialQuery,
} from "@/tutorials/routing";

describe("tutorial foundation", () => {
  it("defines four route-backed tutorials with typed steps", () => {
    expect(Object.keys(tutorialCatalog)).toEqual([
      "swatches",
      "filtering",
      "harmony",
      "accessibility",
    ]);
    expect(tutorialCatalog.harmony.mode).toBe("duo");
    expect(tutorialCatalog.harmony.steps.map((step) => step.id)).toEqual([
      "harmony-open",
      "harmony-mode",
      "harmony-copy",
      "harmony-paste",
    ]);
    expect(tutorialCatalog.accessibility.steps[0].requirement).toEqual({
      type: "accessibility-drawer",
      phase: "end",
    });
    expect(tutorialCatalog.accessibility.steps.at(-1)?.target).toBe(
      "swatches-grid",
    );
  });

  it("preserves unrelated query parameters and hash when consuming tutorial query", () => {
    const search = "?view=compact&tutorial=filtering&debug=1";
    expect(getTutorialIdFromSearch(search)).toBe("filtering");
    expect(removeTutorialQuery(search)).toBe("?view=compact&debug=1");
    expect(getTutorialUrl("harmony", "uk", search, "#colors")).toBe(
      "/uk/duo/?view=compact&tutorial=harmony&debug=1#colors",
    );
  });

  it("matches required actions without accepting unrelated actions", () => {
    expect(
      tutorialActionMatches(
        { type: "copy", zone: "primary" },
        { type: "copy", zone: "primary" },
      ),
    ).toBe(true);
    expect(
      tutorialActionMatches(
        { type: "copy", zone: "secondary" },
        { type: "copy", zone: "primary" },
      ),
    ).toBe(false);
    expect(
      tutorialActionMatches(
        { type: "search", value: "iron" },
        { type: "search", minLength: 2 },
      ),
    ).toBe(true);
    expect(
      tutorialActionMatches(
        { type: "search", value: "c" },
        { type: "search", minLength: 1, expectedValue: "packaged" },
      ),
    ).toBe(false);
    expect(
      tutorialActionMatches(
        { type: "search", value: "packaged" },
        { type: "search", minLength: 1, expectedValue: "packaged" },
      ),
    ).toBe(true);
    expect(
      tutorialActionMatches(
        { type: "accessibility-drawer", phase: "start" },
        { type: "accessibility-drawer", phase: "end" },
      ),
    ).toBe(false);
    expect(
      tutorialActionMatches(
        { type: "accessibility-drawer", phase: "end" },
        { type: "accessibility-drawer", phase: "end" },
      ),
    ).toBe(true);
  });
});
