import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Edit, Eye, Filter, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { KelaikanStatus, Penerbang } from "@/lib/types";
import { queryFns } from "@/lib/queries";
import { cn, formatNumber } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";

const penerbangSchema = z.object({
  nrp: z.string().min(4, "NRP minimal 4 digit"),
  nama: z.string().min(3, "Nama wajib diisi"),
  pangkat: z.string().min(2, "Pangkat wajib diisi"),
  skadron: z.string().min(2, "Satuan wajib diisi"),
  usia: z.coerce.number().min(20, "Usia tidak wajar").max(65, "Usia tidak wajar"),
  kategoriPesawat: z.enum(["Tempur", "Angkut", "Helikopter", "Latih"]),
  status: z.enum(["Laik", "Observasi", "Terbatas", "Tidak Laik"]),
  totalJam: z.coerce.number().min(0, "Jam tidak valid"),
  tanggalMasuk: z.string().min(1, "Tanggal masuk wajib diisi"),
  riskScore: z.coerce.number().min(0).max(100),
});

type PenerbangFormValues = z.infer<typeof penerbangSchema>;
type FilterPresetKey = "all" | "fighterHighRisk" | "unfit2023_2026" | "stress60";

function toFormValues(row?: Penerbang): PenerbangFormValues {
  return {
    nrp: row?.nrp ?? "",
    nama: row?.nama ?? "",
    pangkat: row?.pangkat ?? "Kapten",
    skadron: row?.skadron ?? "Skadron Udara 3",
    usia: row?.usia ?? 34,
    kategoriPesawat: row?.kategoriPesawat ?? "Tempur",
    status: row?.status ?? "Laik",
    totalJam: row?.totalJam ?? 0,
    tanggalMasuk: row?.tanggalMasuk ?? "2026-08-11",
    riskScore: row?.riskScore ?? 20,
  };
}

