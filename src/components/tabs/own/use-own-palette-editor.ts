import { useCallback, useMemo, useState } from "react";
import { OWN_PALETTE_STORAGE_KEY } from "@/config/storage";
import {
  buildOwnPaletteFromDraftRows,
  createDefaultOwnPalette,
  createEmptyOwnPaletteDraftRow,
  createOwnPaletteDraftRowsFromPalette,
  exportOwnPaletteFileToBase64,
  getOwnPaletteKnownCodeOptions,
  getOwnPaletteKnownRecord,
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
import type { KnownCodeOption, OwnEditableField, OwnInitialState, OwnMode } from "./types";
import {
  areComparableDraftRowsEqual,
  OWN_CUSTOM_CODE_SENTINEL,
  toComparableDraftRow,
  toComparableDraftRowsFromPalette,
} from "./utils";

const readInitialOwnState = (): OwnInitialState => {
  const fallbackPalette = createDefaultOwnPalette();
  const fallbackDraftRows =
    createOwnPaletteDraftRowsFromPalette(fallbackPalette);

  if (typeof window === "undefined") {
    return {
      savedPalette: fallbackPalette,
      savedPaletteFile: null,
      draftRows: fallbackDraftRows,
      loadErrors: [],
    };
  }

  let rawStored: string | null = null;
  try {
    rawStored = window.localStorage.getItem(OWN_PALETTE_STORAGE_KEY);
  } catch {
    return {
      savedPalette: fallbackPalette,
      savedPaletteFile: null,
      draftRows: fallbackDraftRows,
      loadErrors: [t("ownTab.edit.errors.savedPaletteStorageReadFailed")],
    };
  }

  if (!rawStored) {
    return {
      savedPalette: fallbackPalette,
      savedPaletteFile: null,
      draftRows: fallbackDraftRows,
      loadErrors: [],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawStored) as unknown;
  } catch {
    return {
      savedPalette: fallbackPalette,
      savedPaletteFile: null,
      draftRows: fallbackDraftRows,
      loadErrors: [t("ownTab.edit.errors.savedPaletteInvalidJson")],
    };
  }

  const imported = importOwnPaletteObjectToDraftRows(parsed);
  if (!imported.rows || imported.errors.length > 0) {
    return {
      savedPalette: fallbackPalette,
      savedPaletteFile: null,
      draftRows: fallbackDraftRows,
      loadErrors:
        imported.errors.length > 0
          ? imported.errors
          : [t("ownTab.edit.errors.savedPaletteInvalidStructure")],
    };
  }

  const built = buildOwnPaletteFromDraftRows(imported.rows);
  if (!built.palette || !built.normalizedFile) {
    return {
      savedPalette: fallbackPalette,
      savedPaletteFile: null,
      draftRows: fallbackDraftRows,
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

export const useOwnPaletteEditor = () => {
  const locale = useLocale();
  const [activeMode, setActiveMode] = useState<OwnMode>("use");
  const [initialState] = useState<OwnInitialState>(() => readInitialOwnState());
  const [savedPalette, setSavedPalette] = useState<SatisfactoryPalette>(
    initialState.savedPalette,
  );
  const [savedPaletteFile, setSavedPaletteFile] = useState<ColorsFile | null>(
    initialState.savedPaletteFile,
  );
  const [draftRows, setDraftRows] = useState<OwnPaletteDraftRow[]>(
    initialState.draftRows,
  );
  const [loadErrors, setLoadErrors] = useState<string[]>(
    initialState.loadErrors,
  );
  const [importBase64, setImportBase64] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [openCodeSelectRowId, setOpenCodeSelectRowId] = useState<string | null>(
    null,
  );
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

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
      return importColorsFile(exportColorsFile(savedPalette));
    } catch {
      return savedPalette;
    }
  }, [locale, savedPalette]);

  const normalizedDraft = useMemo(
    () => validateAndNormalizeOwnPaletteDraft(draftRows),
    [draftRows],
  );

  const hasUnsavedChanges = useMemo(() => {
    const savedComparableRows = toComparableDraftRowsFromPalette(savedPalette);
    const draftComparableRows = draftRows.map(toComparableDraftRow);
    return !areComparableDraftRowsEqual(
      draftComparableRows,
      savedComparableRows,
    );
  }, [draftRows, savedPalette]);

  const validationErrors = normalizedDraft.errors;
  const isSaveDisabled =
    !hasUnsavedChanges ||
    !normalizedDraft.normalizedFile ||
    importErrors.length > 0;

  const exportBase64 = useMemo(() => {
    if (!savedPaletteFile) return "";
    return exportOwnPaletteFileToBase64(savedPaletteFile);
  }, [savedPaletteFile]);

  const allEditErrors = useMemo(
    () => [...loadErrors, ...importErrors, ...saveErrors, ...validationErrors],
    [importErrors, loadErrors, saveErrors, validationErrors],
  );

  const isExportBlocked = hasUnsavedChanges || allEditErrors.length > 0;

  const clearEditStatuses = useCallback(() => {
    setImportErrors([]);
    setSaveErrors([]);
    setStatusMessage(null);
  }, []);

  const updateDraftRow = useCallback(
    (
      rowId: string,
      updater: (row: OwnPaletteDraftRow) => OwnPaletteDraftRow,
    ) => {
      setDraftRows((previous) =>
        previous.map((row) => (row.id === rowId ? updater(row) : row)),
      );
      clearEditStatuses();
    },
    [clearEditStatuses],
  );

  const handleDraftFieldChange = useCallback(
    (rowId: string, field: OwnEditableField, value: string) => {
      updateDraftRow(rowId, (row) => ({
        ...row,
        [field]: value,
      }));
    },
    [updateDraftRow],
  );

  const handleCodeSelectOpenChange = useCallback(
    (rowId: string, isOpen: boolean) => {
      if (isOpen) {
        setOpenCodeSelectRowId(rowId);
        return;
      }

      setOpenCodeSelectRowId((previous) =>
        previous === rowId ? null : previous,
      );
    },
    [],
  );

  const handleKnownCodeChange = useCallback(
    (rowId: string, rawValue: string) => {
      updateDraftRow(rowId, (row) => {
        if (rawValue === OWN_CUSTOM_CODE_SENTINEL) {
          return {
            ...row,
            selectedCode: null,
          };
        }

        const knownRecord = getOwnPaletteKnownRecord(rawValue);
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
      });
    },
    [updateDraftRow],
  );

  const handleAddRow = useCallback(() => {
    setDraftRows((previous) => [createEmptyOwnPaletteDraftRow(), ...previous]);
    clearEditStatuses();
  }, [clearEditStatuses]);

  const handleRemoveRow = useCallback(
    (rowId: string) => {
      setDraftRows((previous) => previous.filter((row) => row.id !== rowId));
      setOpenCodeSelectRowId((previous) =>
        previous === rowId ? null : previous,
      );
      clearEditStatuses();
    },
    [clearEditStatuses],
  );

  const handleSave = useCallback(() => {
    const builtDraft = buildOwnPaletteFromDraftRows(draftRows);
    if (!builtDraft.palette || !builtDraft.normalizedFile) {
      setSaveErrors(
        builtDraft.errors.length > 0
          ? builtDraft.errors
          : [t("ownTab.edit.errors.savedPaletteFailedBuild")],
      );
      setStatusMessage(null);
      return;
    }

    setSavedPalette(builtDraft.palette);
    setSavedPaletteFile(builtDraft.normalizedFile);
    setDraftRows(createOwnPaletteDraftRowsFromPalette(builtDraft.palette));
    setOpenCodeSelectRowId(null);
    setLoadErrors([]);
    setImportErrors([]);
    setSaveErrors([]);
    setStatusMessage(t("ownTab.edit.status.saved"));

    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        OWN_PALETTE_STORAGE_KEY,
        JSON.stringify(builtDraft.normalizedFile),
      );
    } catch {
      setStatusMessage(t("ownTab.edit.status.saveStorageFailed"));
    }
  }, [draftRows]);

  const handleResetToDefault = useCallback(() => {
    const defaultPalette = createDefaultOwnPalette();
    const defaultDraftRows =
      createOwnPaletteDraftRowsFromPalette(defaultPalette);
    const builtDefault = buildOwnPaletteFromDraftRows(defaultDraftRows);

    setSavedPalette(defaultPalette);
    setSavedPaletteFile(builtDefault.normalizedFile);
    setDraftRows(defaultDraftRows);
    setOpenCodeSelectRowId(null);
    setLoadErrors([]);
    setImportErrors([]);
    setSaveErrors([]);
    setImportBase64("");
    setStatusMessage(t("ownTab.edit.status.resetDone"));

    if (typeof window === "undefined" || !builtDefault.normalizedFile) return;
    try {
      window.localStorage.setItem(
        OWN_PALETTE_STORAGE_KEY,
        JSON.stringify(builtDefault.normalizedFile),
      );
    } catch {
      setStatusMessage(t("ownTab.edit.status.resetStorageFailed"));
    }
  }, []);

  const handleClearPalette = useCallback(() => {
    const builtEmpty = buildOwnPaletteFromDraftRows([]);
    if (!builtEmpty.palette || !builtEmpty.normalizedFile) {
      setSaveErrors(
        builtEmpty.errors.length > 0
          ? builtEmpty.errors
          : [t("ownTab.edit.errors.savedPaletteFailedBuild")],
      );
      setStatusMessage(null);
      return;
    }

    setSavedPalette(builtEmpty.palette);
    setSavedPaletteFile(builtEmpty.normalizedFile);
    setDraftRows([]);
    setOpenCodeSelectRowId(null);
    setLoadErrors([]);
    setImportErrors([]);
    setSaveErrors([]);
    setImportBase64("");
    setStatusMessage(t("ownTab.edit.status.cleared"));

    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        OWN_PALETTE_STORAGE_KEY,
        JSON.stringify(builtEmpty.normalizedFile),
      );
    } catch {
      setStatusMessage(t("ownTab.edit.status.clearStorageFailed"));
    }
  }, []);

  const handleImportToDraft = useCallback(() => {
    setIsImportDialogOpen(false);
    const imported = importOwnPaletteBase64ToDraftRows(importBase64);
    if (!imported.rows || imported.errors.length > 0) {
      setImportErrors(
        imported.errors.length > 0
          ? imported.errors
          : [t("ownTab.edit.errors.importUnknown")],
      );
      setStatusMessage(t("ownTab.edit.status.importFailed"));
      return;
    }

    setDraftRows(imported.rows);
    setOpenCodeSelectRowId(null);
    setImportErrors([]);
    setSaveErrors([]);
    setStatusMessage(t("ownTab.edit.status.importLoaded"));
  }, [importBase64]);

  const handleCopyExport = useCallback(() => {
    if (!exportBase64) return;
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setStatusMessage(t("ownTab.edit.status.copyUnavailable"));
      return;
    }

    void navigator.clipboard.writeText(exportBase64).then(
      () => {
        setStatusMessage(t("ownTab.edit.status.exportCopied"));
        setIsExportDialogOpen(false);
      },
      () => {
        setStatusMessage(t("ownTab.edit.status.copyFailed"));
      },
    );
  }, [exportBase64]);

  const handleImportBase64Change = useCallback((value: string) => {
    setImportBase64(value);
    setImportErrors([]);
    setStatusMessage(null);
  }, []);

  const handleImportDialogOpenChange = useCallback((isOpen: boolean) => {
    setIsImportDialogOpen(isOpen);
  }, []);

  const handleExportDialogOpenChange = useCallback((isOpen: boolean) => {
    setIsExportDialogOpen(isOpen);
  }, []);

  const openImportDialog = useCallback(() => {
    setIsImportDialogOpen(true);
  }, []);

  const openExportDialog = useCallback(() => {
    setIsExportDialogOpen(true);
  }, []);

  return {
    activeMode,
    setActiveMode,
    savedPalette: localizedSavedPalette,
    draftRows,
    knownCodeOptions,
    knownCodeLabelsByCode,
    openCodeSelectRowId,
    isImportDialogOpen,
    isExportDialogOpen,
    importBase64,
    exportBase64,
    statusMessage,
    allEditErrors,
    hasUnsavedChanges,
    isSaveDisabled,
    isExportBlocked,
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
  };
};
