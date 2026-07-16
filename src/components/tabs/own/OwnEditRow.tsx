import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useColorAccessibility } from "@/components/accessibility/color-accessibility-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import type { OwnPaletteDraftRow } from "@/data/own-palette";
import {
  getSwatchOverlayToken,
  type SwatchOverlayToken,
  type VisionMode,
} from "@/lib/color-accessibility";
import { cn } from "@/lib/utils";
import OwnColorPicker from "./OwnColorPicker";
import type { OwnEditableField, KnownCodeOption } from "./types";
import { maskHexColorInput, OWN_CUSTOM_CODE_SENTINEL } from "./utils";

type ColorInputWithPickerProps = {
  value: string;
  placeholder: string;
  assistToken: SwatchOverlayToken;
  showSymbols: boolean;
  showPatterns: boolean;
  pickerFallbackValue?: string;
  visionMode: VisionMode;
  inputAriaLabel: string;
  inputTestId?: string;
  onChange: (value: string) => void;
};

type OwnEditRowProps = {
  rowIndex: number;
  row: OwnPaletteDraftRow;
  knownCodeOptions: KnownCodeOption[];
  selectedCodeLabel: string | null;
  isCodeSelectOpen: boolean;
  hasValidationError: boolean;
  isDefaultNameColumnVisible: boolean;
  writeYourOwnLabel: string;
  defaultNamePlaceholder: string;
  secondaryPlaceholder: string;
  removeLabel: string;
  onCodeSelectOpenChange: (rowId: string, isOpen: boolean) => void;
  onKnownCodeChange: (rowId: string, rawValue: string) => void;
  onDraftFieldChange: (
    rowId: string,
    field: OwnEditableField,
    value: string,
  ) => void;
  onRemoveRow: (rowId: string) => void;
};

const COLOR_INPUT_COMMIT_DELAY_MS = 300;

const ColorInputWithPicker = ({
  value,
  placeholder,
  assistToken,
  showSymbols,
  showPatterns,
  pickerFallbackValue,
  visionMode,
  inputAriaLabel,
  inputTestId,
  onChange,
}: ColorInputWithPickerProps) => {
  const [draftValue, setDraftValue] = useState(value.toUpperCase());
  const commitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingCommit = useCallback(() => {
    if (!commitTimeoutRef.current) return;
    clearTimeout(commitTimeoutRef.current);
    commitTimeoutRef.current = null;
  }, []);

  const commitValue = useCallback(
    (nextValue: string) => {
      clearPendingCommit();
      if (nextValue !== value) {
        onChange(nextValue);
      }
    },
    [clearPendingCommit, onChange, value],
  );

  useEffect(() => {
    clearPendingCommit();
    setDraftValue(value.toUpperCase());
  }, [clearPendingCommit, value]);

  useEffect(() => clearPendingCommit, [clearPendingCommit]);

  const scheduleCommit = useCallback(
    (nextValue: string) => {
      clearPendingCommit();
      commitTimeoutRef.current = setTimeout(() => {
        commitTimeoutRef.current = null;
        if (nextValue !== value) {
          onChange(nextValue);
        }
      }, COLOR_INPUT_COMMIT_DELAY_MS);
    },
    [clearPendingCommit, onChange, value],
  );

  const handleTextChange = (nextRawValue: string) => {
    const nextValue = maskHexColorInput(nextRawValue);
    setDraftValue(nextValue);
    scheduleCommit(nextValue);
  };

  const handlePickerChange = (nextValue: string) => {
    setDraftValue(nextValue);
    commitValue(nextValue);
  };

  return (
    <div className="flex w-full items-center rounded-md border border-input bg-background ring-offset-background transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      <Input
        value={draftValue}
        onChange={(event) => handleTextChange(event.target.value)}
        onBlur={() => commitValue(draftValue)}
        placeholder={placeholder}
        aria-label={inputAriaLabel}
        data-testid={inputTestId}
        className="min-w-0 flex-1 rounded-none border-0 bg-transparent font-mono focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <OwnColorPicker
        value={draftValue}
        fallbackValue={pickerFallbackValue}
        assistToken={assistToken}
        showSymbols={showSymbols}
        showPatterns={showPatterns}
        visionMode={visionMode}
        ariaLabel={inputAriaLabel}
        testId={`${inputTestId ?? "own-row-color"}-picker`}
        triggerClassName="rounded-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        onChange={handlePickerChange}
      />
    </div>
  );
};