function PenerbangDialog({ row, onSave, trigger }: { row?: Penerbang; onSave: (values: PenerbangFormValues, row?: Penerbang) => void; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const form = useForm<PenerbangFormValues>({
    resolver: zodResolver(penerbangSchema),
    values: toFormValues(row),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{row ? "Edit Penerbang" : "Tambah Penerbang"}</DialogTitle>
          <DialogDescription>Data ini langsung masuk ke tabel demo dan mempengaruhi Dashboard.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={form.handleSubmit((values) => {
            onSave(values, row);
            setOpen(false);
          })}
        >
          <Field label="NRP" error={form.formState.errors.nrp?.message}><Input {...form.register("nrp")} /></Field>
          <Field label="Nama" error={form.formState.errors.nama?.message}><Input {...form.register("nama")} /></Field>
          <Field label="Pangkat" error={form.formState.errors.pangkat?.message}><Input {...form.register("pangkat")} /></Field>
          <Field label="Satuan" error={form.formState.errors.skadron?.message}><Input {...form.register("skadron")} /></Field>
          <Field label="Usia" error={form.formState.errors.usia?.message}><Input type="number" {...form.register("usia")} /></Field>
          <Field label="Total Jam" error={form.formState.errors.totalJam?.message}><Input type="number" step="0.1" {...form.register("totalJam")} /></Field>
          <Field label="Kategori Pesawat">
            <Select value={form.watch("kategoriPesawat")} onValueChange={(value) => form.setValue("kategoriPesawat", value as PenerbangFormValues["kategoriPesawat"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Tempur", "Angkut", "Helikopter", "Latih"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value as KelaikanStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Laik", "Observasi", "Terbatas", "Tidak Laik"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Tanggal Masuk" error={form.formState.errors.tanggalMasuk?.message}><Input type="date" {...form.register("tanggalMasuk")} /></Field>
          <Field label="Skor Risiko" error={form.formState.errors.riskScore?.message}><Input type="number" min="0" max="100" {...form.register("riskScore")} /></Field>
          <div className="flex justify-end gap-2 md:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      <p className="min-h-5 text-xs text-destructive">{error}</p>
    </div>
  );
}

export function PenerbangPage() {
  const queryClient = useQueryClient();
  const upsertPenerbang = useDataStore((state) => state.upsertPenerbang);
  const deletePenerbang = useDataStore((state) => state.deletePenerbang);
  const { data = [], error, refetch } = useQuery({ queryKey: ["penerbang"], queryFn: queryFns.penerbang });
  const { data: psikotes = [] } = useQuery({ queryKey: ["psikotes"], queryFn: queryFns.psikotes });
  const [activePreset, setActivePreset] = useState<FilterPresetKey>("all");

  function matchesPreset(row: Penerbang, preset: FilterPresetKey) {
    if (preset === "all") return true;
    if (preset === "fighterHighRisk") return row.kategoriPesawat === "Tempur" && row.riskScore >= 55;
    if (preset === "unfit2023_2026") return row.status !== "Laik" && Boolean(row.eventDate && row.eventDate >= "2023-01-01" && row.eventDate <= "2026-12-31");
    return psikotes.some((record) => record.penerbangId === row.id && record.stressIndex > 60);
  }

  const filterPresets = [
    { key: "all" as const, label: "Semua Penerbang", description: "Tampilan master data aktif" },
    { key: "fighterHighRisk" as const, label: "Tempur risiko tinggi", description: "Kategori tempur dengan skor >= 55" },
    { key: "unfit2023_2026" as const, label: "Tidak laik 2023-2026", description: "Event observasi, terbatas, atau tidak laik" },
    { key: "stress60" as const, label: "Stress index > 60", description: "Berdasarkan hasil psikotes terakhir/riwayat" },
  ].map((preset) => ({ ...preset, count: data.filter((row) => matchesPreset(row, preset.key)).length }));

  const filteredData = data.filter((row) => matchesPreset(row, activePreset));

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["penerbang"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["mcu"] });
    void queryClient.invalidateQueries({ queryKey: ["psikotes"] });
    void queryClient.invalidateQueries({ queryKey: ["jam-terbang"] });
  }

  function save(values: PenerbangFormValues, row?: Penerbang) {
    upsertPenerbang({
      id: row?.id ?? `P-${Date.now()}`,
      ...values,
      eventDate: values.status === "Laik" ? undefined : row?.eventDate ?? new Date().toISOString().slice(0, 10),
    });
    invalidate();
    toast.success(row ? "Data penerbang diperbarui" : "Penerbang baru ditambahkan");
  }

  function remove(row: Penerbang) {
    deletePenerbang(row.id);
    invalidate();
    toast.success("Penerbang dan data terkait dihapus");
  }

  function exportCsv() {
    const rows = ["NRP,Nama,Pangkat,Satuan,Kategori,Usia,Total Jam,Status,Risk Score", ...filteredData.map((row) => `${row.nrp},"${row.nama}",${row.pangkat},"${row.skadron}",${row.kategoriPesawat},${row.usia},${row.totalJam},${row.status},${row.riskScore}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "csakt-data-penerbang.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV data penerbang dibuat");
  }

  const columns: ColumnDef<Penerbang>[] = [
    { accessorKey: "nrp", header: "NRP" },
    { accessorKey: "nama", header: "Nama", cell: ({ row }) => <span className="font-semibold">{row.original.nama}</span> },
    { accessorKey: "pangkat", header: "Pangkat" },
    { accessorKey: "skadron", header: "Satuan" },
    { accessorKey: "kategoriPesawat", header: "Kategori" },
    { accessorKey: "usia", header: "Usia", cell: ({ row }) => <span className="tabular">{row.original.usia}</span> },
    { accessorKey: "totalJam", header: "Jam", cell: ({ row }) => <span className="tabular text-right">{formatNumber(row.original.totalJam)}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" asChild aria-label={`Lihat detail ${row.original.nama}`}>
            <Link to={`/penerbang/${row.original.id}`}><Eye /></Link>
          </Button>
          <PenerbangDialog row={row.original} onSave={save} trigger={<Button variant="ghost" size="icon" aria-label={`Edit ${row.original.nama}`}><Edit /></Button>} />
          <ConfirmDialog
            title="Hapus penerbang?"
            description="Data MCU, psikotes, dan jam terbang terkait juga akan dihapus dari tampilan demo."
            onConfirm={() => remove(row.original)}
            trigger={<Button variant="ghost" size="icon" aria-label={`Hapus ${row.original.nama}`}><Trash2 /></Button>}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master data"
        title="Data Penerbang"
        description="Daftar penerbang dengan status kelaikan, satuan, kategori pesawat, dan ringkasan paparan jam terbang."
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}><Download />Export CSV</Button>
            <PenerbangDialog onSave={save} trigger={<Button variant="accent"><Plus />Tambah Penerbang</Button>} />
          </>
        }
      />
      <section className="grid gap-3 lg:grid-cols-4" aria-label="Filter tersimpan">
        {filterPresets.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => setActivePreset(preset.key)}
            className={cn(
              "rounded-xl border bg-card p-4 text-left transition hover:border-accent/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activePreset === preset.key && "border-accent bg-accent/8 shadow-sm",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-bold">
                <Filter className="size-4 text-accent" aria-hidden="true" />
                {preset.label}
              </span>
              <Badge variant={activePreset === preset.key ? "info" : "secondary"}>{preset.count}</Badge>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{preset.description}</p>
          </button>
        ))}
      </section>
      <DataTable
        columns={columns}
        data={filteredData}
        searchPlaceholder="Cari nama, NRP, satuan..."
        error={error}
        onRetry={() => void refetch()}
        emptyTitle={data.length ? "Preset belum menemukan penerbang" : "Belum ada data penerbang"}
        emptyDescription={data.length ? "Tidak ada baris yang memenuhi filter tersimpan ini. Reset filter untuk kembali ke seluruh master data." : "Master data penerbang belum tersedia. Gunakan Import Cerdas untuk memuat data dummy atau file operasional."}
        emptyActionLabel={data.length ? "Reset Filter" : "Import Data"}
        onEmptyAction={data.length ? () => setActivePreset("all") : undefined}
      />
    </div>
  );
}
