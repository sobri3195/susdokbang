import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { AlertTriangle, ArrowUpDown, ChevronLeft, ChevronRight, DatabaseZap, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  error?: unknown;
  onRetry?: () => void;
};

function readableError(error: unknown) {
  if (!error) return "";
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Respons API tidak dapat diproses.";
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Cari data...",
  emptyTitle = "Belum ada data operasional",
  emptyDescription = "Data belum tersedia untuk modul ini. Mulai dari Import Cerdas atau sinkronisasi ulang sumber data.",
  emptyActionLabel = "Import Data",
  onEmptyAction,
  error,
  onRetry,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 6 } },
  });
  const defaultEmptyAction = () => {
    window.location.href = "/import";
  };
  const defaultRetryAction = () => {
    window.location.reload();
  };

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Data gagal dimuat"
        description={`Diagnosis ringan: ${readableError(error)} Periksa koneksi API, token sesi, atau gunakan mode demo bila backend sedang offline.`}
        actionLabel="Coba Lagi"
        onAction={onRetry ?? defaultRetryAction}
      />
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={DatabaseZap}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction ?? defaultEmptyAction}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={globalFilter} onChange={(event) => setGlobalFilter(event.target.value)} placeholder={searchPlaceholder} className="pl-9" />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="max-h-[560px] overflow-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 text-left"
                          onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                          disabled={!header.column.getCanSort()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() ? <ArrowUpDown className="size-3" aria-hidden="true" /> : null}
                        </button>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <EmptyState icon={Search} title="Data tidak ditemukan" description="Coba ubah kata kunci atau filter pencarian." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount() || 1}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Halaman sebelumnya">
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Halaman berikutnya">
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
