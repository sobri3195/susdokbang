import { useMutation, useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, CheckCircle2, Download, FlaskConical, History, PlayCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryFns } from "@/lib/queries";
import type { CoxValidationResult, ValidationLevel } from "@/lib/types";
import { cn, formatDate, formatNumber } from "@/lib/utils";

const levelLabels: Record<ValidationLevel, string> = {
  pass: "PASS",
  warning: "WARNING",
  fail: "FAIL",
};

export function ValidationPage() {
  const { data, isLoading, refetch } = useQuery({ queryKey: ["validation-result"], queryFn: queryFns.validationResult });
  const runMutation = useMutation({
    mutationFn: async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 1100));
      return true;
    },
    onSuccess: () => {
      toast.success("Validasi Cox selesai. Hasil terbaru sudah dimuat.");
      void refetch();
    },
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24" />
        <div className="grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32" />)}</div>
        <Skeleton className="h-[32rem]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Validasi metodologis"
        title="Validasi Statistik Cox Proportional Hazards"
        description="Panel bukti kuantitatif, visual diagnostik, dan interpretasi otomatis untuk memastikan model Cox dapat dipertanggungjawabkan secara ilmiah."
        actions={
          <>
            <Button variant="outline" asChild><Link to="/analitik/validasi/history"><History />Riwayat</Link></Button>
            <Button variant="accent" onClick={() => runMutation.mutate()} disabled={runMutation.isPending}>
              {runMutation.isPending ? <Activity className="animate-spin" /> : <PlayCircle />}
              Jalankan Validasi
            </Button>
          </>
        }
      />

      <ValidationSummaryCards result={data} />

      <Card className="aero-panel">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-accent">Job {data.jobId} - {data.modelName}</p>
            <p className="mt-1 text-sm text-muted-foreground">Dihasilkan {formatDate(data.generatedAt)} oleh engine statistik terpisah. Status keseluruhan: <LevelBadge level={data.overallStatus} />.</p>
          </div>
          <Button variant="outline" onClick={() => exportValidationCsv(data)}><Download />Export CSV</Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="ph" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="ph">PH Assumption</TabsTrigger>
          <TabsTrigger value="missing">Missing Data</TabsTrigger>
          <TabsTrigger value="epv">EPV & VIF</TabsTrigger>
          <TabsTrigger value="discrimination">Diskriminasi</TabsTrigger>
          <TabsTrigger value="bootstrap">Validasi Internal</TabsTrigger>
          <TabsTrigger value="residuals">Residual</TabsTrigger>
        </TabsList>

        <TabsContent value="ph"><PhTab result={data} /></TabsContent>
        <TabsContent value="missing"><MissingTab result={data} /></TabsContent>
        <TabsContent value="epv"><EpvTab result={data} /></TabsContent>
        <TabsContent value="discrimination"><DiscriminationTab result={data} /></TabsContent>
        <TabsContent value="bootstrap"><BootstrapTab result={data} /></TabsContent>
        <TabsContent value="residuals"><ResidualTab result={data} /></TabsContent>
      </Tabs>
    </div>
  );
}

function ValidationSummaryCards({ result }: { result: CoxValidationResult }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="PH Global" value={levelLabels[result.summary.phStatus]} delta={`Schoenfeld p=${result.summary.globalSchoenfeldP.toFixed(3)}`} icon={result.summary.phStatus === "pass" ? CheckCircle2 : AlertTriangle} tone={toneForLevel(result.summary.phStatus)} />
      <StatCard label="EPV" value={result.summary.epv.toFixed(1)} delta={`${result.summary.events} event / ${result.summary.parameters} parameter`} icon={FlaskConical} tone={toneForLevel(result.summary.epvStatus)} />
      <StatCard label="C-index" value={result.summary.cIndex.toFixed(2)} delta={`CI 95% ${result.summary.cIndexCiLow.toFixed(2)}-${result.summary.cIndexCiHigh.toFixed(2)}`} icon={Activity} tone="accent" />
      <StatCard label="Missing" value={`${result.summary.missingPercent.toFixed(1)}%`} delta={`Brier ${result.summary.brierScore.toFixed(3)} - slope ${result.summary.calibrationSlope.toFixed(2)}`} icon={AlertTriangle} tone={result.summary.missingPercent > 10 ? "danger" : "warning"} />
    </div>
  );
}

