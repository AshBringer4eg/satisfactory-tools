import { describe, expect, it } from "vitest";
import {
  createDefaultOwnPalette,
  createOwnPaletteDraftRowsFromPalette,
  getOwnPaletteKnownRecord,
  getOwnPaletteKnownCodeOptions,
} from "@/data/own-palette";
import {
  createOwnPaletteEditorState,
  ownPaletteEditorReducer,
  type OwnPaletteEditorState,
} from "@/components/tabs/own/own-palette-editor.reducer";
import type { OwnInitialState } from "@/components/tabs/own/types";
import { OWN_CUSTOM_CODE_SENTINEL } from "@/components/tabs/own/utils";

const createTestState = (): OwnPaletteEditorState => {
  const palette = createDefaultOwnPalette();
  const initial: OwnInitialState = {
    savedPalette: palette,
    savedPaletteFile: null,
    draftRows: createOwnPaletteDraftRowsFromPalette(palette).slice(0, 2),
    loadErrors: [],
  };

  return createOwnPaletteEditorState(initial);
};

describe("own palette editor reducer", () => {
  it("clears transient edit statuses on draft field updates", () => {
    const state = createTestState();
    const rowId = state.draftRows[0].id;

    const next = ownPaletteEditorReducer(
      {
        ...state,
        importErrors: ["import error"],
        saveErrors: ["save error"],
        statusMessage: "old status",
      },
      {
        type: "update_draft_field",
        rowId,
        field: "hex",
        value: "#123456",
      },
    );

    expect(next.draftRows[0].hex).toBe("#123456");
    expect(next.importErrors).toEqual([]);
    expect(next.saveErrors).toEqual([]);
    expect(next.statusMessage).toBeNull();
  });

  it("removing a row also closes its open code selector", () => {
    const state = createTestState();
    const removedRowId = state.draftRows[0].id;

    const next = ownPaletteEditorReducer(
      {
        ...state,
        openCodeSelectRowId: removedRowId,
        importErrors: ["import error"],
        saveErrors: ["save error"],
        statusMessage: "old status",
      },
      { type: "remove_row", rowId: removedRowId },
    );

    expect(next.draftRows.some((row) => row.id === removedRowId)).toBe(false);
    expect(next.openCodeSelectRowId).toBeNull();
    expect(next.importErrors).toEqual([]);
    expect(next.saveErrors).toEqual([]);
    expect(next.statusMessage).toBeNull();
  });

  it("known code selection hydrates row values and custom sentinel unsets code", () => {
    const state = createTestState();
    const rowId = state.draftRows[0].id;
    const knownCode = getOwnPaletteKnownCodeOptions()[0].code;
    const knownRecord = getOwnPaletteKnownRecord(knownCode);

    expect(knownRecord).toBeDefined();

    const withKnownCode = ownPaletteEditorReducer(
      {
        ...state,
        draftRows: [
          {
            ...state.draftRows[0],
            selectedCode: null,
            defaultName: "Custom Name",
            hex: "#010203",
            secondaryColor: "#040506",
          },
          ...state.draftRows.slice(1),
        ],
      },
      { type: "set_known_code", rowId, rawValue: knownCode },
    );

    expect(withKnownCode.draftRows[0].selectedCode).toBe(knownCode);
    expect(withKnownCode.draftRows[0].defaultName).toBe(knownRecord?.defaultName);
    expect(withKnownCode.draftRows[0].hex).toBe(knownRecord?.hex);
    expect(withKnownCode.draftRows[0].secondaryColor).toBe(
      knownRecord?.secondaryColor,
    );

    const withCustomCode = ownPaletteEditorReducer(withKnownCode, {
      type: "set_known_code",
      rowId,
      rawValue: OWN_CUSTOM_CODE_SENTINEL,
    });

    expect(withCustomCode.draftRows[0].selectedCode).toBeNull();
  });

  it("apply_saved_palette clears load/import/save errors and can reset import text", () => {
    const state = createTestState();
    const nextPalette = createDefaultOwnPalette();
    const nextDraftRows = createOwnPaletteDraftRowsFromPalette(nextPalette).slice(
      0,
      1,
    );

    const next = ownPaletteEditorReducer(
      {
        ...state,
        loadErrors: ["load error"],
        importErrors: ["import error"],
        saveErrors: ["save error"],
        importBase64: "stale-base64",
        openCodeSelectRowId: state.draftRows[0].id,
      },
      {
        type: "apply_saved_palette",
        savedPalette: nextPalette,
        savedPaletteFile: null,
        draftRows: nextDraftRows,
        statusMessage: "saved",
        clearImportBase64: true,
      },
    );

    expect(next.loadErrors).toEqual([]);
    expect(next.importErrors).toEqual([]);
    expect(next.saveErrors).toEqual([]);
    expect(next.openCodeSelectRowId).toBeNull();
    expect(next.importBase64).toBe("");
    expect(next.statusMessage).toBe("saved");
  });
});