const OwnEditRow = memo(
  ({
    rowIndex,
    row,
    knownCodeOptions,
    selectedCodeLabel,
    isCodeSelectOpen,
    hasValidationError,
    isDefaultNameColumnVisible,
    writeYourOwnLabel,
    defaultNamePlaceholder,
    secondaryPlaceholder,
    removeLabel,
    onCodeSelectOpenChange,
    onKnownCodeChange,
    onDraftFieldChange,
    onRemoveRow,
  }: OwnEditRowProps) => {
    const { settings } = useColorAccessibility();
    const primaryHex = row.hex.trim();
    const hasKnownSelectedCode = Boolean(row.selectedCode && selectedCodeLabel);
    const selectedCodeValue = hasKnownSelectedCode && row.selectedCode
      ? row.selectedCode
      : OWN_CUSTOM_CODE_SENTINEL;
    const selectedCodeText = selectedCodeLabel ?? row.defaultName;

    const assistIdentity =
      hasKnownSelectedCode && row.selectedCode ? row.selectedCode : row.id;
    const primaryAssistToken = getSwatchOverlayToken(assistIdentity, "primary");
    const secondaryAssistToken = getSwatchOverlayToken(assistIdentity, "secondary");

    return (
      <TableRow
        className={cn(
          hasValidationError &&
            "border-destructive/60 bg-destructive/10 hover:bg-destructive/15",
        )}
      >
        <TableCell
          className={cn(
            "w-[56px] p-2 text-right font-mono text-xs tabular-nums text-muted-foreground md:p-4",
            hasValidationError && "text-destructive",
          )}
          aria-label={`Row ${rowIndex + 1}`}
          data-testid="own-row-number"
        >
          <a
            id={`own-row-${rowIndex + 1}`}
            href={`#own-row-${rowIndex + 1}`}
            className="inline-flex min-w-6 scroll-mt-24 justify-end rounded-sm px-1 py-0.5 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {rowIndex + 1}
          </a>
        </TableCell>
        <TableCell className="w-[220px] p-2 md:p-4">
          <Select
            value={selectedCodeValue}
            open={isCodeSelectOpen}
            onOpenChange={(nextOpen) =>
              onCodeSelectOpenChange(row.id, nextOpen)
            }
            onValueChange={(value) => onKnownCodeChange(row.id, value)}
          >
            <SelectTrigger
              aria-label={`Code selector for row ${rowIndex + 1}`}
              data-testid="own-row-code-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={OWN_CUSTOM_CODE_SENTINEL}>
                {writeYourOwnLabel}
              </SelectItem>
              {isCodeSelectOpen ? (
                knownCodeOptions.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.label}
                  </SelectItem>
                ))
              ) : row.selectedCode && selectedCodeLabel ? (
                <SelectItem value={row.selectedCode}>
                  {selectedCodeLabel}
                </SelectItem>
              ) : null}
            </SelectContent>
          </Select>
        </TableCell>
        {isDefaultNameColumnVisible ? (
          <TableCell className="min-w-[280px] p-2 md:p-4">
            {hasKnownSelectedCode ? (
              <div
                data-testid="own-row-default-name-label"
                className="h-10 px-3 border border-input rounded-md bg-muted/30 flex items-center text-sm"
                title={selectedCodeText}
              >
                {selectedCodeText}
              </div>
            ) : (
              <Input
                value={row.defaultName}
                onChange={(event) =>
                  onDraftFieldChange(row.id, "defaultName", event.target.value)
                }
                placeholder={defaultNamePlaceholder}
                aria-label={`Default name for row ${rowIndex + 1}`}
                data-testid="own-row-default-name-input"
              />
            )}
          </TableCell>
        ) : (
          <TableCell className="w-[64px] p-2 md:p-4" />
        )}
        <TableCell className="w-[170px] p-2 md:p-4">
          <ColorInputWithPicker
            value={row.hex}
            onChange={(value) => onDraftFieldChange(row.id, "hex", value)}
            placeholder="#112233"
            inputAriaLabel={`Primary color for row ${rowIndex + 1}`}
            inputTestId="own-row-primary-input"
            assistToken={primaryAssistToken}
            showSymbols={settings.showSymbols}
            showPatterns={settings.showPatterns}
            visionMode={settings.visionMode}
          />
        </TableCell>
        <TableCell className="w-[170px] p-2 md:p-4">
          <ColorInputWithPicker
            value={row.secondaryColor}
            onChange={(value) =>
              onDraftFieldChange(row.id, "secondaryColor", value)
            }
            placeholder={secondaryPlaceholder}
            inputAriaLabel={`Secondary color for row ${rowIndex + 1}`}
            inputTestId="own-row-secondary-input"
            assistToken={secondaryAssistToken}
            showSymbols={settings.showSymbols}
            showPatterns={settings.showPatterns}
            pickerFallbackValue={primaryHex}
            visionMode={settings.visionMode}
          />
        </TableCell>
        <TableCell className="w-[88px] p-2 md:p-4">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onRemoveRow(row.id)}
            aria-label={`${removeLabel} row ${rowIndex + 1}`}
            className="px-2 lg:px-3"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </TableCell>
      </TableRow>
    );
  },
);

OwnEditRow.displayName = "OwnEditRow";

export default OwnEditRow;