function PhTab({ result }: { result: CoxValidationResult }) {
  return (
    <div className="space-y-4">
      <InterpretationBox title="Interpretasi Otomatis PH" text={result.interpretations.ph} level={result.summary.phStatus} />
      <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Uji Schoenfeld Residual</CardTitle>
            <CardDescription>p-value per kovariat dan uji interaksi waktu.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Kovariat</TableHead><TableHead>Chi-square</TableHead><TableHead>p</TableHead><TableHead>Time p</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {result.ph.covariates.map((item) => (
                  <TableRow key={item.covariate}>
                    <TableCell className="font-semibold">{item.covariate}</TableCell>
                    <TableCell className="tabular">{item.chiSquare.toFixed(2)}</TableCell>
                    <TableCell className="tabular">{item.pValue.toFixed(3)}</TableCell>
                    <TableCell className="tabular">{item.timeInteractionP.toFixed(3)}</TableCell>
                    <TableCell><LevelBadge level={item.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <ChartCard title="Scaled Schoenfeld Residual Plot" description="Tren residual terhadap waktu. Tren naik/turun kuat menandakan pelanggaran PH.">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={result.ph.residuals}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="value" data={result.ph.residuals.filter((item) => item.covariate === "Stress index tinggi")} name="Stress residual" stroke="#dc2626" dot={false} />
                <Line type="monotone" dataKey="trend" data={result.ph.residuals.filter((item) => item.covariate === "Stress index tinggi")} name="Stress trend" stroke="#991b1b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="value" data={result.ph.residuals.filter((item) => item.covariate === "BMI >= 27")} name="BMI residual" stroke="#0f766e" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      <ChartCard title="Log-minus-log Survival Plot" description="Garis antar kelompok sebaiknya relatif paralel. Divergensi di akhir waktu perlu dicatat.">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={result.ph.lml}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="lowRisk" name="Risiko Rendah" stroke="#0f766e" strokeWidth={2} />
              <Line type="monotone" dataKey="highRisk" name="Risiko Tinggi" stroke="#dc2626" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
      <RecommendationList rows={result.ph.covariates.map((item) => ({ label: item.covariate, text: item.recommendation, level: item.status }))} />
    </div>
  );
}

function MissingTab({ result }: { result: CoxValidationResult }) {
  const heatRows = Array.from(new Set(result.missing.heatmap.map((cell) => cell.row)));
  const variables = Array.from(new Set(result.missing.heatmap.map((cell) => cell.variable)));

  return (
    <div className="space-y-4">
      <InterpretationBox title="Interpretasi Otomatis Missing Data" text={result.interpretations.missing} level={result.summary.missingPercent > 10 ? "fail" : "warning"} />
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader><CardTitle>Pola Missingness</CardTitle><CardDescription>Little's MCAR p={result.missing.littlePValue.toFixed(3)}</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Variabel</TableHead><TableHead>% Missing</TableHead><TableHead>Mekanisme</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
              <TableBody>
                {result.missing.variables.map((item) => (
                  <TableRow key={item.variable}>
                    <TableCell className="font-semibold">{item.variable}</TableCell>
                    <TableCell className="tabular">{item.missingPercent.toFixed(1)}%</TableCell>
                    <TableCell><Badge variant={item.mechanism === "MCAR" ? "success" : item.mechanism === "MAR" ? "warning" : "danger"}>{item.mechanism}</Badge></TableCell>
                    <TableCell>{item.action}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Heatmap Missingness</CardTitle><CardDescription>Sel merah menandakan nilai kosong pada baris sampel.</CardDescription></CardHeader>
          <CardContent>
            <div className="overflow-auto rounded-xl border p-3">
              <div className="grid min-w-[560px] gap-1" style={{ gridTemplateColumns: `5rem repeat(${variables.length}, minmax(5rem, 1fr))` }}>
                <div />
                {variables.map((variable) => <div key={variable} className="text-xs font-bold text-muted-foreground">{variable}</div>)}
                {heatRows.map((row) => (
                  <>
                    <div key={`${row}-label`} className="text-xs font-semibold">{row}</div>
                    {variables.map((variable) => {
                      const cell = result.missing.heatmap.find((item) => item.row === row && item.variable === variable);
                      return <div key={`${row}-${variable}`} className={cn("h-7 rounded-md", cell?.missing ? "bg-destructive/75" : "bg-success/20")} title={`${row} ${variable}`} />;
                    })}
                  </>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <DataTable
        data={result.missing.comparison}
        searchPlaceholder="Cari kovariat..."
        columns={[
          { accessorKey: "covariate", header: "Kovariat" },
          { accessorKey: "completeCaseHr", header: "Complete-case HR", cell: ({ row }) => <span className="tabular">{row.original.completeCaseHr.toFixed(2)}</span> },
          { accessorKey: "miceHr", header: "MICE pooled HR", cell: ({ row }) => <span className="tabular">{row.original.miceHr.toFixed(2)}</span> },
          { accessorKey: "deltaPercent", header: "Delta", cell: ({ row }) => <span className="tabular">{row.original.deltaPercent.toFixed(1)}%</span> },
          { accessorKey: "conclusion", header: "Kesimpulan" },
        ]}
      />
    </div>
  );
}

function EpvTab({ result }: { result: CoxValidationResult }) {
  return (
    <div className="space-y-4">
      <InterpretationBox title="Interpretasi Otomatis EPV" text={result.interpretations.epv} level={result.summary.epvStatus} />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Jumlah Event" value={formatNumber(result.summary.events)} delta="Penurunan kelaikan" icon={Activity} tone="primary" />
        <StatCard label="Parameter" value={formatNumber(result.summary.parameters)} delta="Kovariat model" icon={FlaskConical} tone="accent" />
        <StatCard label="EPV" value={result.summary.epv.toFixed(1)} delta="Ideal >= 10" icon={result.summary.epvStatus === "fail" ? XCircle : AlertTriangle} tone={toneForLevel(result.summary.epvStatus)} />
      </div>
      <Card>
        <CardHeader><CardTitle>Variance Inflation Factor</CardTitle><CardDescription>VIF tinggi mengindikasikan multikolinearitas antar kovariat.</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Variabel</TableHead><TableHead>VIF</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {result.epv.vif.map((item) => (
                <TableRow key={item.variable}>
                  <TableCell className="font-semibold">{item.variable}</TableCell>
                  <TableCell className="tabular">{item.vif.toFixed(1)}</TableCell>
                  <TableCell><LevelBadge level={item.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-4 rounded-xl border bg-muted/25 p-4 text-sm leading-6 text-muted-foreground">{result.epv.recommendation}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function DiscriminationTab({ result }: { result: CoxValidationResult }) {
  return (
    <div className="space-y-4">
      <InterpretationBox title="Interpretasi Otomatis Diskriminasi & Kalibrasi" text={result.interpretations.discrimination} level="pass" />
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Time-dependent AUC" description="AUC pada horizon 1, 3, dan 5 tahun beserta CI 95%.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={result.discrimination.auc}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tickFormatter={(value) => `${value} th`} />
                <YAxis domain={[0.6, 0.9]} />
                <Tooltip />
                <Area type="monotone" dataKey="auc" name="AUC" stroke="#0f766e" fill="#0f766e22" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Calibration Plot" description="Predicted vs observed survival. Garis diagonal = kalibrasi ideal.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="predicted" type="number" domain={[0.4, 1]} name="Predicted" />
                <YAxis dataKey="observed" type="number" domain={[0.4, 1]} name="Observed" />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <ReferenceLine segment={[{ x: 0.4, y: 0.4 }, { x: 1, y: 1 }]} stroke="#64748b" strokeDasharray="4 4" />
                <Scatter data={result.discrimination.calibration} fill="#155e75" name="Kelompok risiko" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function BootstrapTab({ result }: { result: CoxValidationResult }) {
  return (
    <div className="space-y-4">
      <InterpretationBox title="Interpretasi Otomatis Validasi Internal" text={result.interpretations.bootstrap} level="warning" />
      <Card>
        <CardHeader><CardTitle>Bootstrap Validation</CardTitle><CardDescription>Optimism-corrected metrics dari resampling internal.</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Metric</TableHead><TableHead>Apparent</TableHead><TableHead>Optimism</TableHead><TableHead>Corrected</TableHead><TableHead>Interpretasi</TableHead></TableRow></TableHeader>
            <TableBody>
              {result.bootstrap.metrics.map((item) => (
                <TableRow key={item.metric}>
                  <TableCell className="font-semibold">{item.metric}</TableCell>
                  <TableCell className="tabular">{item.apparent.toFixed(3)}</TableCell>
                  <TableCell className="tabular">{item.optimism.toFixed(3)}</TableCell>
                  <TableCell className="tabular font-bold">{item.corrected.toFixed(3)}</TableCell>
                  <TableCell>{item.interpretation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ResidualTab({ result }: { result: CoxValidationResult }) {
  return (
    <div className="space-y-4">
      <InterpretationBox title="Interpretasi Otomatis Residual & Outlier" text={result.interpretations.residuals} level="warning" />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ChartCard title="Martingale, Deviance, dan DFBETA" description="Observasi dengan DFBETA tinggi perlu review karena berpengaruh pada koefisien model.">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={result.residuals.points}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="martingale" name="Martingale" stroke="#0f766e" dot={false} />
                <Line type="monotone" dataKey="deviance" name="Deviance" stroke="#155e75" dot={false} />
                <Scatter dataKey="dfbeta" name="DFBETA" fill="#dc2626" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <Card>
          <CardHeader><CardTitle>Observasi Berpengaruh</CardTitle><CardDescription>Top DFBETA untuk audit klinis dan operasional.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {result.residuals.influential.map((item) => (
              <div key={item.pilotId} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.pilotId} - {item.driver}</p>
                  </div>
                  <Badge variant={item.dfbetaMax > 0.3 ? "danger" : "warning"}>{item.dfbetaMax.toFixed(2)}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.action}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RecommendationList({ rows }: { rows: Array<{ label: string; text: string; level: ValidationLevel }> }) {
  return (
    <Card>
      <CardHeader><CardTitle>Rekomendasi Per Kovariat</CardTitle></CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{row.label}</p>
              <LevelBadge level={row.level} />
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{row.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function InterpretationBox({ title, text, level }: { title: string; text: string; level: ValidationLevel }) {
  return (
    <Card className={cn("border-l-4", level === "pass" && "border-l-success", level === "warning" && "border-l-warning", level === "fail" && "border-l-destructive")}>
      <CardContent className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-bold">{title}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
          </div>
          <LevelBadge level={level} />
        </div>
      </CardContent>
    </Card>
  );
}

function LevelBadge({ level }: { level: ValidationLevel }) {
  return <Badge variant={level === "pass" ? "success" : level === "warning" ? "warning" : "danger"}>{levelLabels[level]}</Badge>;
}

function toneForLevel(level: ValidationLevel): "success" | "warning" | "danger" {
  if (level === "pass") return "success";
  if (level === "warning") return "warning";
  return "danger";
}

function exportValidationCsv(result: CoxValidationResult) {
  const rows = [
    "section,metric,value,interpretation",
    `summary,global_schoenfeld_p,${result.summary.globalSchoenfeldP},"${result.interpretations.ph}"`,
    `summary,epv,${result.summary.epv},"${result.interpretations.epv}"`,
    `summary,c_index,${result.summary.cIndex},"${result.interpretations.discrimination}"`,
    ...result.ph.covariates.map((item) => `ph,${item.covariate},p=${item.pValue},"${item.recommendation}"`),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${result.jobId}-validasi-cox.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success("CSV validasi Cox dibuat");
}
