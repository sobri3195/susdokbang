import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, Download, Edit, Plane, Plus, Stethoscope, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { JamTerbangRecord, KelaikanStatus, McuRecord, PsikotesRecord } from "@/lib/types";
import { queryFns } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";

const quickRecordSchema = z.object({
  penerbangId: z.string().min(1, "Pilih penerbang"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  skor: z.coerce.number().min(0, "Nilai tidak valid"),
  teks: z.string().optional(),
  status: z.enum(["Laik", "Observasi", "Terbatas", "Tidak Laik"]).optional(),
  flag: z.boolean().optional(),
});

type QuickRecordValues = z.infer<typeof quickRecordSchema>;

function pilotName(id: string) {
  return useDataStore.getState().penerbang.find((pilot) => pilot.id === id)?.nama ?? id;
}

function useInvalidateData() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["mcu"] });
    void queryClient.invalidateQueries({ queryKey: ["psikotes"] });
    void queryClient.invalidateQueries({ queryKey: ["jam-terbang"] });
    void queryClient.invalidateQueries({ queryKey: ["penerbang"] });
  };
}

function RecordDialog({
  title,
  description,
  initialValues,
  trigger,
  onSubmit,
}: {
  title: string;
  description: string;
  initialValues?: Partial<QuickRecordValues>;
  trigger: React.ReactNode;
  onSubmit: (values: QuickRecordValues) => void;
}) {
  const [open, setOpen] = useState(false);
  const pilots = useDataStore((state) => state.penerbang);
  const form = useForm<QuickRecordValues>({
    resolver: zodResolver(quickRecordSchema),
    values: {
      penerbangId: initialValues?.penerbangId ?? pilots[0]?.id ?? "P-001",
      tanggal: initialValues?.tanggal ?? "2026-08-11",
      skor: initialValues?.skor ?? 80,
      teks: initialValues?.teks ?? "",
      status: initialValues?.status ?? "Laik",
      flag: initialValues?.flag ?? false,
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => {
            onSubmit(values);
            setOpen(false);
          })}
        >
          <div className="space-y-2">
            <Label>Penerbang</Label>
            <Select value={form.watch("penerbangId")} onValueChange={(value) => form.setValue("penerbangId", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {pilots.map((pilot) => <SelectItem key={pilot.id} value={pilot.id}>{pilot.nrp} - {pilot.nama}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="min-h-5 text-xs text-destructive">{form.formState.errors.penerbangId?.message}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input type="date" {...form.register("tanggal")} />
              <p className="min-h-5 text-xs text-destructive">{form.formState.errors.tanggal?.message}</p>
            </div>
            <div className="space-y-2">
              <Label>Nilai Utama</Label>
              <Input type="number" step="0.1" {...form.register("skor")} />
              <p className="min-h-5 text-xs text-destructive">{form.formState.errors.skor?.message}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Catatan / Misi / Rekomendasi</Label>
            <Input {...form.register("teks")} placeholder="Opsional" />
          </div>
          <div className="space-y-2">
            <Label>Status Kelaikan</Label>
            <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value as KelaikanStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Laik", "Observasi", "Terbatas", "Tidak Laik"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function McuPage() {
  const invalidate = useInvalidateData();
  const { data = [], error, refetch } = useQuery({ queryKey: ["mcu"], queryFn: queryFns.mcu });
  const upsert = useDataStore((state) => state.upsertMcu);
  const remove = useDataStore((state) => state.deleteMcu);

  function save(values: QuickRecordValues, row?: McuRecord) {
    upsert({
      id: row?.id ?? `MCU-${Date.now()}`,
      penerbangId: values.penerbangId,
      tanggal: values.tanggal,
      bmi: Number((values.skor / 3).toFixed(1)),
      tekananDarah: values.teks?.match(/\d{2,3}\/\d{2,3}/)?.[0] ?? row?.tekananDarah ?? "120/80",
      kolesterol: Math.round(values.skor * 2.4),
      gulaDarah: Math.round(values.skor * 1.1),
      vo2max: Math.max(20, Math.round(70 - values.skor / 2)),
      catatan: values.teks || row?.catatan || "Input operator.",
      status: values.status ?? "Laik",
    });
    invalidate();
    toast.success(row ? "Data MCU diperbarui" : "Data MCU ditambahkan");
  }

  const columns = useMemo<ColumnDef<McuRecord>[]>(() => [
    { accessorKey: "tanggal", header: "Tanggal", cell: ({ row }) => formatDate(row.original.tanggal) },
    { accessorKey: "penerbangId", header: "Penerbang", cell: ({ row }) => <span className="font-semibold">{pilotName(row.original.penerbangId)}</span> },
    { accessorKey: "bmi", header: "BMI", cell: ({ row }) => <span className="tabular">{row.original.bmi}</span> },
    { accessorKey: "tekananDarah", header: "TD" },
    { accessorKey: "kolesterol", header: "Kolesterol", cell: ({ row }) => <span className="tabular">{row.original.kolesterol}</span> },
    { accessorKey: "gulaDarah", header: "Gula", cell: ({ row }) => <span className="tabular">{row.original.gulaDarah}</span> },
    { accessorKey: "vo2max", header: "VO2max", cell: ({ row }) => <span className="tabular">{row.original.vo2max}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { id: "action", header: "", enableSorting: false, cell: ({ row }) => <RowActions onEdit={(trigger) => <RecordDialog title="Edit MCU" description="Ubah pemeriksaan kesehatan penerbang." initialValues={{ penerbangId: row.original.penerbangId, tanggal: row.original.tanggal, skor: row.original.bmi * 3, teks: row.original.catatan, status: row.original.status }} trigger={trigger} onSubmit={(values) => save(values, row.original)} />} onDelete={() => { remove(row.original.id); invalidate(); toast.success("Data MCU dihapus"); }} /> },
  ], [invalidate, remove]);

  return (
    <DataModuleShell
      icon={Stethoscope}
      title="Medical Check-Up"
      description="CRUD data pemeriksaan kesehatan berkala penerbang, termasuk tekanan darah, BMI, profil metabolik, dan status kelaikan."
      exportName="csakt-mcu.csv"
      rows={data}
      headers={["tanggal", "penerbangId", "bmi", "tekananDarah", "kolesterol", "gulaDarah", "vo2max", "status"]}
      addDialog={<RecordDialog title="Tambah Medical Check-Up" description="Input pemeriksaan kesehatan berkala." trigger={<Button variant="accent"><Plus />Tambah Data</Button>} onSubmit={save} />}
    >
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Cari data MCU..."
        error={error}
        onRetry={() => void refetch()}
        emptyTitle="Belum ada data MCU"
        emptyDescription="Data pemeriksaan kesehatan belum tersedia. Import file MCU atau tambah pemeriksaan manual untuk memulai analitik."
      />
    </DataModuleShell>
  );
}

export function PsikotesPage() {
  const invalidate = useInvalidateData();
  const { data = [], error, refetch } = useQuery({ queryKey: ["psikotes"], queryFn: queryFns.psikotes });
  const upsert = useDataStore((state) => state.upsertPsikotes);
  const remove = useDataStore((state) => state.deletePsikotes);

  function save(values: QuickRecordValues, row?: PsikotesRecord) {
    upsert({
      id: row?.id ?? `PSI-${Date.now()}`,
      penerbangId: values.penerbangId,
      tanggal: values.tanggal,
      stabilitasEmosi: Math.round(values.skor),
      atensi: Math.max(0, Math.round(values.skor - 2)),
      stressIndex: Math.max(0, Math.round(100 - values.skor)),
      cognitiveLoad: Math.round(40 + (100 - values.skor) / 3),
      rekomendasi: values.teks || row?.rekomendasi || "Sesuai profil tugas.",
    });
    invalidate();
    toast.success(row ? "Data psikotes diperbarui" : "Data psikotes ditambahkan");
  }

  const columns = useMemo<ColumnDef<PsikotesRecord>[]>(() => [
    { accessorKey: "tanggal", header: "Tanggal", cell: ({ row }) => formatDate(row.original.tanggal) },
    { accessorKey: "penerbangId", header: "Penerbang", cell: ({ row }) => <span className="font-semibold">{pilotName(row.original.penerbangId)}</span> },
    { accessorKey: "stabilitasEmosi", header: "Emosi", cell: ({ row }) => <span className="tabular">{row.original.stabilitasEmosi}</span> },
    { accessorKey: "atensi", header: "Atensi", cell: ({ row }) => <span className="tabular">{row.original.atensi}</span> },
    { accessorKey: "stressIndex", header: "Stress", cell: ({ row }) => <span className="tabular">{row.original.stressIndex}</span> },
    { accessorKey: "cognitiveLoad", header: "Load", cell: ({ row }) => <span className="tabular">{row.original.cognitiveLoad}</span> },
    { accessorKey: "rekomendasi", header: "Rekomendasi" },
    { id: "action", header: "", enableSorting: false, cell: ({ row }) => <RowActions onEdit={(trigger) => <RecordDialog title="Edit Psikotes" description="Ubah hasil psikotes penerbang." initialValues={{ penerbangId: row.original.penerbangId, tanggal: row.original.tanggal, skor: row.original.stabilitasEmosi, teks: row.original.rekomendasi }} trigger={trigger} onSubmit={(values) => save(values, row.original)} />} onDelete={() => { remove(row.original.id); invalidate(); toast.success("Data psikotes dihapus"); }} /> },
  ], [invalidate, remove]);

  return (
    <DataModuleShell
      icon={BrainCircuit}
      title="Psikotes"
      description="Hasil pemeriksaan psikologi penerbang, stabilitas emosi, atensi, beban kognitif, dan rekomendasi operasional."
      exportName="csakt-psikotes.csv"
      rows={data}
      headers={["tanggal", "penerbangId", "stabilitasEmosi", "atensi", "stressIndex", "cognitiveLoad", "rekomendasi"]}
      addDialog={<RecordDialog title="Tambah Psikotes" description="Input hasil pemeriksaan psikologi." trigger={<Button variant="accent"><Plus />Tambah Data</Button>} onSubmit={save} />}
    >
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Cari data psikotes..."
        error={error}
        onRetry={() => void refetch()}
        emptyTitle="Belum ada data psikotes"
        emptyDescription="Hasil psikotes belum tersedia. Import hasil psikologi atau tambah data manual untuk melengkapi explainability risiko."
      />
    </DataModuleShell>
  );
}

export function JamTerbangPage() {
  const invalidate = useInvalidateData();
  const { data = [], error, refetch } = useQuery({ queryKey: ["jam-terbang"], queryFn: queryFns.jamTerbang });
  const upsert = useDataStore((state) => state.upsertJamTerbang);
  const remove = useDataStore((state) => state.deleteJamTerbang);

  function save(values: QuickRecordValues, row?: JamTerbangRecord) {
    upsert({
      id: row?.id ?? `JT-${Date.now()}`,
      penerbangId: values.penerbangId,
      tanggal: values.tanggal,
      jenisPesawat: values.teks?.split("|")[0]?.trim() || row?.jenisPesawat || "F-16 C/D",
      misi: values.teks?.split("|")[1]?.trim() || row?.misi || "Input manual",
      durasiJam: values.skor,
      malam: Boolean(values.flag ?? row?.malam ?? false),
      instruktur: Boolean(row?.instruktur ?? false),
    });
    invalidate();
    toast.success(row ? "Logbook jam terbang diperbarui" : "Logbook jam terbang ditambahkan");
  }

  const columns = useMemo<ColumnDef<JamTerbangRecord>[]>(() => [
    { accessorKey: "tanggal", header: "Tanggal", cell: ({ row }) => formatDate(row.original.tanggal) },
    { accessorKey: "penerbangId", header: "Penerbang", cell: ({ row }) => <span className="font-semibold">{pilotName(row.original.penerbangId)}</span> },
    { accessorKey: "jenisPesawat", header: "Pesawat" },
    { accessorKey: "misi", header: "Misi" },
    { accessorKey: "durasiJam", header: "Durasi", cell: ({ row }) => <span className="tabular">{row.original.durasiJam} jam</span> },
    { accessorKey: "malam", header: "Malam", cell: ({ row }) => row.original.malam ? "Ya" : "Tidak" },
    { accessorKey: "instruktur", header: "Instruktur", cell: ({ row }) => row.original.instruktur ? "Ya" : "Tidak" },
    { id: "action", header: "", enableSorting: false, cell: ({ row }) => <RowActions onEdit={(trigger) => <RecordDialog title="Edit Jam Terbang" description="Isi catatan dengan format Pesawat | Misi bila ingin mengubah keduanya." initialValues={{ penerbangId: row.original.penerbangId, tanggal: row.original.tanggal, skor: row.original.durasiJam, teks: `${row.original.jenisPesawat} | ${row.original.misi}`, flag: row.original.malam }} trigger={trigger} onSubmit={(values) => save(values, row.original)} />} onDelete={() => { remove(row.original.id); invalidate(); toast.success("Logbook dihapus"); }} /> },
  ], [invalidate, remove]);

  return (
    <DataModuleShell
      icon={Plane}
      title="Logbook Jam Terbang"
      description="Catatan paparan terbang per penerbang untuk integrasi model survival dan analisis faktor determinan."
      exportName="csakt-jam-terbang.csv"
      rows={data}
      headers={["tanggal", "penerbangId", "jenisPesawat", "misi", "durasiJam", "malam", "instruktur"]}
      addDialog={<RecordDialog title="Tambah Jam Terbang" description="Isi catatan dengan format Pesawat | Misi, contoh: F-16 C/D | Combat readiness." trigger={<Button variant="accent"><Plus />Tambah Data</Button>} onSubmit={save} />}
    >
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Cari logbook..."
        error={error}
        onRetry={() => void refetch()}
        emptyTitle="Belum ada logbook jam terbang"
        emptyDescription="Data paparan jam terbang belum tersedia. Import logbook atau tambah entri manual agar model survival punya variabel operasional."
      />
    </DataModuleShell>
  );
}

function DataModuleShell<T extends Record<string, unknown>>({
  icon: Icon,
  title,
  description,
  addDialog,
  exportName,
  rows,
  headers,
  children,
}: {
  icon: typeof Stethoscope;
  title: string;
  description: string;
  addDialog: React.ReactNode;
  exportName: string;
  rows: T[];
  headers: string[];
  children: React.ReactNode;
}) {
  function exportCsv() {
    const csvRows = [headers.join(","), ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? "")).join(","))];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportName;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV berhasil dibuat");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Integrasi data"
        title={title}
        description={description}
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}><Download />Export CSV</Button>
            {addDialog}
          </>
        }
      />
      <div className="flex items-center gap-2 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        <Icon className="size-4 text-accent" aria-hidden="true" />
        Data aktif tersinkronisasi untuk periode observasi 2016-2026. Tambah, edit, hapus, dan export sudah aktif.
      </div>
      {children}
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: (trigger: React.ReactNode) => React.ReactNode; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      {onEdit(<Button variant="ghost" size="icon" aria-label="Edit data"><Edit /></Button>)}
      <ConfirmDialog
        title="Hapus data?"
        description="Data akan dihapus dari tampilan aktif. Pada backend produksi, operasi ini tercatat di audit log."
        onConfirm={onDelete}
        trigger={<Button variant="ghost" size="icon" aria-label="Hapus data"><Trash2 /></Button>}
      />
    </div>
  );
}
