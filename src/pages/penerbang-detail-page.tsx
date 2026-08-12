import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  BrainCircuit,
  CalendarDays,
  Clock,
  Download,
  FileText,
  GitBranch,
  Printer,
  ShieldAlert,
  SlidersHorizontal,
  Stethoscope,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { queryFns } from "@/lib/queries";
import type { CoxResult, JamTerbangRecord, KelaikanStatus, McuRecord, Penerbang, PsikotesRecord } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";

type TimelineItem = {
  date: string;
  type: "MCU" | "Psikotes" | "Jam Terbang" | "Status" | "Model";
  title: string;
  detail: string;
  tone: "success" | "warning" | "danger" | "info" | "secondary";
};

type ExplainFactor = {
  factor: string;
  source: string;
  value: string;
  hazardRatio: number;
  ci: string;
  pValue: string;
  direction: "Risiko" | "Protektif";
  recommendation: string;
};

export function PenerbangDetailPage() {
  const { id } = useParams();
  const { data = [] } = useQuery({ queryKey: ["penerbang"], queryFn: queryFns.penerbang });
  const { data: mcuRows = [] } = useQuery({ queryKey: ["mcu"], queryFn: queryFns.mcu });
  const { data: psikoRows = [] } = useQuery({ queryKey: ["psikotes"], queryFn: queryFns.psikotes });
  const { data: jamRows = [] } = useQuery({ queryKey: ["jam-terbang"], queryFn: queryFns.jamTerbang });
  const { data: survival } = useQuery({ queryKey: ["survival"], queryFn: queryFns.survival });
  const pilot = data.find((item) => item.id === id);

  if (!pilot) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild><Link to="/penerbang"><ArrowLeft />Kembali</Link></Button>
        <Card><CardContent className="p-8">Data penerbang tidak ditemukan.</CardContent></Card>
      </div>
    );
  }

  const pilotMcu = mcuRows.filter((item) => item.penerbangId === id);
  const pilotPsiko = psikoRows.filter((item) => item.penerbangId === id);
  const pilotJam = jamRows.filter((item) => item.penerbangId === id);
  const mcu = latestByDate(pilotMcu);
  const psiko = latestByDate(pilotPsiko);
  const timeline = buildTimeline(pilot, pilotMcu, pilotPsiko, pilotJam);
  const factors = buildExplainability(pilot, mcu, psiko, pilotJam, survival?.coxResults ?? []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={pilot.nrp}
        title={pilot.nama}
        description={`${pilot.pangkat} - ${pilot.skadron} - ${pilot.kategoriPesawat}`}
        actions={
          <>
            <Button variant="outline" onClick={() => printIndividualReport(pilot, mcu, psiko, pilotJam, factors, timeline)}>
              <Printer />
              Cetak / PDF
            </Button>
            <Button variant="outline" onClick={() => downloadIndividualWord(pilot, mcu, psiko, pilotJam, factors, timeline)}>
              <Download />
              Export Word
            </Button>
            <Button variant="outline" asChild><Link to="/penerbang"><ArrowLeft />Kembali</Link></Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Status Kelaikan" value={pilot.status} delta={pilot.eventDate ? `Event: ${formatDate(pilot.eventDate)}` : "Belum ada event"} icon={Activity} tone={pilot.status === "Laik" ? "success" : "warning"} />
        <StatCard label="Total Jam" value={formatNumber(pilot.totalJam)} delta="Akumulasi logbook" icon={Clock} tone="primary" />
        <StatCard label="Skor Risiko" value={`${pilot.riskScore}`} delta="Skala 0-100" icon={BrainCircuit} tone={pilot.riskScore > 55 ? "danger" : "accent"} />
        <StatCard label="Usia" value={`${pilot.usia}`} delta={`Masuk ${formatDate(pilot.tanggalMasuk)}`} icon={Stethoscope} tone="accent" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldAlert className="size-5 text-warning" />Explainability Panel</CardTitle>
            <CardDescription>Faktor penyumbang risiko terbesar dan rekomendasi klinis-operasional.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {factors.map((factor) => (
              <div key={`${factor.factor}-${factor.source}`} className="rounded-xl border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-bold">{factor.factor}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{factor.source}: {factor.value}</p>
                  </div>
                  <Badge variant={factor.direction === "Risiko" ? "danger" : "success"}>{factor.direction}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <MiniMetric label="HR" value={factor.hazardRatio.toFixed(2)} />
                  <MiniMetric label="CI 95%" value={factor.ci} />
                  <MiniMetric label="p-value" value={factor.pValue} />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{factor.recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarDays className="size-5 text-accent" />Audit Trail Penerbang</CardTitle>
            <CardDescription>Jejak data yang menjawab perubahan status, event, dan keluaran model.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {timeline.map((item, index) => (
              <div key={`${item.date}-${item.type}-${index}`} className="grid grid-cols-[7.5rem_1fr] gap-3">
                <div className="pt-1 text-xs font-semibold text-muted-foreground">{formatDate(item.date)}</div>
                <div className="relative border-l pl-4">
                  <span className="absolute -left-[5px] top-2 size-2.5 rounded-full bg-accent" />
                  <div className="rounded-xl border bg-card p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={item.tone}>{item.type}</Badge>
                      <p className="font-semibold">{item.title}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <ScenarioSimulator pilot={pilot} mcu={mcu} psiko={psiko} />
        <DataLineagePanel pilot={pilot} mcu={mcu} psiko={psiko} jamRows={pilotJam} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Ringkasan MCU Terakhir</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <InfoRow label="Tanggal" value={mcu ? formatDate(mcu.tanggal) : "-"} />
            <InfoRow label="BMI" value={mcu?.bmi.toString() ?? "-"} />
            <InfoRow label="Tekanan darah" value={mcu?.tekananDarah ?? "-"} />
            <InfoRow label="Kolesterol" value={mcu ? `${mcu.kolesterol} mg/dL` : "-"} />
            <InfoRow label="VO2max" value={mcu ? `${mcu.vo2max}` : "-"} />
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Status</span>{mcu ? <StatusBadge status={mcu.status} /> : "-"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Ringkasan Psikotes Terakhir</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <InfoRow label="Tanggal" value={psiko ? formatDate(psiko.tanggal) : "-"} />
            <InfoRow label="Stabilitas emosi" value={psiko?.stabilitasEmosi.toString() ?? "-"} />
            <InfoRow label="Atensi" value={psiko?.atensi.toString() ?? "-"} />
            <InfoRow label="Stress index" value={psiko?.stressIndex.toString() ?? "-"} />
            <InfoRow label="Cognitive load" value={psiko?.cognitiveLoad.toString() ?? "-"} />
            <InfoRow label="Rekomendasi" value={psiko?.rekomendasi ?? "-"} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GitBranch className="size-5 text-accent" />Ringkasan Data untuk Flight Surgeon</CardTitle>
          <CardDescription>Tabel ringkas yang ikut masuk ke export Word/PDF individual.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Komponen</TableHead><TableHead>Nilai</TableHead><TableHead>Interpretasi</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {reportRows(pilot, mcu, psiko, pilotJam).map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="font-semibold">{row.label}</TableCell>
                  <TableCell>{row.value}</TableCell>
                  <TableCell className="text-muted-foreground">{row.interpretation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/45 p-2">
      <p className="text-[11px] uppercase text-muted-foreground">{label}</p>
      <p className="tabular mt-1 break-words text-[12px] font-bold leading-4">{value}</p>
    </div>
  );
}

function ScenarioSimulator({ pilot, mcu, psiko }: { pilot: Penerbang; mcu?: McuRecord; psiko?: PsikotesRecord }) {
  const [targetBmi, setTargetBmi] = useState(Math.min(mcu?.bmi ?? 24, 34));
  const [targetVo2, setTargetVo2] = useState(mcu?.vo2max ?? 42);
  const [targetStress, setTargetStress] = useState(psiko?.stressIndex ?? 35);
  const currentBmi = mcu?.bmi ?? targetBmi;
  const currentVo2 = mcu?.vo2max ?? targetVo2;
  const currentStress = psiko?.stressIndex ?? targetStress;
  const bmiGain = Math.max(0, currentBmi - targetBmi) * 1.4;
  const vo2Gain = Math.max(0, targetVo2 - currentVo2) * 0.9;
  const stressGain = Math.max(0, currentStress - targetStress) * 0.65;
  const projectedRisk = Math.max(5, Math.round(pilot.riskScore - bmiGain - vo2Gain - stressGain));
  const delta = pilot.riskScore - projectedRisk;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="size-5 text-accent" />Scenario Simulator</CardTitle>
        <CardDescription>Simulasi what-if intervensi preventif: BMI turun, VO2max naik, dan stress index membaik.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniMetric label="Risiko awal" value={`${pilot.riskScore}/100`} />
          <MiniMetric label="Risiko proyeksi" value={`${projectedRisk}/100`} />
          <MiniMetric label="Penurunan" value={`${delta} poin`} />
        </div>
        <RangeControl label="Target BMI" min={20} max={34} step={0.1} value={targetBmi} current={`Saat ini ${currentBmi}`} onChange={setTargetBmi} />
        <RangeControl label="Target VO2max" min={24} max={55} step={1} value={targetVo2} current={`Saat ini ${currentVo2}`} onChange={setTargetVo2} />
        <RangeControl label="Target stress index" min={15} max={75} step={1} value={targetStress} current={`Saat ini ${currentStress}`} onChange={setTargetStress} />
        <div className="rounded-xl border bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
          Rekomendasi simulasi: fokus pada intervensi dengan dampak terbesar terlebih dahulu. Pada profil ini, penurunan stress index dan perbaikan faktor kardiometabolik memberi penurunan skor risiko paling terlihat untuk narasi pencegahan.
        </div>
      </CardContent>
    </Card>
  );
}

function RangeControl({
  label,
  min,
  max,
  step,
  value,
  current,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  current: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground">{current}</p>
        </div>
        <span className="tabular rounded-lg bg-muted px-2 py-1 text-sm font-bold">{value.toFixed(step < 1 ? 1 : 0)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer accent-[hsl(var(--accent))]"
        aria-label={label}
      />
    </div>
  );
}

function DataLineagePanel({ pilot, mcu, psiko, jamRows }: { pilot: Penerbang; mcu?: McuRecord; psiko?: PsikotesRecord; jamRows: JamTerbangRecord[] }) {
  const latestJam = latestByDate(jamRows);
  const rows = [
    lineage("Identitas penerbang", `${pilot.nrp} / ${pilot.nama}`, "master_penerbang_2016_2026.xlsx", "2026-08-09 08:20", "Admin Lakespra", "valid", "nrp,nama,pangkat,skadron"),
    lineage("Status kelaikan", pilot.status, "mcu_messy_2016_2026.xlsx", "2026-08-09 08:22", "Dokter Penerbangan", "valid", "status_kelaikan"),
    lineage("Skor risiko", `${pilot.riskScore}/100`, "cox_result_JOB-BOOT-20260811.json", "2026-08-11 09:26", "CSAKT Coordinator", "model-validated", "risk_score"),
    lineage("MCU terakhir", mcu ? `BMI ${mcu.bmi}, TD ${mcu.tekananDarah}` : "-", "mcu_messy_2016_2026.xlsx", "2026-08-09 08:24", "Analis Data", mcu ? "valid" : "missing", "bmi,tekanan_darah,kolesterol,vo2max"),
    lineage("Psikotes terakhir", psiko ? `Stress ${psiko.stressIndex}` : "-", "catatan_psikologi_naratif.docx", "2026-08-10 13:40", "Mayor Kes dr. Mira", psiko ? "valid" : "missing", "stress_index,atensi,stabilitas_emosi"),
    lineage("Logbook terakhir", latestJam ? `${latestJam.jenisPesawat}, ${latestJam.durasiJam} jam` : "-", "logbook_campuran.xlsx", "2026-08-09 04:15", "Kapten Sus Analis Bima", latestJam ? "valid" : "missing", "jenis_pesawat,durasi_jam,malam"),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText className="size-5 text-accent" />Data Lineage</CardTitle>
        <CardDescription>Asal-usul nilai penting: file import, tanggal, user, status validasi, dan mapping kolom.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div key={row.valueName} className="rounded-xl border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{row.valueName}</p>
              <Badge variant={row.validation === "valid" || row.validation === "model-validated" ? "success" : "warning"}>{row.validation}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{row.value}</p>
            <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
              <MiniMetric label="Sumber" value={row.sourceFile} />
              <MiniMetric label="Import" value={row.importedAt} />
              <MiniMetric label="User" value={row.user} />
              <MiniMetric label="Mapping" value={row.mapping} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function lineage(valueName: string, value: string, sourceFile: string, importedAt: string, user: string, validation: string, mapping: string) {
  return { valueName, value, sourceFile, importedAt, user, validation, mapping };
}

function latestByDate<T extends { tanggal: string }>(rows: T[]) {
  return [...rows].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())[0];
}

function buildTimeline(pilot: Penerbang, mcuRows: McuRecord[], psikoRows: PsikotesRecord[], jamRows: JamTerbangRecord[]): TimelineItem[] {
  const items: TimelineItem[] = [
    {
      date: pilot.tanggalMasuk,
      type: "Status",
      title: "Time-zero observasi",
      detail: `${pilot.pangkat} masuk observasi CSAKT pada satuan ${pilot.skadron}.`,
      tone: "secondary",
    },
    ...mcuRows.map((row) => ({
      date: row.tanggal,
      type: "MCU" as const,
      title: `MCU status ${row.status}`,
      detail: `BMI ${row.bmi}, TD ${row.tekananDarah}, kolesterol ${row.kolesterol}, VO2max ${row.vo2max}.`,
      tone: row.status === "Laik" ? "success" as const : "warning" as const,
    })),
    ...psikoRows.map((row) => ({
      date: row.tanggal,
      type: "Psikotes" as const,
      title: `Stress index ${row.stressIndex}`,
      detail: `Stabilitas emosi ${row.stabilitasEmosi}, atensi ${row.atensi}, cognitive load ${row.cognitiveLoad}. ${row.rekomendasi}`,
      tone: row.stressIndex >= 60 ? "warning" as const : "success" as const,
    })),
    ...jamRows.map((row) => ({
      date: row.tanggal,
      type: "Jam Terbang" as const,
      title: `${row.jenisPesawat} - ${row.durasiJam} jam`,
      detail: `${row.misi}. Misi malam: ${row.malam ? "ya" : "tidak"}, instruktur: ${row.instruktur ? "ya" : "tidak"}.`,
      tone: row.malam || row.durasiJam >= 5 ? "warning" as const : "info" as const,
    })),
    {
      date: "2026-08-11",
      type: "Model",
      title: `Risk score ${pilot.riskScore}/100`,
      detail: "Skor gabungan dari faktor klinis, psikologis, jam terbang, dan hasil model survival.",
      tone: pilot.riskScore >= 55 ? "danger" : "info",
    },
  ];

  if (pilot.eventDate) {
    items.push({
      date: pilot.eventDate,
      type: "Status",
      title: `Event kelaikan: ${pilot.status}`,
      detail: "Outcome time-to-event tercatat untuk analisis survival dan audit klinis.",
      tone: pilot.status === "Tidak Laik" ? "danger" : "warning",
    });
  }
  return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function findCox(cox: CoxResult[], needle: string) {
  return cox.find((item) => item.faktor.toLowerCase().includes(needle.toLowerCase()));
}

function buildExplainability(pilot: Penerbang, mcu: McuRecord | undefined, psiko: PsikotesRecord | undefined, jamRows: JamTerbangRecord[], cox: CoxResult[]): ExplainFactor[] {
  const factors: ExplainFactor[] = [];
  const add = (factor: string, source: string, value: string, fallbackHr: number, fallbackCi: string, fallbackP: string, direction: "Risiko" | "Protektif", recommendation: string, coxNeedle?: string) => {
    const coxItem = coxNeedle ? findCox(cox, coxNeedle) : undefined;
    factors.push({
      factor,
      source,
      value,
      hazardRatio: coxItem?.hazardRatio ?? fallbackHr,
      ci: coxItem ? `${coxItem.ciLow.toFixed(2)}-${coxItem.ciHigh.toFixed(2)}` : fallbackCi,
      pValue: coxItem ? coxItem.pValue.toFixed(3) : fallbackP,
      direction,
      recommendation,
    });
  };

  if (pilot.usia >= 40) add("Usia > 40 tahun", "Profil penerbang", `${pilot.usia} tahun`, 1.82, "1.26-2.64", "0.002", "Risiko", "Prioritaskan review longitudinal dan komorbid kardiometabolik pada rikkes berikutnya.", "Usia");
  if (mcu?.bmi && mcu.bmi >= 27) add("BMI tinggi", "MCU", `${mcu.bmi}`, 1.51, "1.08-2.11", "0.016", "Risiko", "Konseling komposisi tubuh dan follow-up berkala sebelum penugasan intensif.", "BMI");
  if (mcu?.kolesterol && mcu.kolesterol >= 220) add("Kolesterol tinggi", "MCU", `${mcu.kolesterol} mg/dL`, 1.67, "1.15-2.43", "0.007", "Risiko", "Konfirmasi profil lipid, evaluasi terapi, dan monitor faktor kardiovaskular lain.", "Kolesterol");
  if (psiko?.stressIndex && psiko.stressIndex >= 55) add("Stress index tinggi", "Psikotes", `${psiko.stressIndex}`, 1.94, "1.31-2.88", "0.001", "Risiko", "Pertimbangkan pendampingan psikologi operasional dan penjadwalan recovery.", "Stress");
  if (mcu?.vo2max && mcu.vo2max < 38) add("VO2max rendah", "MCU", `${mcu.vo2max}`, 1.39, "1.04-1.86", "0.031", "Risiko", "Program peningkatan kapasitas aerobik dan evaluasi readiness fisik.", undefined);
  if (jamRows.some((row) => row.malam && row.durasiJam >= 5)) add("Paparan misi malam panjang", "Logbook", "Misi malam >= 5 jam", 1.28, "1.02-1.61", "0.041", "Risiko", "Review fatigue risk management, jeda istirahat, dan pola rotasi tugas.", undefined);
  if (pilot.totalJam < 2200 && !jamRows.some((row) => row.malam && row.durasiJam >= 5)) add("Jam terbang stabil", "Logbook", `${formatNumber(pilot.totalJam)} jam`, 0.81, "0.63-1.04", "0.098", "Protektif", "Pertahankan monitoring berkala; efek protektif tidak menggantikan review klinis.", "Jam terbang");

  return factors.sort((a, b) => (b.direction === "Risiko" ? b.hazardRatio : 1 / b.hazardRatio) - (a.direction === "Risiko" ? a.hazardRatio : 1 / a.hazardRatio)).slice(0, 5);
}

function reportRows(pilot: Penerbang, mcu: McuRecord | undefined, psiko: PsikotesRecord | undefined, jamRows: JamTerbangRecord[]) {
  return [
    { label: "Identitas", value: `${pilot.nrp} - ${pilot.nama}`, interpretation: `${pilot.pangkat}, ${pilot.skadron}, kategori ${pilot.kategoriPesawat}.` },
    { label: "Status", value: `${pilot.status}${pilot.eventDate ? `, event ${formatDate(pilot.eventDate)}` : ""}`, interpretation: "Outcome kelaikan untuk audit survival dan keputusan klinis." },
    { label: "Skor risiko", value: `${pilot.riskScore}/100`, interpretation: pilot.riskScore >= 55 ? "Prioritas review flight surgeon." : "Monitoring rutin sesuai interval rikkes." },
    { label: "MCU terakhir", value: mcu ? `BMI ${mcu.bmi}, TD ${mcu.tekananDarah}, kolesterol ${mcu.kolesterol}, VO2max ${mcu.vo2max}` : "-", interpretation: "Faktor kardiometabolik dan kapasitas fisik." },
    { label: "Psikotes terakhir", value: psiko ? `stress ${psiko.stressIndex}, emosi ${psiko.stabilitasEmosi}, atensi ${psiko.atensi}` : "-", interpretation: "Dimensi psikologis dan kognitif operasional." },
    { label: "Logbook", value: `${jamRows.length} catatan; total sistem ${formatNumber(pilot.totalJam)} jam`, interpretation: "Kovariat time-varying dan indikator fatigue/paparan tugas." },
  ];
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] ?? char);
}

function buildReportHtml(pilot: Penerbang, mcu: McuRecord | undefined, psiko: PsikotesRecord | undefined, jamRows: JamTerbangRecord[], factors: ExplainFactor[], timeline: TimelineItem[]) {
  const rows = reportRows(pilot, mcu, psiko, jamRows)
    .map((row) => `<tr><td>${escapeHtml(row.label)}</td><td>${escapeHtml(row.value)}</td><td>${escapeHtml(row.interpretation)}</td></tr>`)
    .join("");
  const factorRows = factors
    .map((factor) => `<tr><td>${escapeHtml(factor.factor)}</td><td>${factor.hazardRatio.toFixed(2)}</td><td>${escapeHtml(factor.ci)}</td><td>${escapeHtml(factor.pValue)}</td><td>${escapeHtml(factor.recommendation)}</td></tr>`)
    .join("");
  const timelineRows = timeline
    .map((item) => `<tr><td>${escapeHtml(formatDate(item.date))}</td><td>${escapeHtml(item.type)}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.detail)}</td></tr>`)
    .join("");
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Laporan Individual CSAKT - ${escapeHtml(pilot.nrp)}</title>
<style>
body { font-family: Arial, sans-serif; color: #111827; line-height: 1.45; }
h1 { color: #0f2a4a; font-size: 22pt; margin-bottom: 4px; }
h2 { color: #155e75; font-size: 14pt; margin-top: 22px; }
.meta { color: #4b5563; margin-bottom: 18px; }
.badge { display: inline-block; padding: 4px 8px; border-radius: 999px; background: #e0f2fe; color: #075985; font-weight: 700; }
table { border-collapse: collapse; width: 100%; margin-top: 8px; }
th, td { border: 1px solid #d1d5db; padding: 7px; vertical-align: top; font-size: 10pt; }
th { background: #e5f3f7; text-align: left; }
.note { border-left: 4px solid #0f766e; padding: 10px 12px; background: #f0fdfa; margin-top: 16px; }
</style>
</head>
<body>
<h1>Laporan Individual CSAKT</h1>
<p class="meta">${escapeHtml(pilot.nama)} | NRP ${escapeHtml(pilot.nrp)} | ${escapeHtml(pilot.pangkat)} | ${escapeHtml(pilot.skadron)}</p>
<p><span class="badge">Status: ${escapeHtml(pilot.status)}</span> <span class="badge">Risk score: ${pilot.riskScore}/100</span></p>
<div class="note">Laporan ini adalah dukungan keputusan untuk flight surgeon. Keputusan akhir tetap memerlukan penilaian klinis dan verifikasi data sumber.</div>
<h2>Ringkasan Klinis-Operasional</h2>
<table><thead><tr><th>Komponen</th><th>Nilai</th><th>Interpretasi</th></tr></thead><tbody>${rows}</tbody></table>
<h2>Explainability Faktor Risiko</h2>
<table><thead><tr><th>Faktor</th><th>HR</th><th>CI 95%</th><th>p-value</th><th>Rekomendasi</th></tr></thead><tbody>${factorRows}</tbody></table>
<h2>Audit Trail</h2>
<table><thead><tr><th>Tanggal</th><th>Jenis</th><th>Judul</th><th>Detail</th></tr></thead><tbody>${timelineRows}</tbody></table>
</body>
</html>`;
}

function downloadIndividualWord(pilot: Penerbang, mcu: McuRecord | undefined, psiko: PsikotesRecord | undefined, jamRows: JamTerbangRecord[], factors: ExplainFactor[], timeline: TimelineItem[]) {
  const html = buildReportHtml(pilot, mcu, psiko, jamRows, factors, timeline);
  const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `laporan-individual-${pilot.nrp}.doc`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success("Laporan Word individual dibuat");
}

function printIndividualReport(pilot: Penerbang, mcu: McuRecord | undefined, psiko: PsikotesRecord | undefined, jamRows: JamTerbangRecord[], factors: ExplainFactor[], timeline: TimelineItem[]) {
  const printWindow = window.open("", "_blank", "width=1024,height=768");
  if (!printWindow) {
    toast.error("Pop-up laporan diblokir browser");
    return;
  }
  printWindow.document.write(buildReportHtml(pilot, mcu, psiko, jamRows, factors, timeline));
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 450);
  toast.success("Laporan siap dicetak atau disimpan sebagai PDF");
}
