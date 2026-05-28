import ColorsTab from "@/components/ColorsTab";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Eraser,
  ExternalLink,
  Eye,
  EyeOff,
  FileDown,
  FileUp,
  Maximize2,
  Minimize2,
  Palette,
  Pencil,
  Pipette,
  Plus,
  RotateCcw,
  Save,
  SwatchBook,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OWN_COPY_COUNTS_STORAGE_KEY } from "@/config/storage";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ColorHarmonyDialog from "./own/ColorHarmonyDialog";
import OwnEditDialogs from "./own/OwnEditDialogs";
import OwnEditRow from "./own/OwnEditRow";
import { useOwnPaletteEditor } from "./own/use-own-palette-editor";

const ROW_ERROR_LINK_REGEX = /^Row\s+(\d+):(.*)$/;
const VALIDATION_ERRORS_COLLAPSED_MAX_VIEWPORT_RATIO = 0.32;
const VALIDATION_ERRORS_COLLAPSED_MAX_REM = 14;
const VALIDATION_ERRORS_OVERFLOW_TOLERANCE_PX = 1;

const getEditErrorRowNumber = (
  error: string,
  rowCount: number,
): number | null => {
  const rowMatch = ROW_ERROR_LINK_REGEX.exec(error);
  if (!rowMatch) return null;

  const rowNumber = Number(rowMatch[1]);
  if (!Number.isInteger(rowNumber) || rowNumber < 1 || rowNumber > rowCount) {
    return null;
  }

  return rowNumber;
};

const getValidationErrorsCollapsedMaxHeight = (): number => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Number.POSITIVE_INFINITY;
  }

  const rootFontSize =
    Number.parseFloat(
      window.getComputedStyle(document.documentElement).fontSize,
    ) || 16;

  return Math.min(
    window.innerHeight * VALIDATION_ERRORS_COLLAPSED_MAX_VIEWPORT_RATIO,
    rootFontSize * VALIDATION_ERRORS_COLLAPSED_MAX_REM,
  );
};

