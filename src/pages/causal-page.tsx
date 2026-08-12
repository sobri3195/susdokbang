import { ArrowRight, BrainCircuit, Database, HeartPulse, Plane, TimerReset } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const nodes = [
  { label: "Usia & Riwayat", icon: TimerReset, tone: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100" },
  { label: "MCU", icon: HeartPulse, tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" },
  { label: "Psikotes", icon: BrainCircuit, tone: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200" },
  { label: "Jam Terbang", icon: Plane, tone: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200" },
  { label: "Penurunan Kelaikan", icon: Database, tone: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" },
];

export function CausalPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analitik kausal"
        title="Faktor Determinan Kelaikan Terbang"
        description="DAG konseptual untuk memetakan hubungan faktor klinis, psikologis, paparan terbang, dan event penurunan kelaikan terbang."
      />
      <Card>
        <CardHeader>
          <CardTitle>DAG Kausal Operasional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-5 lg:items-center">
            {nodes.map((node, index) => (
              <div key={node.label} className="flex items-center gap-4 lg:flex-col">
                <div className={`flex min-h-28 w-full flex-col justify-center rounded-xl border p-4 ${node.tone}`}>
                  <node.icon className="mb-3 size-6" aria-hidden="true" />
                  <p className="font-bold">{node.label}</p>
                </div>
                {index < nodes.length - 1 ? <ArrowRight className="hidden size-6 text-muted-foreground lg:block" aria-hidden="true" /> : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Confounder utama", "Usia, jenis pesawat, masa dinas, riwayat metabolik"],
          ["Mediator potensial", "Stress index, sleep debt, workload misi malam"],
          ["Outcome", "Observasi, terbatas, tidak laik, atau rekomendasi grounded"],
        ].map(([title, text]) => (
          <Card key={title}>
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent>
              <Badge variant="info">Model v0.9</Badge>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
