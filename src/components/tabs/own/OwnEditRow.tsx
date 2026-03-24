import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import type { OwnPaletteDraftRow } from "@/data/own-palette";
import type { OwnEditableField, KnownCodeOption } from "./types";
import { isHexColor, OWN_CUSTOM_CODE_SENTINEL } from "./utils";

type ColorInputWithPreviewProps = {
  value: string;
  placeholder: string;
  previewHex: string;
  previewIsValid: boolean;
  previewLabel: string;
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

const ColorInputWithPreview = ({
  value,
  placeholder,
  previewHex,
  previewIsValid,
  previewLabel,
  inputAriaLabel,
  inputTestId,
  onChange,
}: ColorInputWithPreviewProps) => (
  <div className="flex items-center gap-2">
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={inputAriaLabel}
      data-testid={inputTestId}
      className="font-mono"
    />
    <div
      className="h-8 w-8 shrink-0 rounded-sm border border-border grid place-items-center font-mono text-[9px] text-muted-foreground"
      style={previewIsValid ? { backgroundColor: previewHex } : undefined}
      title={previewLabel}
      aria-label={previewLabel}
    >
      {!previewIsValid ? "??" : null}
    </div>
  </div>
);

const OwnEditRow = memo(
  ({
    rowIndex,
    row,
    knownCodeOptions,
    selectedCodeLabel,
    isCodeSelectOpen,
    writeYourOwnLabel,
    defaultNamePlaceholder,
    secondaryPlaceholder,
    removeLabel,
    onCodeSelectOpenChange,
    onKnownCodeChange,
    onDraftFieldChange,
    onRemoveRow,
  }: OwnEditRowProps) => {
    const primaryHex = row.hex.trim();
    const primaryPreviewIsValid = isHexColor(primaryHex);

    const secondaryRaw = row.secondaryColor.trim();
    const secondaryPreviewHex = secondaryRaw || primaryHex;
    const secondaryPreviewIsValid = isHexColor(secondaryPreviewHex);

    return (
      <TableRow>
        <TableCell className="min-w-[220px]">
          <Select
            value={row.selectedCode ?? OWN_CUSTOM_CODE_SENTINEL}
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
        <TableCell className="min-w-[200px]">
          {row.selectedCode ? (
            <div
              data-testid="own-row-default-name-label"
              className="h-10 px-3 border border-input rounded-md bg-muted/30 flex items-center text-sm"
              title={selectedCodeLabel ?? row.defaultName}
            >
              {selectedCodeLabel ?? row.defaultName}
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
        <TableCell className="min-w-[190px]">
          <ColorInputWithPreview
            value={row.hex}
            onChange={(value) => onDraftFieldChange(row.id, "hex", value)}
            placeholder="#112233"
            inputAriaLabel={`Primary color for row ${rowIndex + 1}`}
            inputTestId="own-row-primary-input"
            previewHex={primaryHex}
            previewIsValid={primaryPreviewIsValid}
            previewLabel={
              primaryPreviewIsValid ? primaryHex : "Invalid primary color"
            }
          />
        </TableCell>
        <TableCell className="min-w-[190px]">
          <ColorInputWithPreview
            value={row.secondaryColor}
            onChange={(value) =>
              onDraftFieldChange(row.id, "secondaryColor", value)
            }
            placeholder={secondaryPlaceholder}
            inputAriaLabel={`Secondary color for row ${rowIndex + 1}`}
            inputTestId="own-row-secondary-input"
            previewHex={secondaryPreviewHex}
            previewIsValid={secondaryPreviewIsValid}
            previewLabel={
              secondaryPreviewIsValid
                ? `${secondaryPreviewHex}${secondaryRaw ? "" : " (fallback from primary)"}`
                : "Invalid secondary color"
            }
          />
        </TableCell>
        <TableCell>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onRemoveRow(row.id)}
            aria-label={`${removeLabel} row ${rowIndex + 1}`}
          >
            {removeLabel}
          </Button>
        </TableCell>
      </TableRow>
    );
  },
);

OwnEditRow.displayName = "OwnEditRow";

export default OwnEditRow;