const OwnTab = () => {
  const [isDefaultNameColumnVisible, setIsDefaultNameColumnVisible] =
    useState(true);
  const [isHarmonyDialogOpen, setIsHarmonyDialogOpen] = useState(false);
  const [isValidationErrorsExpanded, setIsValidationErrorsExpanded] =
    useState(false);
  const [canToggleValidationErrors, setCanToggleValidationErrors] =
    useState(false);
  const validationErrorsPanelRef = useRef<HTMLDivElement | null>(null);
  const {
    state: {
      activeMode,
      savedPalette,
      draftRows,
      openCodeSelectRowId,
      isImportDialogOpen,
      isExportDialogOpen,
      importBase64,
      statusMessage,
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
  } = useOwnPaletteEditor();

  const knownCodeOptionsByRowId = useMemo(() => {
    const selectedKnownCodes = new Set<string>();
    draftRows.forEach((draftRow) => {
      if (draftRow.selectedCode) {
        selectedKnownCodes.add(draftRow.selectedCode);
      }
    });

    return new Map(
      draftRows.map((draftRow) => [
        draftRow.id,
        knownCodeOptions.filter(
          (option) =>
            option.code === draftRow.selectedCode ||
            !selectedKnownCodes.has(option.code),
        ),
      ]),
    );
  }, [draftRows, knownCodeOptions]);

  const harmonyInitialPrimaryHex = useMemo(() => {
    const draftHex = draftRows.find(
      (draftRow) => draftRow.hex.trim().length > 0,
    )?.hex;
    return draftHex ?? savedPalette.colors[0]?.hex ?? "#CB603A";
  }, [draftRows, savedPalette.colors]);

  const harmonyInitialSecondaryHex = useMemo(() => {
    const draftSecondaryHex = draftRows.find(
      (draftRow) => draftRow.secondaryColor.trim().length > 0,
    )?.secondaryColor;
    return draftSecondaryHex ?? savedPalette.colors[0]?.secondaryColor ?? "";
  }, [draftRows, savedPalette.colors]);

  const harmonyDialog = (
    <ColorHarmonyDialog
      open={isHarmonyDialogOpen}
      onOpenChange={setIsHarmonyDialogOpen}
      initialPrimaryHex={harmonyInitialPrimaryHex}
      initialSecondaryHex={harmonyInitialSecondaryHex}
    />
  );

  const errorRowNumbers = useMemo(() => {
    const rowNumbers = new Set<number>();
    allEditErrors.forEach((error) => {
      const rowNumber = getEditErrorRowNumber(error, draftRows.length);
      if (rowNumber) {
        rowNumbers.add(rowNumber);
      }
    });
    return rowNumbers;
  }, [allEditErrors, draftRows.length]);

  const measureValidationErrorsOverflow = useCallback(() => {
    const panel = validationErrorsPanelRef.current;
    if (!panel) {
      setCanToggleValidationErrors(false);
      return;
    }

    const collapsedMaxHeight = getValidationErrorsCollapsedMaxHeight();
    const nextCanToggle =
      panel.scrollHeight >
      collapsedMaxHeight + VALIDATION_ERRORS_OVERFLOW_TOLERANCE_PX;

    setCanToggleValidationErrors((currentCanToggle) =>
      currentCanToggle === nextCanToggle ? currentCanToggle : nextCanToggle,
    );
  }, []);

  useEffect(() => {
    if (allEditErrors.length === 0) {
      setCanToggleValidationErrors(false);
      setIsValidationErrorsExpanded(false);
      return undefined;
    }

    const frameId = window.requestAnimationFrame(
      measureValidationErrorsOverflow,
    );
    window.addEventListener("resize", measureValidationErrorsOverflow);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", measureValidationErrorsOverflow);
    };
  }, [allEditErrors, measureValidationErrorsOverflow]);

  useEffect(() => {
    if (!canToggleValidationErrors && isValidationErrorsExpanded) {
      setIsValidationErrorsExpanded(false);
    }
  }, [canToggleValidationErrors, isValidationErrorsExpanded]);

  const renderEditError = (error: string) => {
    const rowMatch = ROW_ERROR_LINK_REGEX.exec(error);
    if (!rowMatch) return error;

    const rowNumber = getEditErrorRowNumber(error, draftRows.length);
    if (!rowNumber) {
      return error;
    }

    return (
      <>
        <a
          href={`#own-row-${rowNumber}`}
          className="font-medium underline underline-offset-2 hover:text-destructive-foreground"
        >
          Row {rowNumber}
        </a>
        :{rowMatch[2]}
      </>
    );
  };

  if (activeMode === "use") {
    return (
      <div className="h-full">
        {harmonyDialog}
        <ColorsTab
          palette={savedPalette}
          swatchMode="duo"
          copyCountsStorageKey={OWN_COPY_COUNTS_STORAGE_KEY}
          topContent={
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveMode("edit")}
                  aria-pressed={false}
                  aria-label={t("ownTab.mode.edit")}
                  className="px-2 lg:px-3"
                >
                  <Pencil aria-hidden="true" />
                  <span className="hidden lg:inline">
                    {t("ownTab.mode.edit")}
                  </span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsHarmonyDialogOpen(true)}
                  aria-label={t("ownTab.harmony.openAria")}
                  data-testid="own-use-harmony-button"
                  className="px-2 lg:px-3"
                >
                  <SwatchBook aria-hidden="true" />
                  <span className="hidden lg:inline">
                    {t("ownTab.harmony.button")}
                  </span>
                </Button>
              </div>

              <div className="font-mono text-[11px] text-muted-foreground">
                {t("ownTab.use.description")}
              </div>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {harmonyDialog}
      <OwnEditDialogs
        isImportDialogOpen={isImportDialogOpen}
        onImportDialogOpenChange={handleImportDialogOpenChange}
        importBase64={importBase64}
        onImportBase64Change={handleImportBase64Change}
        onImportToDraft={handleImportToDraft}
        isExportDialogOpen={isExportDialogOpen}
        onExportDialogOpenChange={handleExportDialogOpenChange}
        exportBase64={exportBase64}
        onCopyExport={handleCopyExport}
      />

      {statusMessage && (
        <div
          className="font-mono text-[11px] text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {statusMessage}
        </div>
      )}

      {isExportBlocked && (
        <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-300">
          <AlertTitle>{t("ownTab.edit.warnings.title")}</AlertTitle>
          <AlertDescription>
            {t("ownTab.edit.warnings.exportPreviewBlocked")}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border border-border">
        <div className="px-3 py-2 border-b bg-background sticky top-0 z-20">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {!isSaveDisabled ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  aria-label={t("ownTab.edit.save")}
                  className="px-2 lg:px-3"
                >
                  <Save aria-hidden="true" />
                  <span className="hidden lg:inline">
                    {t("ownTab.edit.save")}
                  </span>
                </Button>
              ) : null}
              {!hasUnsavedChanges ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setActiveMode("use")}
                  aria-pressed={false}
                  aria-label={t("ownTab.mode.use")}
                  className="px-2 lg:px-3"
                >
                  <Eye aria-hidden="true" />
                  <span className="hidden lg:inline">
                    {t("ownTab.mode.use")}
                  </span>
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={openImportDialog}
                aria-label={t("ownTab.edit.import.button")}
                className="px-2 lg:px-3"
              >
                <FileUp aria-hidden="true" />
                <span className="hidden lg:inline">
                  {t("ownTab.edit.import.button")}
                </span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={openExportDialog}
                disabled={isExportBlocked}
                aria-label={t("ownTab.edit.export.button")}
                className="px-2 lg:px-3"
              >
                <FileDown aria-hidden="true" />
                <span className="hidden lg:inline">
                  {t("ownTab.edit.export.button")}
                </span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsHarmonyDialogOpen(true)}
                aria-label={t("ownTab.harmony.openAria")}
                data-testid="own-edit-harmony-button"
                className="px-2 xl:px-3"
              >
                <SwatchBook className="size-3.5" aria-hidden="true" />
                <span className="hidden xl:inline">
                  {t("ownTab.harmony.button")}
                </span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                asChild
                className="px-2 xl:px-3"
              >
                <a
                  href="https://www.canva.com/colors/color-wheel"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Canva Color Wheel in a new tab"
                >
                  <Palette className="size-3.5" aria-hidden="true" />
                  <span className="hidden xl:inline">Color Wheel</span>
                  <ExternalLink
                    className="hidden xl:inline size-3.5"
                    aria-hidden="true"
                  />
                </a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                asChild
                className="px-2 xl:px-3"
              >
                <a
                  href="https://htmlcolorcodes.com/color-picker/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open HTML Color Codes Color Picker in a new tab"
                >
                  <Pipette className="size-3.5" aria-hidden="true" />
                  <span className="hidden xl:inline">Color Picker</span>
                  <ExternalLink
                    className="hidden xl:inline size-3.5"
                    aria-hidden="true"
                  />
                </a>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddRow}
                aria-label={t("ownTab.edit.addRow")}
                className="px-2 lg:px-3"
              >
                <Plus aria-hidden="true" />
                <span className="hidden lg:inline">
                  {t("ownTab.edit.addRow")}
                </span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleClearPalette}
                aria-label={t("ownTab.edit.clear")}
                className="px-2 lg:px-3"
              >
                <Eraser aria-hidden="true" />
                <span className="hidden lg:inline">
                  {t("ownTab.edit.clear")}
                </span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleResetToDefault}
                aria-label={t("ownTab.edit.reset")}
                className="px-2 lg:px-3"
              >
                <RotateCcw aria-hidden="true" />
                <span className="hidden lg:inline">
                  {t("ownTab.edit.reset")}
                </span>
              </Button>
            </div>
          </div>
        </div>

        <Table
          className="min-w-[920px] table-fixed"
          containerClassName="min-h-0 flex-1"
        >
          <colgroup>
            <col className="w-[56px]" />
            <col className="w-[220px]" />
            <col
              className={isDefaultNameColumnVisible ? undefined : "w-[64px]"}
            />
            <col className="w-[170px]" />
            <col className="w-[170px]" />
            <col className="w-[88px]" />
          </colgroup>
          <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-background [&_th]:px-2 md:[&_th]:px-4">
            <TableRow>
              <TableHead className="text-right font-mono">#</TableHead>
              <TableHead>{t("ownTab.edit.columns.code")}</TableHead>
              {isDefaultNameColumnVisible ? (
                <TableHead>
                  <div className="flex items-center gap-2">
                    <span>{t("ownTab.edit.columns.defaultName")}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      aria-label="Hide default name column"
                      onClick={() => setIsDefaultNameColumnVisible(false)}
                    >
                      <EyeOff aria-hidden="true" />
                    </Button>
                  </div>
                </TableHead>
              ) : (
                <TableHead>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                    aria-label="Show default name column"
                    onClick={() => setIsDefaultNameColumnVisible(true)}
                  >
                    <Eye aria-hidden="true" />
                  </Button>
                </TableHead>
              )}
              <TableHead>{t("ownTab.edit.columns.primary")}</TableHead>
              <TableHead>{t("ownTab.edit.columns.secondary")}</TableHead>
              <TableHead className="lg:w-[110px]">
                {t("ownTab.edit.columns.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {draftRows.map((row, rowIndex) => (
              <OwnEditRow
                key={row.id}
                rowIndex={rowIndex}
                row={row}
                knownCodeOptions={knownCodeOptionsByRowId.get(row.id) ?? []}
                selectedCodeLabel={
                  row.selectedCode
                    ? (knownCodeLabelsByCode.get(row.selectedCode) ?? null)
                    : null
                }
                isCodeSelectOpen={openCodeSelectRowId === row.id}
                hasValidationError={errorRowNumbers.has(rowIndex + 1)}
                isDefaultNameColumnVisible={isDefaultNameColumnVisible}
                writeYourOwnLabel={t("ownTab.edit.writeYourOwn")}
                defaultNamePlaceholder={t(
                  "ownTab.edit.placeholders.defaultName",
                )}
                secondaryPlaceholder={t(
                  "ownTab.edit.placeholders.secondaryFallback",
                )}
                removeLabel={t("ownTab.edit.removeRow")}
                onCodeSelectOpenChange={handleCodeSelectOpenChange}
                onKnownCodeChange={handleKnownCodeChange}
                onDraftFieldChange={handleDraftFieldChange}
                onRemoveRow={handleRemoveRow}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {allEditErrors.length > 0 && (
        <Alert
          ref={validationErrorsPanelRef}
          variant="destructive"
          className={cn(
            "fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-5xl flex-col overflow-hidden border-destructive/60 bg-background/95 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/80",
            canToggleValidationErrors && isValidationErrorsExpanded
              ? "max-h-[50vh]"
              : "max-h-[min(32vh,15rem)]",
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <AlertTitle className="mb-0">
              {t("ownTab.edit.errors.title")}
            </AlertTitle>
            {canToggleValidationErrors ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setIsValidationErrorsExpanded((isExpanded) => !isExpanded)
                }
                aria-expanded={isValidationErrorsExpanded}
                aria-label={
                  isValidationErrorsExpanded
                    ? "Collapse validation errors"
                    : "Expand validation errors"
                }
                className="h-7 w-7 shrink-0 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {isValidationErrorsExpanded ? (
                  <Minimize2 className="size-4" aria-hidden="true" />
                ) : (
                  <Maximize2 className="size-4" aria-hidden="true" />
                )}
              </Button>
            ) : null}
          </div>
          <AlertDescription className="min-h-0 overflow-auto pr-1">
            <ul className="list-disc space-y-1 pl-4">
              {allEditErrors.map((error, index) => (
                <li key={`${error}-${index}`}>{renderEditError(error)}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default OwnTab;
