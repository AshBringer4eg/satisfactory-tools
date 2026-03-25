import type { ColorsFile, SatisfactoryPalette } from "@/data/colors";
import {
  createEmptyOwnPaletteDraftRow,
  getOwnPaletteKnownRecord,
  type OwnPaletteDraftRow,
} from "@/data/own-palette";
import type { OwnEditableField, OwnInitialState, OwnMode } from "./types";
import { OWN_CUSTOM_CODE_SENTINEL } from "./utils";

export type OwnPaletteEditorState = {
  activeMode: OwnMode;
  savedPalette: SatisfactoryPalette;
  savedPaletteFile: ColorsFile | null;
  draftRows: OwnPaletteDraftRow[];
  loadErrors: string[];
  importBase64: string;
  importErrors: string[];
  saveErrors: string[];
  statusMessage: string | null;
  openCodeSelectRowId: string | null;
  isImportDialogOpen: boolean;
  isExportDialogOpen: boolean;
};

export type OwnPaletteEditorAction =
  | { type: "set_active_mode"; mode: OwnMode }
  | {
      type: "update_draft_field";
      rowId: string;
      field: OwnEditableField;
      value: string;
    }
  | { type: "set_code_select_open"; rowId: string; isOpen: boolean }
  | { type: "set_known_code"; rowId: string; rawValue: string }
  | { type: "add_row" }
  | { type: "remove_row"; rowId: string }
  | { type: "set_import_base64"; value: string }
  | { type: "set_import_dialog_open"; isOpen: boolean }
  | { type: "set_export_dialog_open"; isOpen: boolean }
  | { type: "apply_import_failure"; errors: string[]; statusMessage: string }
  | { type: "apply_import_success"; rows: OwnPaletteDraftRow[]; statusMessage: string }
  | { type: "apply_save_failure"; errors: string[] }
  | {
      type: "apply_saved_palette";
      savedPalette: SatisfactoryPalette;
      savedPaletteFile: ColorsFile | null;
      draftRows: OwnPaletteDraftRow[];
      statusMessage: string;
      clearImportBase64: boolean;
    }
  | { type: "set_status_message"; statusMessage: string | null };

const clearEditStatuses = (
  state: OwnPaletteEditorState,
): OwnPaletteEditorState => ({
  ...state,
  importErrors: [],
  saveErrors: [],
  statusMessage: null,
});

const updateDraftRowById = (
  rows: OwnPaletteDraftRow[],
  rowId: string,
  updater: (row: OwnPaletteDraftRow) => OwnPaletteDraftRow,
): OwnPaletteDraftRow[] =>
  rows.map((row) => (row.id === rowId ? updater(row) : row));

export const createOwnPaletteEditorState = (
  initial: OwnInitialState,
): OwnPaletteEditorState => ({
  activeMode: "use",
  savedPalette: initial.savedPalette,
  savedPaletteFile: initial.savedPaletteFile,
  draftRows: initial.draftRows,
  loadErrors: initial.loadErrors,
  importBase64: "",
  importErrors: [],
  saveErrors: [],
  statusMessage: null,
  openCodeSelectRowId: null,
  isImportDialogOpen: false,
  isExportDialogOpen: false,
});

export const ownPaletteEditorReducer = (
  state: OwnPaletteEditorState,
  action: OwnPaletteEditorAction,
): OwnPaletteEditorState => {
  switch (action.type) {
    case "set_active_mode":
      return {
        ...state,
        activeMode: action.mode,
      };
    case "update_draft_field":
      return clearEditStatuses({
        ...state,
        draftRows: updateDraftRowById(
          state.draftRows,
          action.rowId,
          (row): OwnPaletteDraftRow => ({
            ...row,
            [action.field]: action.value,
          }),
        ),
      });
    case "set_code_select_open":
      return {
        ...state,
        openCodeSelectRowId: action.isOpen
          ? action.rowId
          : state.openCodeSelectRowId === action.rowId
            ? null
            : state.openCodeSelectRowId,
      };
    case "set_known_code":
      return clearEditStatuses({
        ...state,
        draftRows: updateDraftRowById(state.draftRows, action.rowId, (row) => {
          if (action.rawValue === OWN_CUSTOM_CODE_SENTINEL) {
            return {
              ...row,
              selectedCode: null,
            };
          }

          const knownRecord = getOwnPaletteKnownRecord(action.rawValue);
          if (!knownRecord) {
            return {
              ...row,
              selectedCode: null,
            };
          }

          return {
            ...row,
            selectedCode: knownRecord.code,
            defaultName: knownRecord.defaultName,
            hex: knownRecord.hex,
            secondaryColor: knownRecord.secondaryColor,
          };
        }),
      });
    case "add_row":
      return clearEditStatuses({
        ...state,
        draftRows: [createEmptyOwnPaletteDraftRow(), ...state.draftRows],
      });
    case "remove_row":
      return clearEditStatuses({
        ...state,
        draftRows: state.draftRows.filter((row) => row.id !== action.rowId),
        openCodeSelectRowId:
          state.openCodeSelectRowId === action.rowId
            ? null
            : state.openCodeSelectRowId,
      });
    case "set_import_base64":
      return {
        ...state,
        importBase64: action.value,
        importErrors: [],
        statusMessage: null,
      };
    case "set_import_dialog_open":
      return {
        ...state,
        isImportDialogOpen: action.isOpen,
      };
    case "set_export_dialog_open":
      return {
        ...state,
        isExportDialogOpen: action.isOpen,
      };
    case "apply_import_failure":
      return {
        ...state,
        importErrors: action.errors,
        statusMessage: action.statusMessage,
      };
    case "apply_import_success":
      return {
        ...state,
        draftRows: action.rows,
        openCodeSelectRowId: null,
        importErrors: [],
        saveErrors: [],
        statusMessage: action.statusMessage,
      };
    case "apply_save_failure":
      return {
        ...state,
        saveErrors: action.errors,
        statusMessage: null,
      };
    case "apply_saved_palette":
      return {
        ...state,
        savedPalette: action.savedPalette,
        savedPaletteFile: action.savedPaletteFile,
        draftRows: action.draftRows,
        openCodeSelectRowId: null,
        loadErrors: [],
        importErrors: [],
        saveErrors: [],
        importBase64: action.clearImportBase64 ? "" : state.importBase64,
        statusMessage: action.statusMessage,
      };
    case "set_status_message":
      return {
        ...state,
        statusMessage: action.statusMessage,
      };
    default:
      return state;
  }
};
