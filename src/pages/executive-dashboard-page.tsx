import { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, BarChart3, CheckCircle2, Database, LineChart, RadioTower, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { queryFns } from "@/lib/queries";
import type { Penerbang } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

type ExecutiveUnitRow = {
  skadron: string;
  total: number;
  event: number;
  highRisk: number;
  avgRisk: number;
  status: "Stabil" | "Perlu Atensi" | "Kritis";
};

function buildUnitRows(pilots: Penerbang[]): ExecutiveUnitRow[] {
  const grouped = new Map<string, { total: number; riskTotal: number; event: number; highRisk: number }>();
  pilots.forEach((pilot) => {
    const current = grouped.get(pilot.skadron) ?? { total: 0, riskTotal: 0, event: 0, highRisk: 0 };
    current.total += 1;
    current.riskTotal += pilot.riskScore;
    current.event += pilot.status === "Laik" ? 0 : 1;
    current.highRisk += pilot.riskScore >= 55 ? 1 : 0;
    grouped.set(pilot.skadron, current);
  });

  return Array.from(grouped.entries())
    .map(([skadron, value]) => {
      const avgRisk = Math.round(value.riskTotal / value.total);
      return {
        skadron,
        total: value.total,
        event: value.event,
        highRisk: value.highRisk,
        avgRisk,
        status: avgRisk >= 65 || value.event >= 2 ? "Kritis" : avgRisk >= 45 || value.highRisk >= 1 ? "Perlu Atensi" : "Stabil",
      } satisfies ExecutiveUnitRow;
    })
    .sort((a, b) => b.avgRisk - a.avgRisk);
}

export function ExecutiveDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["dashboard"], queryFn: queryFns.dashboard });
  const { data: cluster } = useQuery({ queryKey: ["distributed-cluster"], queryFn: queryFns.distributedCluster });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const total = data.penerbang.length;
  const event = data.penerbang.filter((pilot) => pilot.status !== "Laik").length;
  const highRisk = data.penerbang.filter((pilot) => pilot.riskScore >= 55).length;
  const unitRows = buildUnitRows(data.penerbang);
  const riskiestUnit = unitRows[0]?.skadron ?? "-";
  const completedJobs = cluster?.jobs.filter((job) => job.status === "completed").length ?? 0;
  const activeWorkers = cluster?.activeWorkers ?? 0;

  const pipeline = [
    { label: "Import Data", status: "Siap", detail: "Mapping dan validasi awal aktif", icon: Database, tone: "success" },
    { label: "Quality Gate", status: event > 0 ? "Perlu Atensi" : "Stabil", detail: "Missingness, duplikasi, dan outlier dipantau", icon: AlertTriangle, tone: event > 0 ? "warning" : "success" },
    { label: "Analitik Survival", status: "Tersedia", detail: "Ringkasan Cox dan tren event agregat", icon: LineChart, tone: "info" },
    { label: "Cluster Jobs", status: activeWorkers ? "Online" : "Menunggu", detail: `${activeWorkers} worker aktif, ${completedJobs} job selesai`, icon: RadioTower, tone: activeWorkers ? "success" : "warning" },
  ];

  const columns: ColumnDef<ExecutiveUnitRow>[] = [
    { accessorKey: "skadron", header: "Satuan", cell: ({ row }) => <span className="font-semibold">{row.original.skadron}</span> },
    { accessorKey: "total", header: "Total", cell: ({ row }) => <span className="tabular">{formatNumber(row.original.total)}</span> },
    { accessorKey: "event", header: "Event", cell: ({ row }) => <span className="tabular">{formatNumber(row.original.event)}</span> },
    { accessorKey: "highRisk", header: "Risiko Tinggi", cell: ({ row }) => <span className="tabular">{formatNumber(row.original.highRisk)}</span> },
    { accessorKey: "avgRisk", header: "Rata-rata Risiko", cell: ({ row }) => <span className="tabular font-semibold">{row.original.avgRisk}</span> },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant={row.original.status === "Kritis" ? "danger" : row.original.status === "Perlu Atensi" ? "warning" : "success"}>{row.original.status}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard pimpinan"
        title="Ringkasan Eksekutif Kelaikan Terbang"
        description="Tampilan agregat untuk pengambilan keputusan: KPI, tren event, satuan berisiko, dan status pipeline tanpa detail medis individual."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Penerbang" value={formatNumber(total)} delta="Populasi aktif periode observasi" icon={Users} tone="primary" />
        <StatCard label="Event Kelaikan" value={formatNumber(event)} delta="Agregat observasi/terbatas/tidak laik" icon={AlertTriangle} tone="warning" />
        <StatCard label="Risiko Tinggi" value={formatNumber(highRisk)} delta="Tanpa membuka data klinis individual" icon={Activity} tone={highRisk > 2 ? "danger" : "accent"} />
        <StatCard label="Satuan Prioritas" value={riskiestUnit} delta="Berdasarkan rata-rata skor risiko" icon={BarChart3} tone="success" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <ChartCard title="Tren Event Kelaikan" description="Ringkasan tahunan untuk briefing pimpinan dan monitoring kesiapan.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.yearlyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="laik" name="Laik" stroke="#0f766e" fill="#0f766e24" />
                <Area type="monotone" dataKey="observasi" name="Observasi" stroke="#d97706" fill="#d9770624" />
                <Area type="monotone" dataKey="event" name="Event" stroke="#dc2626" fill="#dc262624" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Rata-rata Risiko per Satuan" description="Agregat satuan, bukan data penerbang individual.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitRows}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="skadron" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgRisk" name="Rata-rata Risiko" radius={[6, 6, 0, 0]} fill="#155e75" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Status pipeline">
        {pipeline.map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent/12 text-accent">
                <item.icon className="size-5" aria-hidden="true" />
              </div>
              <Badge variant={item.tone === "warning" ? "warning" : item.tone === "info" ? "info" : "success"}>{item.status}</Badge>
            </div>
            <p className="mt-4 text-sm font-bold">{item.label}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </section>

      <DataTable
        columns={columns}
        data={unitRows}
        searchPlaceholder="Cari satuan..."
        error={error}
        onRetry={() => void refetch()}
        emptyTitle="Belum ada agregat satuan"
        emptyDescription="Data agregat pimpinan belum tersedia. Jalankan import atau mode demo untuk membangun ringkasan."
      />

      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-semibold text-foreground">
          <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
          Proteksi tampilan pimpinan
        </p>
        <p className="mt-2">
          Halaman ini sengaja menampilkan agregat kesiapan dan pipeline saja. Identitas penerbang, hasil MCU, psikotes, dan rekomendasi klinis detail tetap berada di role dokter/analis yang berwenang.
        </p>
      </div>
    </div>
  );
}
