import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, DatabaseZap, FileWarning, ShieldAlert, ShieldCheck } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { queryFns } from "@/lib/queries";
import type { JamTerbangRecord, McuRecord, Penerbang, PsikotesRecord } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";

type GateSeverity = "pass" | "warning" | "fail";

type GateIssue = {
  id: string;
  severity: GateSeverity;
  category: string;
  entity: string;
  field: string;
  detail: string;
  recommendation: string;
};

export function QualityGatePage() {
  const { data: pilots = [] } = useQuery({ queryKey: ["penerbang"], queryFn: queryFns.penerbang });
  const { data: mcuRows = [] } = useQuery({ queryKey: ["mcu"], queryFn: queryFns.mcu });
  const { data: psikoRows = [] } = useQuery({ queryKey: ["psikotes"], queryFn: queryFns.psikotes });
  const { data: jamRows = [] } = useQuery({ queryKey: ["jam-terbang"], queryFn: queryFns.jamTerbang });

  const issues = buildQualityIssues(pilots, mcuRows, psikoRows, jamRows);
  const fail = issues.filter((issue) => issue.severity === "fail").length;
  const warning = issues.filter((issue) => issue.severity === "warning").length;
  const pass = Math.max(0, 100 - fail * 12 - warning * 4);
  const readiness = fail > 0 ? "Tahan analitik" : warning > 0 ? "Siap dengan catatan" : "Siap analitik";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pre-analytics quality gate"
        title="Validasi Data Sebelum Analitik"
        description="Pemeriksaan otomatis sebelum model Cox dijalankan: missingness, duplikasi NRP, tanggal tidak masuk akal, jam terbang ekstrem, outlier MCU, dan psikotes kosong/berisiko."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Readiness Score" value={`${pass}%`} delta={readiness} icon={pass >= 90 ? ShieldCheck : ShieldAlert} tone={fail > 0 ? "danger" : warning > 0 ? "warning" : "success"} />
        <StatCard label="Issue Fail" value={formatNumber(fail)} delta="Wajib diperbaiki" icon={AlertTriangle} tone={fail > 0 ? "danger" : "success"} />
        <StatCard label="Issue Warning" value={formatNumber(warning)} delta="Perlu review analis" icon={FileWarning} tone={warning > 0 ? "warning" : "success"} />
        <StatCard label="Record Terintegrasi" value={formatNumber(pilots.length + mcuRows.length + psikoRows.length + jamRows.length)} delta="Penerbang + MCU + psikotes + logbook" icon={DatabaseZap} tone="primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GateCard title="Coverage Data" severity={pilots.every((pilot) => mcuRows.some((row) => row.penerbangId === pilot.id) && psikoRows.some((row) => row.penerbangId === pilot.id) && jamRows.some((row) => row.penerbangId === pilot.id)) ? "pass" : "warning"} detail={`${pilots.length} penerbang, ${mcuRows.length} MCU, ${psikoRows.length} psikotes, ${jamRows.length} logbook.`} />
        <GateCard title="Integritas Identitas" severity={hasDuplicateNrp(pilots) ? "fail" : "pass"} detail="NRP digunakan sebagai kunci matching lintas sumber data." />
        <GateCard title="Kesiapan Model" severity={fail > 0 ? "fail" : warning > 0 ? "warning" : "pass"} detail={fail > 0 ? "Perbaiki issue fail sebelum survival analysis." : "Data dapat dipakai untuk demo analitik dengan catatan quality gate."} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Issue Quality Gate</CardTitle>
          <CardDescription>Gunakan tabel ini sebagai checklist koreksi sebelum menjalankan model Cox atau export laporan.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={issues}
            searchPlaceholder="Cari issue, NRP, field..."
            columns={[
              { accessorKey: "severity", header: "Level", cell: ({ row }) => <SeverityBadge severity={row.original.severity} /> },
              { accessorKey: "category", header: "Kategori" },
              { accessorKey: "entity", header: "Entitas", cell: ({ row }) => <span className="font-semibold">{row.original.entity}</span> },
              { accessorKey: "field", header: "Field" },
              { accessorKey: "detail", header: "Detail" },
              { accessorKey: "recommendation", header: "Rekomendasi" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function buildQualityIssues(pilots: Penerbang[], mcuRows: McuRecord[], psikoRows: PsikotesRecord[], jamRows: JamTerbangRecord[]): GateIssue[] {
  const issues: GateIssue[] = [];
  const nrpSeen = new Map<string, string>();
  pilots.forEach((pilot) => {
    const duplicate = nrpSeen.get(pilot.nrp);
    if (duplicate) {
      issues.push(issue("fail", "Duplikasi NRP", pilot.id, "nrp", `NRP ${pilot.nrp} juga dipakai oleh ${duplicate}.`, "Gabungkan atau koreksi identitas sebelum matching lintas data."));
    }
    nrpSeen.set(pilot.nrp, pilot.id);
    if (!mcuRows.some((row) => row.penerbangId === pilot.id)) issues.push(issue("warning", "Missingness", pilot.id, "mcu", "Tidak ada data MCU untuk penerbang ini.", "Lengkapi MCU atau tandai sebagai missing eksplisit."));
    if (!psikoRows.some((row) => row.penerbangId === pilot.id)) issues.push(issue("warning", "Missingness", pilot.id, "psikotes", "Tidak ada data psikotes untuk penerbang ini.", "Lengkapi psikotes berkala atau lakukan imputasi."));
    if (!jamRows.some((row) => row.penerbangId === pilot.id)) issues.push(issue("fail", "Missingness", pilot.id, "jam_terbang", "Tidak ada logbook jam terbang.", "Logbook wajib ada karena menjadi kovariat time-varying utama."));
    if (!isReasonableDate(pilot.tanggalMasuk)) issues.push(issue("fail", "Tanggal", pilot.id, "tanggal_masuk", `Tanggal masuk ${pilot.tanggalMasuk} di luar periode 2016-2026.`, "Koreksi tanggal observasi/time-zero."));
  });

  mcuRows.forEach((row) => {
    if (!isReasonableDate(row.tanggal)) issues.push(issue("fail", "Tanggal", row.id, "tanggal", `Tanggal MCU ${row.tanggal} di luar periode observasi.`, "Koreksi tanggal MCU."));
    if (row.bmi >= 30 || row.bmi < 18.5) issues.push(issue("warning", "Outlier MCU", row.id, "bmi", `BMI ${row.bmi}.`, "Review status gizi dan konsistensi satuan input."));
    const [sys, dia] = row.tekananDarah.split("/").map(Number);
    if (sys >= 140 || dia >= 90) issues.push(issue("warning", "Outlier MCU", row.id, "tekanan_darah", `Tekanan darah ${row.tekananDarah}.`, "Konfirmasi ulang atau tandai sebagai faktor risiko kardiovaskular."));
    if (row.kolesterol >= 240) issues.push(issue("warning", "Outlier MCU", row.id, "kolesterol", `Kolesterol ${row.kolesterol} mg/dL.`, "Review lab dan terapi/intervensi."));
    if (row.vo2max < 34) issues.push(issue("warning", "Outlier MCU", row.id, "vo2max", `VO2max ${row.vo2max}.`, "Evaluasi kapasitas aerobik dan readiness tugas."));
  });

  psikoRows.forEach((row) => {
    if (!isReasonableDate(row.tanggal)) issues.push(issue("fail", "Tanggal", row.id, "tanggal", `Tanggal psikotes ${row.tanggal} di luar periode observasi.`, "Koreksi tanggal psikotes."));
    if (row.stressIndex >= 65) issues.push(issue("warning", "Psikotes", row.id, "stress_index", `Stress index ${row.stressIndex}.`, "Perlu review psikologi operasional."));
    if (row.stabilitasEmosi < 60 || row.atensi < 60) issues.push(issue("warning", "Psikotes", row.id, "skor_domain", `Emosi ${row.stabilitasEmosi}, atensi ${row.atensi}.`, "Periksa ulang domain psikometri rendah."));
  });

  jamRows.forEach((row) => {
    if (!isReasonableDate(row.tanggal)) issues.push(issue("fail", "Tanggal", row.id, "tanggal", `Tanggal logbook ${row.tanggal} di luar periode observasi.`, "Koreksi tanggal logbook."));
    if (row.durasiJam > 8 || row.durasiJam <= 0) issues.push(issue("warning", "Jam Terbang Ekstrem", row.id, "durasi_jam", `Durasi ${row.durasiJam} jam pada ${formatDate(row.tanggal)}.`, "Konfirmasi logbook dan kemungkinan input subtotal."));
    if (row.malam && row.durasiJam >= 5) issues.push(issue("warning", "Fatigue", row.id, "malam", `Misi malam ${row.durasiJam} jam.`, "Review fatigue dan recovery period."));
  });

  if (!issues.length) {
    issues.push(issue("pass", "Quality Gate", "CSAKT", "all", "Tidak ditemukan issue mayor pada data demo.", "Data siap untuk survival analysis."));
  }
  return issues;
}

function issue(severity: GateSeverity, category: string, entity: string, field: string, detail: string, recommendation: string): GateIssue {
  return { id: `${severity}-${category}-${entity}-${field}-${detail}`, severity, category, entity, field, detail, recommendation };
}

function isReasonableDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date >= new Date("2016-01-01") && date <= new Date("2026-12-31");
}

function hasDuplicateNrp(pilots: Penerbang[]) {
  return new Set(pilots.map((pilot) => pilot.nrp)).size !== pilots.length;
}

function SeverityBadge({ severity }: { severity: GateSeverity }) {
  const variant = severity === "pass" ? "success" : severity === "warning" ? "warning" : "danger";
  return <Badge variant={variant}>{severity}</Badge>;
}

function GateCard({ title, severity, detail }: { title: string; severity: GateSeverity; detail: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          {title}
          {severity === "pass" ? <CheckCircle2 className="size-5 text-success" /> : <AlertTriangle className="size-5 text-warning" />}
        </CardTitle>
        <CardDescription>{detail}</CardDescription>
      </CardHeader>
      <CardContent>
        <SeverityBadge severity={severity} />
      </CardContent>
    </Card>
  );
}
