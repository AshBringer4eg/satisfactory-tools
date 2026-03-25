import { useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/i18n";

const importFormSchema = z.object({
  importBase64: z.string().trim().min(1, "Import string is empty."),
});

type ImportFormValues = z.infer<typeof importFormSchema>;

type OwnEditDialogsProps = {
  isImportDialogOpen: boolean;
  onImportDialogOpenChange: (open: boolean) => void;
  importBase64: string;
  onImportBase64Change: (value: string) => void;
  onImportToDraft: () => void;
  isExportDialogOpen: boolean;
  onExportDialogOpenChange: (open: boolean) => void;
  exportBase64: string;
  onCopyExport: () => void;
};

const OwnEditDialogs = ({
  isImportDialogOpen,
  onImportDialogOpenChange,
  importBase64,
  onImportBase64Change,
  onImportToDraft,
  isExportDialogOpen,
  onExportDialogOpenChange,
  exportBase64,
  onCopyExport,
}: OwnEditDialogsProps) => {
  const importForm = useForm<ImportFormValues>({
    resolver: zodResolver(importFormSchema),
    defaultValues: {
      importBase64,
    },
  });

  const wasImportDialogOpenRef = useRef(false);
  useEffect(() => {
    if (isImportDialogOpen && !wasImportDialogOpenRef.current) {
      importForm.reset({ importBase64 });
    }
    wasImportDialogOpenRef.current = isImportDialogOpen;
  }, [importBase64, importForm, isImportDialogOpen]);

  const handleImportSubmit = importForm.handleSubmit(() => {
    onImportToDraft();
  });

  const importErrorMessage = importForm.formState.errors.importBase64?.message;

  return (
    <>
      <Dialog open={isImportDialogOpen} onOpenChange={onImportDialogOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("ownTab.edit.import.title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleImportSubmit} className="space-y-3">
            <Controller
              name="importBase64"
              control={importForm.control}
              render={({ field }) => (
                <Textarea
                  rows={8}
                  value={field.value}
                  onChange={(event) => {
                    field.onChange(event.target.value);
                    onImportBase64Change(event.target.value);
                  }}
                  placeholder={t("ownTab.edit.import.placeholder")}
                  aria-label={t("ownTab.edit.import.title")}
                  data-testid="own-import-base64-input"
                  className="font-mono text-[11px]"
                />
              )}
            />
            {importErrorMessage ? (
              <p className="text-xs text-destructive" role="alert">
                {importErrorMessage}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="submit"
                size="sm"
                variant="outline"
                data-testid="own-import-load-button"
              >
                {t("ownTab.edit.import.load")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isExportDialogOpen} onOpenChange={onExportDialogOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("ownTab.edit.export.title")}</DialogTitle>
          </DialogHeader>
          <Textarea
            readOnly
            rows={8}
            value={exportBase64}
            placeholder={t("ownTab.edit.export.placeholder")}
            aria-label={t("ownTab.edit.export.title")}
            data-testid="own-export-base64-output"
            className="font-mono text-[11px]"
          />
          <DialogFooter>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onCopyExport}
              disabled={!exportBase64}
              data-testid="own-export-copy-button"
            >
              {t("ownTab.edit.export.copy")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OwnEditDialogs;
