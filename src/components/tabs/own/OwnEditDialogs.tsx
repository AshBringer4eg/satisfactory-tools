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
}: OwnEditDialogsProps) => (
  <>
    <Dialog open={isImportDialogOpen} onOpenChange={onImportDialogOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("ownTab.edit.import.title")}</DialogTitle>
        </DialogHeader>
        <Textarea
          rows={8}
          value={importBase64}
          onChange={(event) => onImportBase64Change(event.target.value)}
          placeholder={t("ownTab.edit.import.placeholder")}
          aria-label={t("ownTab.edit.import.title")}
          className="font-mono text-[11px]"
        />
        <DialogFooter>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onImportToDraft}
          >
            {t("ownTab.edit.import.load")}
          </Button>
        </DialogFooter>
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
          className="font-mono text-[11px]"
        />
        <DialogFooter>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onCopyExport}
            disabled={!exportBase64}
          >
            {t("ownTab.edit.export.copy")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
);

export default OwnEditDialogs;
