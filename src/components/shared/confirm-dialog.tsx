import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type ConfirmDialogProps = {
  trigger: React.ReactNode;
  title: string;
  description: string;
  onConfirm: () => void;
};

export function ConfirmDialog({ trigger, title, description, onConfirm }: ConfirmDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <DialogTrigger asChild>
            <Button variant="outline">Batal</Button>
          </DialogTrigger>
          <DialogTrigger asChild>
            <Button variant="destructive" onClick={onConfirm}>
              Konfirmasi
            </Button>
          </DialogTrigger>
        </div>
      </DialogContent>
    </Dialog>
  );
}
