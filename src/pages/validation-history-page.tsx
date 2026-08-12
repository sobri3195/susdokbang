import { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { queryFns } from "@/lib/queries";
import type { ValidationJobHistory } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const columns: ColumnDef<ValidationJobHistory>[] = [
  { accessorKey: "id", header: "Job ID", cell: ({ row }) => <span className="font-semibold">{row.original.id}</span> },
  { accessorKey: "modelName", header: "Model" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant={row.original.status === "completed" ? "success" : row.original.status === "failed" ? "danger" : "warning"}>{row.original.status}</Badge> },
  { accessorKey: "phStatus", header: "PH", cell: ({ row }) => <Badge variant={row.original.phStatus === "pass" ? "success" : row.original.phStatus === "warning" ? "warning" : "danger"}>{row.original.phStatus}</Badge> },
  { accessorKey: "epvValue", header: "EPV", cell: ({ row }) => <span className="tabular">{row.original.epvValue.toFixed(1)}</span> },
  { accessorKey: "cIndex", header: "C-index", cell: ({ row }) => <span className="tabular">{row.original.cIndex.toFixed(2)}</span> },
  { accessorKey: "createdAt", header: "Tanggal", cell: ({ row }) => formatDate(row.original.createdAt) },
  { accessorKey: "user", header: "User" },
];

export function ValidationHistoryPage() {
  const { data = [] } = useQuery({ queryKey: ["validation-history"], queryFn: queryFns.validationHistory });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Riwayat validasi"
        title="Riwayat Run Validasi Cox"
        description="Audit trail validasi metodologis model Cox, termasuk status PH, EPV, C-index, dan operator."
        actions={<Button variant="accent" asChild><Link to="/analitik/validasi"><PlayCircle />Run Baru</Link></Button>}
      />
      <DataTable data={data} columns={columns} searchPlaceholder="Cari job, model, user..." />
    </div>
  );
}
