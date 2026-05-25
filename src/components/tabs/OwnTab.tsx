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
  Palette,
  Pencil,
  Pipette,
  Plus,
  RotateCcw,
  Save,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  OWN_COPY_COUNTS_STORAGE_KEY,
} from "@/config/storage";
import { t } from "@/i18n";
import { useMemo, useState } from "react";
import ColorHarmonyDialog from "./own/ColorHarmonyDialog";
import OwnEditDialogs from "./own/OwnEditDialogs";
import OwnEditRow from "./own/OwnEditRow";
import { useOwnPaletteEditor } from "./own/use-own-palette-editor";

const OwnTab = () => {
  const [isDefaultNameColumnVisible, setIsDefaultNameColumnVisible] =
    useState(true);
  const [isHarmonyDialogOpen, setIsHarmonyDialogOpen] = useState(false);
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
    const draftHex = draftRows.find((draftRow) => draftRow.hex.trim().length > 0)
      ?.hex;
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
                  <span className="hidden lg:inline">{t("ownTab.mode.edit")}</span>
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
                  <Palette aria-hidden="true" />
                  <span className="hidden lg:inline">{t("ownTab.harmony.button")}</span>
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

      {allEditErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>{t("ownTab.edit.errors.title")}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 space-y-1">
              {allEditErrors.map((error, index) => (
                <li key={`${error}-${index}`}>{error}</li>
              ))}
            </ul>
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
                  <span className="hidden lg:inline">{t("ownTab.edit.save")}</span>
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
                  <span className="hidden lg:inline">{t("ownTab.mode.use")}</span>
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
                <span className="hidden lg:inline">{t("ownTab.edit.import.button")}</span>
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
                <span className="hidden lg:inline">{t("ownTab.edit.export.button")}</span>
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
                <Palette className="size-3.5" aria-hidden="true" />
                <span className="hidden xl:inline">{t("ownTab.harmony.button")}</span>
              </Button>
              <Button size="sm" variant="outline" asChild className="px-2 xl:px-3">
                <a
                  href="https://www.canva.com/colors/color-wheel"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Canva Color Wheel in a new tab"
                >
                  <Palette className="size-3.5" aria-hidden="true" />
                  <span className="hidden xl:inline">Color Wheel</span>
                  <ExternalLink className="hidden xl:inline size-3.5" aria-hidden="true" />
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild className="px-2 xl:px-3">
                <a
                  href="https://htmlcolorcodes.com/color-picker/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open HTML Color Codes Color Picker in a new tab"
                >
                  <Pipette className="size-3.5" aria-hidden="true" />
                  <span className="hidden xl:inline">Color Picker</span>
                  <ExternalLink className="hidden xl:inline size-3.5" aria-hidden="true" />
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
                <span className="hidden lg:inline">{t("ownTab.edit.addRow")}</span>
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
                <span className="hidden lg:inline">{t("ownTab.edit.clear")}</span>
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
                <span className="hidden lg:inline">{t("ownTab.edit.reset")}</span>
              </Button>
            </div>
          </div>
        </div>

        <Table className="min-w-[900px]" containerClassName="min-h-0 flex-1">
          <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-background [&_th]:px-2 md:[&_th]:px-4">
            <TableRow>
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
                isDefaultNameColumnVisible={isDefaultNameColumnVisible}
                writeYourOwnLabel={t("ownTab.edit.writeYourOwn")}
                defaultNamePlaceholder={t("ownTab.edit.placeholders.defaultName")}
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
    </div>
  );
};

export default OwnTab;
