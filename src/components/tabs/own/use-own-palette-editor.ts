import { useCallback, useMemo, useReducer } from "react";
import {
  buildOwnPaletteFromDraftRows,
  createDefaultOwnPalette,
  createOwnPaletteDraftRowsFromPalette,
  exportOwnPaletteFileToBase64,
  getOwnPaletteKnownCodeOptions,
  importOwnPaletteBase64ToDraftRows,
  importOwnPaletteObjectToDraftRows,
  validateAndNormalizeOwnPaletteDraft,
  type OwnPaletteDraftRow,
} from "@/data/own-palette";
import {
  exportColorsFile,
  importColorsFile,
  type ColorsFile,
  type SatisfactoryPalette,
} from "@/data/colors";
import { getColorName, t, useLocale } from "@/i18n";
import type {
  KnownCodeOption,
  OwnEditableField,
  OwnInitialState,
  OwnMode,
} from "./types";
import {
  areComparableDraftRowsEqual,
  toComparableDraftRow,
  toComparableDraftRowsFromPalette,
} from "./utils";
import {
  createOwnPaletteEditorState,
  ownPaletteEditorReducer,
} from "./own-palette-editor.reducer";
import {
  copyTextToClipboard,
  readOwnPaletteStorage,
  writeOwnPaletteStorage,
} from "./own-palette-editor.services";

const readInitialOwnState = (): OwnInitialState => {
  const fallbackPalette = createDefaultOwnPalette();
  const fallbackDraftRows =
    createOwnPaletteDraftRowsFromPalette(fallbackPalette);
  const fallbackState: OwnInitialState = {
    savedPalette: fallbackPalette,
    savedPaletteFile: null,
    draftRows: fallbackDraftRows,
    loadErrors: [],
  };

  const stored = readOwnPaletteStorage();
  if (stored.status === "read_error") {
    return {
      ...fallbackState,
      loadErrors: [t("ownTab.edit.errors.savedPaletteStorageReadFailed")],
    };
  }

  if (!stored.value) {
    return fallbackState;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored.value) as unknown;
  } catch {
    return {
      ...fallbackState,
      loadErrors: [t("ownTab.edit.errors.savedPaletteInvalidJson")],
    };
  }

  const imported = importOwnPaletteObjectToDraftRows(parsed);
  if (!imported.rows || imported.errors.length > 0) {
    return {
      ...fallbackState,
      loadErrors:
        imported.errors.length > 0
          ? imported.errors
          : [t("ownTab.edit.errors.savedPaletteInvalidStructure")],
    };
  }

  const built = buildOwnPaletteFromDraftRows(imported.rows);
  if (!built.palette || !built.normalizedFile) {
    return {
      ...fallbackState,
      loadErrors:
        built.errors.length > 0
          ? built.errors
          : [t("ownTab.edit.errors.savedPaletteFailedBuild")],
    };
  }

  return {
    savedPalette: built.palette,
    savedPaletteFile: built.normalizedFile,
    draftRows: createOwnPaletteDraftRowsFromPalette(built.palette),
    loadErrors: [],
  };
};

const toBuildErrors = (errors: string[]): string[] =>
  errors.length > 0
    ? errors
    : [t("ownTab.edit.errors.savedPaletteFailedBuild")];

type ApplySavedPaletteParams = {
  savedPalette: SatisfactoryPalette;
  savedPaletteFile: ColorsFile | null;
  draftRows: OwnPaletteDraftRow[];
  statusMessage: string;
  storageFailureStatusMessage: string;
  clearImportBase64: boolean;
};

