import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, AlertTriangle, Download, Plane, PlayCircle, RefreshCcw, ShieldCheck, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { ChartCard } from "@/components/shared/chart-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { queryFns } from "@/lib/queries";
import { startDemoSidang } from "@/lib/demo-flow";
import { formatNumber } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";

export function DashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const resetDemoData = useDataStore((state) => state.resetDemoData);
  const { data, isLoading, isFetching, refetch } = useQuery({ queryKey: ["dashboard"], queryFn: queryFns.dashboard });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-36" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const dashboardData = data;
  const total = dashboardData.penerbang.length;
  const event = dashboardData.penerbang.filter((pilot) => pilot.status !== "Laik").length;
  const avgHours = dashboardData.penerbang.reduce((sum, pilot) => sum + pilot.totalJam, 0) / total;
  const highRisk = dashboardData.penerbang.filter((pilot) => pilot.riskScore >= 55).length;

  function syncData() {
    void refetch();
    void queryClient.invalidateQueries({ queryKey: ["penerbang"] });
    void queryClient.invalidateQueries({ queryKey: ["mcu"] });
    void queryClient.invalidateQueries({ queryKey: ["psikotes"] });
    void queryClient.invalidateQueries({ queryKey: ["jam-terbang"] });
    toast.success("Data dashboard tersinkronisasi");
  }

  function resetData() {
    resetDemoData();
    void queryClient.invalidateQueries();
    toast.success("Data demo dikembalikan ke kondisi awal");
  }

  function exportAuditCsv() {
    const rows = [
      "metric,value",
      `penerbang_aktif,${total}`,
      `event_kelaikan,${event}`,
      `risiko_tinggi,${highRisk}`,
      `rata_rata_jam,${Math.round(avgHours)}`,
      ...dashboardData.penerbang.map((pilot) => `pilot_${pilot.nrp},"${pilot.nama} | ${pilot.status} | risk ${pilot.riskScore}"`),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "csakt-dashboard-audit.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV audit dashboard dibuat");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Executive dashboard"
        title="Pemantauan Kelaikan Terbang 2016-2026"
        description="Ringkasan operasional untuk populasi penerbang, tren event kelaikan, dan indikator risiko aeromedis berbasis integrasi data."
        actions={
          <>
            <Button variant="outline" onClick={resetData}>Reset Demo</Button>
            <Button variant="outline" onClick={() => startDemoSidang(navigate)}><PlayCircle />Mode Demo Sidang</Button>
            <Button variant="accent" onClick={syncData} disabled={isFetching}>
              <RefreshCcw className={isFetching ? "animate-spin" : ""} />
              Sinkronisasi Data
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Penerbang Aktif" value={formatNumber(total)} delta="+6,3% dari periode sebelumnya" icon={Users} tone="primary" />
        <StatCard label="Event Kelaikan" value={formatNumber(event)} delta="Termasuk observasi dan tidak laik" icon={AlertTriangle} tone="warning" />
        <StatCard label="Risiko Tinggi" value={formatNumber(highRisk)} delta="Skor risiko >= 55" icon={Activity} tone={highRisk > 2 ? "danger" : "accent"} />
        <StatCard label="Rata-rata Jam" value={formatNumber(Math.round(avgHours))} delta="Akumulasi logbook per penerbang" icon={Plane} tone="success" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <ChartCard title="Tren Kelaikan Tahunan" description="Jumlah penerbang laik, observasi, dan event penurunan kelaikan per tahun.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.yearlyTrend}>
                <defs>
                  <linearGradient id="laik" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="laik" name="Laik" stroke="#0f766e" fill="url(#laik)" />
                <Area type="monotone" dataKey="observasi" name="Observasi" stroke="#d97706" fill="#d9770624" />
                <Area type="monotone" dataKey="event" name="Event" stroke="#dc2626" fill="#dc262624" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Distribusi Risiko" description="Skor risiko gabungan model survival dan profil klinis.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.penerbang.map((pilot) => ({ nama: pilot.nama.split(" ")[2] ?? pilot.id, risiko: pilot.riskScore }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nama" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="risiko" name="Skor Risiko" radius={[6, 6, 0, 0]} fill="#155e75" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      <div className="aero-panel rounded-xl border p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-accent">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Audit readiness
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Semua angka memakai data dummy realistis untuk mode demo. Endpoint PHP tersedia untuk mengganti mock dengan MySQL/MariaDB.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportAuditCsv}><Download />Export Audit</Button>
            <Button variant="outline" asChild><Link to="/laporan">Lihat Laporan Audit</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
