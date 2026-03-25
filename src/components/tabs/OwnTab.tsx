import ColorsTab from "@/components/ColorsTab";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Eraser,
  ExternalLink,
  Eye,
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
import OwnEditDialogs from "./own/OwnEditDialogs";
import OwnEditRow from "./own/OwnEditRow";
import { useOwnPaletteEditor } from "./own/use-own-palette-editor";

const OwnTab = () => {
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

  if (activeMode === "use") {
    return (
      <div className="h-full">
        <ColorsTab
          palette={savedPalette}
          swatchMode="duo"
          copyCountsStorageKey={OWN_COPY_COUNTS_STORAGE_KEY}
          topContent={
            <div className="flex items-center justify-between gap-3">
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
    <div className="flex flex-col gap-4">
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

      <div className="border border-border rounded-sm overflow-hidden">
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

        <Table containerClassName="max-h-[60vh]">
          <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-background">
            <TableRow>
              <TableHead>{t("ownTab.edit.columns.code")}</TableHead>
              <TableHead>{t("ownTab.edit.columns.defaultName")}</TableHead>
              <TableHead>{t("ownTab.edit.columns.primary")}</TableHead>
              <TableHead>{t("ownTab.edit.columns.secondary")}</TableHead>
              <TableHead className="w-[110px]">
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
                knownCodeOptions={knownCodeOptions}
                selectedCodeLabel={
                  row.selectedCode
                    ? (knownCodeLabelsByCode.get(row.selectedCode) ?? null)
                    : null
                }
                isCodeSelectOpen={openCodeSelectRowId === row.id}
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
