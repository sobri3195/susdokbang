import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { penerbang } from "@/lib/mock-data";

export function ReportsPage() {
  function exportCsv() {
    const rows = ["NRP,Nama,Satuan,Status,Total Jam,Skor Risiko", ...penerbang.map((pilot) => `${pilot.nrp},"${pilot.nama}",${pilot.skadron},${pilot.status},${pilot.totalJam},${pilot.riskScore}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "csakt-ringkasan-penerbang.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV berhasil dibuat");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pelaporan"
        title="Generate & Export Laporan"
        description="Pusat laporan untuk ringkasan kelaikan, hasil survival, faktor determinan, dan lampiran data sumber."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <ReportCard title="Ringkasan Eksekutif" description="PDF ringkas untuk pimpinan satuan dan komite aeromedis." icon={FileText} action="Generate PDF" />
        <ReportCard title="Dataset Penerbang" description="CSV data master penerbang dan skor risiko model." icon={FileSpreadsheet} action="Export CSV" onClick={exportCsv} />
        <ReportCard title="Lampiran Analitik" description="Tabel HR, CI 95%, p-value, dan risk-set Kaplan-Meier." icon={Download} action="Export Bundle" />
      </div>
      <Card>
        <CardHeader><CardTitle>Template Laporan</CardTitle></CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground">
          <p>1. Sampul instansi dan metadata periode observasi.</p>
          <p>2. Ringkasan KPI dan tren event kelaikan.</p>
          <p>3. Metode data integration, endpoint sumber, dan audit trail.</p>
          <p>4. Hasil Cox regression, interpretasi HR, serta rekomendasi tindak lanjut.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportCard({ title, description, icon: Icon, action, onClick }: { title: string; description: string; icon: typeof FileText; action: string; onClick?: () => void }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex size-12 items-center justify-center rounded-xl bg-accent/12 text-accent">
          <Icon className="size-6" aria-hidden="true" />
        </div>
        <h3 className="mt-4 font-bold">{title}</h3>
        <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{description}</p>
        <Button className="mt-4 w-full" variant="outline" onClick={onClick ?? (() => toast.info("Generator PDF siap dihubungkan ke backend produksi."))}>
          {action}
        </Button>
      </CardContent>
    </Card>
  );
}
