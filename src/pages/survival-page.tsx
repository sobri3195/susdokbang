import { useQuery } from "@tanstack/react-query";
import { Activity, Download, PlayCircle } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { queryFns } from "@/lib/queries";
import type { CoxResult } from "@/lib/types";

export function SurvivalPage() {
  const { data } = useQuery({ queryKey: ["survival"], queryFn: queryFns.survival });
  const coxRows = data?.coxResults ?? [];
  const survival = data?.survivalCurve ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analitik survival"
        title="Cox Regression & Kaplan-Meier"
        description="Konfigurasi model waktu-hingga-penurunan kelaikan terbang, koefisien hazard ratio, interval kepercayaan, dan kurva survival per strata risiko."
        actions={<Button variant="accent"><PlayCircle />Jalankan Model</Button>}
      />

      <Card>
        <CardHeader><CardTitle>Konfigurasi Model</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Select defaultValue="2016-2026">
            <SelectTrigger><SelectValue placeholder="Periode" /></SelectTrigger>
            <SelectContent><SelectItem value="2016-2026">2016-2026</SelectItem><SelectItem value="2021-2026">2021-2026</SelectItem></SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger><SelectValue placeholder="Populasi" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Semua penerbang</SelectItem><SelectItem value="tempur">Penerbang tempur</SelectItem></SelectContent>
          </Select>
          <Select defaultValue="efron">
            <SelectTrigger><SelectValue placeholder="Ties" /></SelectTrigger>
            <SelectContent><SelectItem value="efron">Efron</SelectItem><SelectItem value="breslow">Breslow</SelectItem></SelectContent>
          </Select>
          <Button variant="outline"><Download />Export Hasil</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <ChartCard title="Forest Plot Hazard Ratio" description="Nilai HR di atas 1 meningkatkan risiko event, di bawah 1 bersifat protektif.">
          <div className="space-y-4">
            {coxRows.map((item) => (
              <ForestRow key={item.faktor} item={item} />
            ))}
          </div>
        </ChartCard>
        <ChartCard title="Kurva Survival Kaplan-Meier" description="Probabilitas bertahan laik terbang berdasarkan strata risiko gabungan.">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={survival}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="bulan" label={{ value: "Bulan observasi", position: "insideBottom", offset: -4 }} />
                <YAxis domain={[0.3, 1]} tickFormatter={(value) => `${Math.round(Number(value) * 100)}%`} />
                <Tooltip formatter={(value) => `${Math.round(Number(value) * 100)}%`} />
                <Legend />
                <Line type="stepAfter" dataKey="survival" data={survival.filter((item) => item.group === "Risiko Rendah")} name="Risiko Rendah" stroke="#0f766e" strokeWidth={2.5} dot={false} />
                <Line type="stepAfter" dataKey="survival" data={survival.filter((item) => item.group === "Risiko Sedang")} name="Risiko Sedang" stroke="#d97706" strokeWidth={2.5} dot={false} />
                <Line type="stepAfter" dataKey="survival" data={survival.filter((item) => item.group === "Risiko Tinggi")} name="Risiko Tinggi" stroke="#dc2626" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <Card>
        <CardHeader><CardTitle>Tabel Risk-Set</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Bulan</TableHead><TableHead>Risiko Rendah</TableHead><TableHead>Risiko Sedang</TableHead><TableHead>Risiko Tinggi</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {[0, 24, 48, 72, 96, 120].map((bulan) => (
                <TableRow key={bulan}>
                  <TableCell className="font-semibold">{bulan}</TableCell>
                  <TableCell>{survival.find((item) => item.bulan === bulan && item.group === "Risiko Rendah")?.riskSet}</TableCell>
                  <TableCell>{survival.find((item) => item.bulan === bulan && item.group === "Risiko Sedang")?.riskSet}</TableCell>
                  <TableCell>{survival.find((item) => item.bulan === bulan && item.group === "Risiko Tinggi")?.riskSet}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DataTable
        data={coxRows}
        columns={[
          { accessorKey: "faktor", header: "Faktor" },
          { accessorKey: "hazardRatio", header: "HR", cell: ({ row }) => <span className="tabular">{row.original.hazardRatio.toFixed(2)}</span> },
          { accessorKey: "ciLow", header: "CI 95%", cell: ({ row }) => <span className="tabular">{row.original.ciLow.toFixed(2)} - {row.original.ciHigh.toFixed(2)}</span> },
          { accessorKey: "pValue", header: "p-value", cell: ({ row }) => <span className="tabular">{row.original.pValue.toFixed(3)}</span> },
          { accessorKey: "arah", header: "Arah", cell: ({ row }) => <Badge variant={row.original.arah === "Risiko" ? "danger" : "success"}>{row.original.arah}</Badge> },
        ]}
      />
    </div>
  );
}

function ForestRow({ item }: { item: CoxResult }) {
  const min = 0.4;
  const max = 3.0;
  const pct = (value: number) => ((value - min) / (max - min)) * 100;
  return (
    <div className="grid gap-2 md:grid-cols-[13rem_1fr_5rem] md:items-center">
      <div>
        <p className="text-sm font-semibold">{item.faktor}</p>
        <p className="text-xs text-muted-foreground">p={item.pValue.toFixed(3)}</p>
      </div>
      <div className="relative h-8 rounded-md bg-muted">
        <div className="absolute left-[23%] top-0 h-full w-px bg-foreground/50" />
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-accent" style={{ left: `${pct(item.ciLow)}%`, right: `${100 - pct(item.ciHigh)}%` }} />
        <div className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary" style={{ left: `${pct(item.hazardRatio)}%` }} />
      </div>
      <p className="tabular text-right text-sm font-bold">{item.hazardRatio.toFixed(2)}</p>
    </div>
  );
}
