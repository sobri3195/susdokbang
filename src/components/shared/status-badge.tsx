import { Badge } from "@/components/ui/badge";
import type { KelaikanStatus } from "@/lib/types";

const variants: Record<KelaikanStatus, "success" | "warning" | "info" | "danger"> = {
  Laik: "success",
  Observasi: "warning",
  Terbatas: "info",
  "Tidak Laik": "danger",
};

export function StatusBadge({ status }: { status: KelaikanStatus }) {
  return <Badge variant={variants[status]}>{status}</Badge>;
}
