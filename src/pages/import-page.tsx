import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, CheckCircle2, DatabaseZap, Download, FileSpreadsheet, FileText, History, Loader2, Save, UploadCloud, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { queryFns } from "@/lib/queries";
import type { ImportCleanRow, ImportDetectedTable, ImportMapping, ImportUploadedFile } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import { useImportStore } from "@/store/import-store";

const targetFields = [
  "abaikan",
  "nrp",
  "nrp,nama",
  "nama",
  "pangkat",
  "skadron",
  "tanggal",
  "tekanan_darah",
  "sys",
  "dia",
  "bmi",
  "kolesterol",
  "gula_darah",
  "stress_index",
  "atensi",
  "stabilitas_emosi",
  "jenis_pesawat",
  "durasi_jam",
  "malam",
  "rekomendasi",
];

const templateSchema = z.object({
  templateName: z.string().min(3, "Nama template minimal 3 karakter"),
});

type TemplateValues = z.infer<typeof templateSchema>;

const steps = [
  { id: "upload", label: "Upload" },
  { id: "preview", label: "Preview Mentah" },
  { id: "mapping", label: "Auto-Mapping" },
  { id: "validate", label: "Validasi & Commit" },
] as const;

export function ImportPage() {
  const {
    step,
    setStep,
    files,
    setFiles,
    setImportId,
    detectedTables,
    setDetectedTables,
    mappings,
    setMappings,
    cleanRows,
    setCleanRows,
    reset,
  } = useImportStore();

  const previewQuery = useQuery({ queryKey: ["import-preview"], queryFn: queryFns.importPreview, enabled: step !== "upload" });
  const validateQuery = useQuery({ queryKey: ["import-validate"], queryFn: queryFns.importValidate, enabled: step === "validate" });

  const uploadMutation = useMutation({
    mutationFn: async (selectedFiles: File[]) => {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      const uploaded: ImportUploadedFile[] = selectedFiles.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.name.toLowerCase().endsWith(".docx") ? "docx" : file.name.toLowerCase().endsWith(".xls") ? "xls" : "xlsx",
        status: "parsed",
        progress: 100,
      }));
      return { importId: `IMP-${Date.now()}`, files: uploaded };
    },
    onSuccess: (result) => {
      setImportId(result.importId);
      setFiles(result.files);
      toast.success("File terbaca dan siap dipratinjau");
      setStep("preview");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Upload gagal"),
  });

  const validateMutation = useMutation({
    mutationFn: async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      return validateQuery.data?.rows ?? [];
    },
    onSuccess: (rows) => {
      setCleanRows(rows);
      toast.success("Normalisasi dan validasi selesai");
    },
  });

  const commitMutation = useMutation({
    mutationFn: async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      const validRows = cleanRows.filter((row) => row.status !== "error").length || 3;
      return { inserted: validRows, updated: 1, skipped: 1, failed: cleanRows.filter((row) => row.status === "error").length };
    },
    onSuccess: (summary) => {
      toast.success(`Import selesai: ${summary.inserted} masuk, ${summary.updated} update, ${summary.skipped} duplikat dilewati`);
      reset();
    },
  });

  const effectiveTables = detectedTables.length ? detectedTables : previewQuery.data?.detectedTables ?? [];
  const effectiveMappings = mappings.length ? mappings : previewQuery.data?.mappings ?? [];
  const effectiveRows = cleanRows.length ? cleanRows : validateQuery.data?.rows ?? [];

  function acceptPreview() {
    setDetectedTables(previewQuery.data?.detectedTables ?? []);
    setMappings(previewQuery.data?.mappings ?? []);
    setStep("mapping");
  }

  function updateMapping(id: string, targetField: string) {
    setMappings(effectiveMappings.map((mapping) => (mapping.id === id ? { ...mapping, targetField, confidence: targetField === "abaikan" ? 100 : mapping.confidence } : mapping)));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Import cerdas"
        title="Messy In, Clean Out"
        description="Upload XLS, XLSX, dan DOCX mentah dari Lakespra. Sistem mengekstrak tabel/paragraf, menebak entitas, memetakan kolom, menormalisasi nilai, lalu menampilkan preview sebelum commit."
        actions={<Button variant="outline" asChild><Link to="/import/history"><History />Riwayat Import</Link></Button>}
      />

      <Stepper activeStep={step} />

      {step === "upload" ? (
        <UploadStep loading={uploadMutation.isPending} onUpload={(selectedFiles) => uploadMutation.mutate(selectedFiles)} />
      ) : null}

      {step === "preview" ? (
        <PreviewStep
          files={files}
          tables={effectiveTables}
          loading={previewQuery.isLoading}
          onBack={() => setStep("upload")}
          onContinue={acceptPreview}
        />
      ) : null}

      {step === "mapping" ? (
        <MappingStep
          mappings={effectiveMappings}
          onMappingChange={updateMapping}
          onBack={() => setStep("preview")}
          onContinue={() => {
            setMappings(effectiveMappings);
            setStep("validate");
            validateMutation.mutate();
          }}
        />
      ) : null}

      {step === "validate" ? (
        <ValidateStep
          rows={effectiveRows}
          loading={validateQuery.isLoading || validateMutation.isPending}
          committing={commitMutation.isPending}
          onBack={() => setStep("mapping")}
          onCommit={() => commitMutation.mutate()}
        />
      ) : null}
    </div>
  );
}

