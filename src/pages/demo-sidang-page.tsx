import { ArrowRight, CheckCircle2, ClipboardCheck, FileSearch, PlayCircle, Presentation, Route, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { demoSidangSteps, startDemoSidang } from "@/lib/demo-flow";

export function DemoSidangPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Presentation mode"
        title="Mode Demo Sidang CSAKT"
        description="Satu tombol untuk menjalankan narasi demo end-to-end: import data dummy, quality gate, validasi Cox, survival analysis, detail penerbang, dan cluster job terdistribusi."
        actions={
          <Button variant="accent" size="lg" onClick={() => startDemoSidang(navigate)}>
            <PlayCircle />
            Mulai Demo Sidang
          </Button>
        }
      />

      <Card className="border-l-4 border-l-accent">
        <CardContent className="grid gap-4 p-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-accent">
              <Presentation className="size-4" aria-hidden="true" />
              Alur presentasi yang disarankan
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Gunakan tombol di atas saat pembukaan demo. Sistem akan berpindah halaman otomatis setiap beberapa detik sehingga penguji melihat alur operasional, metodologis, klinis, dan bukti arsitektur terdistribusi dalam satu cerita.
            </p>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <Signal icon={ClipboardCheck} label="Data siap" value="Quality gate" />
            <Signal icon={FileSearch} label="Model siap" value="Validasi Cox" />
            <Signal icon={ShieldCheck} label="Audit siap" value="Cluster & laporan" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {demoSidangSteps.map((step, index) => (
          <Card key={step.path}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">{index + 1}</span>
                    {step.label}
                  </CardTitle>
                  <CardDescription className="mt-2">{step.description}</CardDescription>
                </div>
                <Badge variant={index < 2 ? "success" : index < 4 ? "info" : "warning"}>{index < 2 ? "data" : index < 4 ? "model" : "audit"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Route className="size-4" aria-hidden="true" />
                {step.path}
              </div>
              <Button variant="outline" asChild>
                <Link to={step.path}>
                  Buka
                  <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Checklist Narasi Saat Demo</CardTitle>
          <CardDescription>Poin singkat yang dapat disebutkan saat halaman berpindah.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {[
            "Data MCU, psikotes, dan jam terbang masuk melalui import cerdas dan divalidasi sebelum analitik.",
            "Quality gate mencegah data bermasalah langsung dipakai model Cox.",
            "Validasi Cox membuktikan model diperiksa dari sisi PH, EPV, missingness, bootstrap, dan residual.",
            "Survival analysis menerjemahkan faktor determinan menjadi HR, CI 95%, p-value, dan kurva survival.",
            "Detail penerbang menjawab kenapa skor risiko muncul melalui timeline dan explainability.",
            "Cluster & Jobs membuktikan komputasi berat didistribusikan ke worker Python melalui queue.",
          ].map((item) => (
            <div key={item} className="flex gap-3 rounded-xl border p-3 text-sm">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              <span>{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Signal({ icon: Icon, label, value }: { icon: typeof ClipboardCheck; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <Icon className="mb-2 size-4 text-accent" aria-hidden="true" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}