export const useOwnPaletteEditor = () => {
  const locale = useLocale();
  const [state, dispatch] = useReducer(
    ownPaletteEditorReducer,
    null,
    () => createOwnPaletteEditorState(readInitialOwnState()),
  );

  const knownCodeOptions = useMemo<KnownCodeOption[]>(() => {
    // getColorName resolves from current locale; touch locale to force relabeling on locale switch.
    void locale;
    return getOwnPaletteKnownCodeOptions().map((option) => ({
      code: option.code,
      label: getColorName(option.code, option.defaultName),
    }));
  }, [locale]);

  const knownCodeLabelsByCode = useMemo(
    () =>
      new Map(knownCodeOptions.map((option) => [option.code, option.label])),
    [knownCodeOptions],
  );

  const localizedSavedPalette = useMemo(() => {
    void locale;
    try {
      return importColorsFile(exportColorsFile(state.savedPalette));
    } catch {
      return state.savedPalette;
    }
  }, [locale, state.savedPalette]);

  const normalizedDraft = useMemo(
    () => validateAndNormalizeOwnPaletteDraft(state.draftRows),
    [state.draftRows],
  );

  const hasUnsavedChanges = useMemo(() => {
    const savedComparableRows = toComparableDraftRowsFromPalette(
      state.savedPalette,
    );
    const draftComparableRows = state.draftRows.map(toComparableDraftRow);
    return !areComparableDraftRowsEqual(
      draftComparableRows,
      savedComparableRows,
    );
  }, [state.draftRows, state.savedPalette]);

  const validationErrors = normalizedDraft.errors;
  const isSaveDisabled =
    !hasUnsavedChanges ||
    !normalizedDraft.normalizedFile ||
    state.importErrors.length > 0;

  const exportBase64 = useMemo(() => {
    if (!state.savedPaletteFile) return "";
    return exportOwnPaletteFileToBase64(state.savedPaletteFile);
  }, [state.savedPaletteFile]);

  const allEditErrors = useMemo(
    () => [
      ...state.loadErrors,
      ...state.importErrors,
      ...state.saveErrors,
      ...validationErrors,
    ],
    [state.importErrors, state.loadErrors, state.saveErrors, validationErrors],
  );

  const isExportBlocked = hasUnsavedChanges || allEditErrors.length > 0;

  const setActiveMode = useCallback((mode: OwnMode) => {
    dispatch({ type: "set_active_mode", mode });
  }, []);

  const applySavedPalette = useCallback(
    (params: ApplySavedPaletteParams) => {
      dispatch({
        type: "apply_saved_palette",
        savedPalette: params.savedPalette,
        savedPaletteFile: params.savedPaletteFile,
        draftRows: params.draftRows,
        statusMessage: params.statusMessage,
        clearImportBase64: params.clearImportBase64,
      });

      if (
        params.savedPaletteFile &&
        !writeOwnPaletteStorage(params.savedPaletteFile)
      ) {
        dispatch({
          type: "set_status_message",
          statusMessage: params.storageFailureStatusMessage,
        });
      }
    },
    [],
  );

  const handleDraftFieldChange = useCallback(
    (rowId: string, field: OwnEditableField, value: string) => {
      dispatch({ type: "update_draft_field", rowId, field, value });
    },
    [],
  );

  const handleCodeSelectOpenChange = useCallback(
    (rowId: string, isOpen: boolean) => {
      dispatch({ type: "set_code_select_open", rowId, isOpen });
    },
    [],
  );

  const handleKnownCodeChange = useCallback(
    (rowId: string, rawValue: string) => {
      dispatch({ type: "set_known_code", rowId, rawValue });
    },
    [],
  );

  const handleAddRow = useCallback(() => {
    dispatch({ type: "add_row" });
  }, []);

  const handleRemoveRow = useCallback(
    (rowId: string) => {
      dispatch({ type: "remove_row", rowId });
    },
    [],
  );

  const handleSave = useCallback(() => {
    const builtDraft = buildOwnPaletteFromDraftRows(state.draftRows);
    if (!builtDraft.palette || !builtDraft.normalizedFile) {
      dispatch({
        type: "apply_save_failure",
        errors: toBuildErrors(builtDraft.errors),
      });
      return;
    }

    applySavedPalette({
      savedPalette: builtDraft.palette,
      savedPaletteFile: builtDraft.normalizedFile,
      draftRows: createOwnPaletteDraftRowsFromPalette(builtDraft.palette),
      statusMessage: t("ownTab.edit.status.saved"),
      storageFailureStatusMessage: t("ownTab.edit.status.saveStorageFailed"),
      clearImportBase64: false,
    });
  }, [applySavedPalette, state.draftRows]);

  const handleResetToDefault = useCallback(() => {
    const defaultPalette = createDefaultOwnPalette();
    const defaultDraftRows =
      createOwnPaletteDraftRowsFromPalette(defaultPalette);
    const builtDefault = buildOwnPaletteFromDraftRows(defaultDraftRows);

    applySavedPalette({
      savedPalette: defaultPalette,
      savedPaletteFile: builtDefault.normalizedFile,
      draftRows: defaultDraftRows,
      statusMessage: t("ownTab.edit.status.resetDone"),
      storageFailureStatusMessage: t("ownTab.edit.status.resetStorageFailed"),
      clearImportBase64: true,
    });
  }, [applySavedPalette]);

  const handleClearPalette = useCallback(() => {
    const builtEmpty = buildOwnPaletteFromDraftRows([]);
    if (!builtEmpty.palette || !builtEmpty.normalizedFile) {
      dispatch({
        type: "apply_save_failure",
        errors: toBuildErrors(builtEmpty.errors),
      });
      return;
    }

    applySavedPalette({
      savedPalette: builtEmpty.palette,
      savedPaletteFile: builtEmpty.normalizedFile,
      draftRows: [],
      statusMessage: t("ownTab.edit.status.cleared"),
      storageFailureStatusMessage: t("ownTab.edit.status.clearStorageFailed"),
      clearImportBase64: true,
    });
  }, [applySavedPalette]);

  const handleImportToDraft = useCallback(() => {
    dispatch({ type: "set_import_dialog_open", isOpen: false });
    const imported = importOwnPaletteBase64ToDraftRows(state.importBase64);
    if (!imported.rows || imported.errors.length > 0) {
      dispatch({
        type: "apply_import_failure",
        errors:
          imported.errors.length > 0
            ? imported.errors
            : [t("ownTab.edit.errors.importUnknown")],
        statusMessage: t("ownTab.edit.status.importFailed"),
      });
      return;
    }

    dispatch({
      type: "apply_import_success",
      rows: imported.rows,
      statusMessage: t("ownTab.edit.status.importLoaded"),
    });
  }, [state.importBase64]);

  const handleCopyExport = useCallback(() => {
    if (!exportBase64) return;
    void copyTextToClipboard(exportBase64).then((copyResult) => {
      if (copyResult === "copied") {
        dispatch({
          type: "set_status_message",
          statusMessage: t("ownTab.edit.status.exportCopied"),
        });
        dispatch({ type: "set_export_dialog_open", isOpen: false });
        return;
      }

      dispatch({
        type: "set_status_message",
        statusMessage:
          copyResult === "unavailable"
            ? t("ownTab.edit.status.copyUnavailable")
            : t("ownTab.edit.status.copyFailed"),
      });
    });
  }, [exportBase64]);

  const handleImportBase64Change = useCallback((value: string) => {
    dispatch({ type: "set_import_base64", value });
  }, []);

  const handleImportDialogOpenChange = useCallback((isOpen: boolean) => {
    dispatch({ type: "set_import_dialog_open", isOpen });
  }, []);

  const handleExportDialogOpenChange = useCallback((isOpen: boolean) => {
    dispatch({ type: "set_export_dialog_open", isOpen });
  }, []);

  const openImportDialog = useCallback(() => {
    dispatch({ type: "set_import_dialog_open", isOpen: true });
  }, []);

  const openExportDialog = useCallback(() => {
    dispatch({ type: "set_export_dialog_open", isOpen: true });
  }, []);

  return {
    state: {
      activeMode: state.activeMode,
      savedPalette: localizedSavedPalette,
      draftRows: state.draftRows,
      openCodeSelectRowId: state.openCodeSelectRowId,
      isImportDialogOpen: state.isImportDialogOpen,
      isExportDialogOpen: state.isExportDialogOpen,
      importBase64: state.importBase64,
      statusMessage: state.statusMessage,
    },
    derived: {
      knownCodeOptions,
      knownCodeLabelsByCode,
      exportBase64,
      allEditErrors,
      hasUnsavedChanges,
      isSaveDisabled,
      isExportBlocked,
    },
    actions: {
      setActiveMode,
      handleDraftFieldChange,
      handleCodeSelectOpenChange,
      handleKnownCodeChange,
      handleAddRow,
      handleRemoveRow,
      handleSave,
      handleResetToDefault,
      handleClearPalette,
      handleImportToDraft,
      handleCopyExport,
      handleImportBase64Change,
      handleImportDialogOpenChange,
      handleExportDialogOpenChange,
      openImportDialog,
      openExportDialog,
    },
  };
};