function Stepper({ activeStep }: { activeStep: string }) {
  const activeIndex = steps.findIndex((item) => item.id === activeStep);
  return (
    <Card>
      <CardContent className="grid gap-3 p-4 md:grid-cols-4">
        {steps.map((item, index) => {
          const active = item.id === activeStep;
          const done = index < activeIndex;
          return (
            <div key={item.id} className={cn("flex items-center gap-3 rounded-lg border p-3", active && "border-accent bg-accent/10", done && "border-success/30 bg-success/10")}>
              <div className={cn("flex size-8 items-center justify-center rounded-full bg-muted text-sm font-bold", active && "bg-accent text-accent-foreground", done && "bg-success text-white")}>
                {done ? <CheckCircle2 className="size-4" /> : index + 1}
              </div>
              <span className="text-sm font-bold">{item.label}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function UploadStep({ loading, onUpload }: { loading: boolean; onUpload: (files: File[]) => void }) {
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<File[]>([]);

  function handleFiles(fileList: FileList | null) {
    const next = Array.from(fileList ?? []);
    const allowed = next.filter((file) => /\.(xls|xlsx|docx)$/i.test(file.name) && file.size <= 25 * 1024 * 1024);
    setError(allowed.length !== next.length ? "Sebagian file ditolak. Gunakan .xls, .xlsx, .docx dengan ukuran maksimal 25 MB." : "");
    setSelected(allowed);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Multi-File</CardTitle>
        <CardDescription>Drag & drop file mentah, termasuk header typo, merged cells, catatan kaki, atau paragraf naratif.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileDropzone onFiles={handleFiles} />
        {error ? <p className="rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
        {selected.length ? (
          <div className="space-y-2">
            {selected.map((file) => (
              <div key={file.name} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  {file.name.endsWith(".docx") ? <FileText className="size-5 text-accent" /> : <FileSpreadsheet className="size-5 text-success" />}
                  <div>
                    <p className="text-sm font-bold">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatNumber(Math.round(file.size / 1024))} KB</p>
                  </div>
                </div>
                <Badge variant="info">Queued</Badge>
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex justify-end">
          <Button disabled={!selected.length || loading} onClick={() => onUpload(selected)}>
            {loading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
            Parse Otomatis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function FileDropzone({ onFiles }: { onFiles: (files: FileList | null) => void }) {
  return (
    <Label
      htmlFor="import-files"
      className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-muted/25 p-8 text-center transition-colors hover:bg-muted/45"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onFiles(event.dataTransfer.files);
      }}
    >
      <UploadCloud className="size-10 text-accent" aria-hidden="true" />
      <span className="mt-4 text-base font-extrabold">Tarik file ke sini atau pilih dari komputer</span>
      <span className="mt-2 max-w-xl text-sm font-normal leading-6 text-muted-foreground">Mendukung .xls, .xlsx, .docx. Parser akan melewati logo, baris kosong, subtotal, catatan kaki, dan mencoba mendeteksi multi-tabel.</span>
      <Input id="import-files" type="file" multiple accept=".xls,.xlsx,.docx" className="sr-only" onChange={(event) => onFiles(event.target.files)} />
    </Label>
  );
}

function PreviewStep({ files, tables, loading, onBack, onContinue }: { files: ImportUploadedFile[]; tables: ImportDetectedTable[]; loading: boolean; onBack: () => void; onContinue: () => void }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Status Parsing</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {files.map((file) => (
            <div key={file.id} className="rounded-xl border p-4">
              <p className="font-bold">{file.name}</p>
              <p className="mt-1 text-xs uppercase text-muted-foreground">{file.type}</p>
              <div className="mt-3 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${file.progress}%` }} /></div>
            </div>
          ))}
        </CardContent>
      </Card>
      {loading ? <Skeleton className="h-96" /> : <ParsePreviewTable tables={tables} />}
      <WizardActions onBack={onBack} onContinue={onContinue} continueLabel="Lanjut Mapping" />
    </div>
  );
}

export function ParsePreviewTable({ tables }: { tables: ImportDetectedTable[] }) {
  return (
    <div className="space-y-4">
      {tables.map((table) => (
        <Card key={table.id}>
          <CardHeader>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>{table.sourceName}{table.sheetName ? ` - ${table.sheetName}` : ""}</CardTitle>
                <CardDescription>Header tebakan baris {table.headerRow}, {table.rowsDetected} baris terdeteksi</CardDescription>
              </div>
              <div className="flex gap-2"><Badge variant="secondary">{table.entity}</Badge><ConfidenceBadge confidence={table.confidence} /></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto rounded-xl border">
              <Table>
                <TableBody>
                  {table.rawPreview.map((row, index) => (
                    <TableRow key={`${table.id}-${index}`} className={index + 1 === table.headerRow ? "bg-accent/10" : ""}>
                      {row.map((cell, cellIndex) => <TableCell key={`${cell}-${cellIndex}`} className={index + 1 === table.headerRow ? "font-bold" : ""}>{cell || <span className="text-muted-foreground">Kosong</span>}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MappingStep({ mappings, onMappingChange, onBack, onContinue }: { mappings: ImportMapping[]; onMappingChange: (id: string, targetField: string) => void; onBack: () => void; onContinue: () => void }) {
  const form = useForm<TemplateValues>({ resolver: zodResolver(templateSchema), defaultValues: { templateName: "Template MCU LAKESPRA v1" } });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pemetaan Otomatis</CardTitle>
          <CardDescription>Kolom dengan confidence rendah bisa dioverride. Template tersimpan untuk file serupa berikutnya.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <MappingTable mappings={mappings} onMappingChange={onMappingChange} />
          <form
            className="grid gap-3 rounded-xl border bg-muted/25 p-4 md:grid-cols-[1fr_auto]"
            onSubmit={form.handleSubmit(() => toast.success("Mapping template disimpan"))}
          >
            <div className="space-y-2">
              <Label htmlFor="templateName">Nama template mapping</Label>
              <Input id="templateName" {...form.register("templateName")} />
              <p className="min-h-5 text-xs text-destructive">{form.formState.errors.templateName?.message}</p>
            </div>
            <Button className="self-end" type="submit" variant="outline"><Save />Simpan Template</Button>
          </form>
        </CardContent>
      </Card>
      <WizardActions onBack={onBack} onContinue={onContinue} continueLabel="Validasi Data" />
    </div>
  );
}

export function MappingTable({ mappings, onMappingChange }: { mappings: ImportMapping[]; onMappingChange: (id: string, targetField: string) => void }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow><TableHead>Kolom Sumber</TableHead><TableHead>Field Target</TableHead><TableHead>Confidence</TableHead><TableHead>Status</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {mappings.map((mapping) => (
            <TableRow key={mapping.id}>
              <TableCell className="font-semibold">{mapping.sourceColumn}</TableCell>
              <TableCell>
                <Select value={mapping.targetField} onValueChange={(value) => onMappingChange(mapping.id, value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {targetFields.map((field) => <SelectItem key={field} value={field}>{field}</SelectItem>)}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell><ConfidenceBadge confidence={mapping.confidence} /></TableCell>
              <TableCell>{mapping.confidence < 60 ? <Badge variant="danger">Perlu konfirmasi</Badge> : mapping.confidence < 85 ? <Badge variant="warning">Review</Badge> : <Badge variant="success">Auto</Badge>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ValidateStep({ rows, loading, committing, onBack, onCommit }: { rows: ImportCleanRow[]; loading: boolean; committing: boolean; onBack: () => void; onCommit: () => void }) {
  const summary = useMemo(() => ({
    valid: rows.filter((row) => row.status === "valid").length,
    warning: rows.filter((row) => row.status === "warning").length,
    error: rows.filter((row) => row.status === "error").length,
  }), [rows]);
  const errorRows = rows.filter((row) => row.status === "error" || row.issues.length);

  function downloadErrors() {
    const csv = ["row,entity,field,raw_value,reason", ...rows.flatMap((row) => row.issues.map((issue) => `${row.id},${row.entity},${issue.field},"${issue.rawValue}","${issue.reason}"`))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "csakt-import-errors.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {loading ? <Skeleton className="h-40" /> : <ValidationSummary summary={summary} />}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Preview Baris Bersih</CardTitle>
              <CardDescription>Tombol import hanya akan commit baris valid dan warning. Baris error dapat diunduh untuk perbaikan.</CardDescription>
            </div>
            <Button variant="outline" onClick={downloadErrors}><Download />CSV Error</Button>
          </div>
        </CardHeader>
        <CardContent>
          <ErrorRowsTable rows={errorRows} />
        </CardContent>
      </Card>
      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onBack}>Kembali</Button>
        <Button disabled={committing || summary.valid + summary.warning === 0} onClick={onCommit}>
          {committing ? <Loader2 className="animate-spin" /> : <DatabaseZap />}
          Import Baris Valid
        </Button>
      </div>
    </div>
  );
}

export function ValidationSummary({ summary }: { summary: { valid: number; warning: number; error: number } }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard label="Valid" value={formatNumber(summary.valid)} delta="Siap commit" icon={CheckCircle2} tone="success" />
      <StatCard label="Warning" value={formatNumber(summary.warning)} delta="Tetap bisa commit" icon={AlertTriangle} tone="warning" />
      <StatCard label="Error" value={formatNumber(summary.error)} delta="Perlu perbaikan" icon={XCircle} tone="danger" />
    </div>
  );
}

export function ErrorRowsTable({ rows }: { rows: ImportCleanRow[] }) {
  if (!rows.length) {
    return <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Tidak ada error. Semua baris siap diproses.</div>;
  }
  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow><TableHead>Row</TableHead><TableHead>Entitas</TableHead><TableHead>Status</TableHead><TableHead>Masalah</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className={row.status === "error" ? "bg-destructive/8" : "bg-warning/8"}>
              <TableCell className="font-semibold">{row.id}</TableCell>
              <TableCell>{row.entity}</TableCell>
              <TableCell><Badge variant={row.status === "error" ? "danger" : "warning"}>{row.status}</Badge></TableCell>
              <TableCell className="space-y-1">
                {row.issues.map((issue) => <p key={`${row.id}-${issue.field}`} className="text-sm"><span className="font-bold">{issue.field}</span>: {issue.reason}</p>)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  return <Badge variant={confidence >= 85 ? "success" : confidence >= 60 ? "warning" : "danger"}>{confidence}%</Badge>;
}

function WizardActions({ onBack, onContinue, continueLabel }: { onBack: () => void; onContinue: () => void; continueLabel: string }) {
  return (
    <div className="flex justify-between gap-2">
      <Button variant="outline" onClick={onBack}>Kembali</Button>
      <Button onClick={onContinue}>{continueLabel}<ArrowRight /></Button>
    </div>
  );
}
