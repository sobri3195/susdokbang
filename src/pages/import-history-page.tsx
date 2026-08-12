import { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { queryFns } from "@/lib/queries";
import type { ImportJobHistory } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";

const columns: ColumnDef<ImportJobHistory>[] = [
  { accessorKey: "id", header: "Import ID", cell: ({ row }) => <span className="font-semibold">{row.original.id}</span> },
  { accessorKey: "filename", header: "File" },
  { accessorKey: "filetype", header: "Tipe", cell: ({ row }) => <Badge variant="secondary">{row.original.filetype}</Badge> },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant={row.original.status === "committed" ? "success" : row.original.status === "failed" ? "danger" : "warning"}>{row.original.status}</Badge> },
  { accessorKey: "totalRows", header: "Rows", cell: ({ row }) => <span className="tabular">{formatNumber(row.original.totalRows)}</span> },
  { accessorKey: "inserted", header: "Inserted", cell: ({ row }) => <span className="tabular">{formatNumber(row.original.inserted)}</span> },
  { accessorKey: "updated", header: "Updated", cell: ({ row }) => <span className="tabular">{formatNumber(row.original.updated)}</span> },
  { accessorKey: "failed", header: "Failed", cell: ({ row }) => <span className="tabular">{formatNumber(row.original.failed)}</span> },
  { accessorKey: "createdAt", header: "Tanggal", cell: ({ row }) => formatDate(row.original.createdAt) },
  { accessorKey: "user", header: "User" },
];

export function ImportHistoryPage() {
  const { data = [] } = useQuery({ queryKey: ["import-history"], queryFn: queryFns.importHistory });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Audit trail"
        title="Riwayat Import"
        description="Log import file, status parsing, hasil commit, duplikat, dan baris gagal untuk kebutuhan audit."
        actions={<Button variant="outline"><RotateCcw />Refresh</Button>}
      />
      <ImportHistoryTable rows={data} />
    </div>
  );
}

export function ImportHistoryTable({ rows }: { rows: ImportJobHistory[] }) {
  return <DataTable columns={columns} data={rows} searchPlaceholder="Cari ID, file, user..." />;
}
